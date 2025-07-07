import type { Request, Response } from "express";
import { EmailService } from "./email-service";

/**
 * Handle incoming emails from SendGrid Inbound Parse webhook
 * 
 * SendGrid will send a multipart/form-data request with the following fields:
 * - headers: Email headers
 * - dkim: DKIM signature
 * - to: Recipient email
 * - html: HTML body
 * - from: Sender email
 * - text: Plain text body
 * - subject: Email subject
 * - attachments: Array of attachments (if any)
 * - envelope: JSON string with from and to addresses
 * 
 * When setting up SendGrid Inbound Parse:
 * 1. Add MX records for a subdomain (like mail.yourdomain.com) pointing to SendGrid's inbound servers
 * 2. Set up Inbound Parse in SendGrid to forward emails to this webhook endpoint
 */
export async function handleInboundEmail(req: Request, res: Response) {
  try {
    // Validate the request
    if (!req.body) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    console.log("Received inbound email webhook", {
      subject: req.body.subject,
      from: req.body.from,
      to: req.body.to,
      hasHtml: !!req.body.html,
      hasText: !!req.body.text,
    });

    // Parse envelope if available (it's a JSON string)
    let fromEmail = req.body.from;
    let toEmail = req.body.to;
    
    try {
      if (req.body.envelope) {
        const envelope = JSON.parse(req.body.envelope);
        if (envelope.from) fromEmail = envelope.from;
        if (envelope.to && envelope.to.length > 0) toEmail = envelope.to[0];
      }
    } catch (err) {
      console.warn("Failed to parse envelope", err);
    }

    // Extract email data from the webhook payload
    const emailData = {
      from: fromEmail,
      to: toEmail,
      subject: req.body.subject || "(No subject)",
      body: req.body.html || req.body.text || "",
      html: req.body.html || "",
      text: req.body.text || "",
      textBody: req.body.text || "",
      date: new Date(),
      // Additional fields that might be available
      charsets: req.body.charsets,
      spf: req.body.spf,
      headers: req.body.headers,
    };

    // Handle attachments if any
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      // Add attachments property to emailData
      (emailData as any).attachments = req.body.attachments.map((attachment: any) => ({
        filename: attachment.name,
        content: attachment.content,
        contentType: attachment.type,
      }));
    }

    // Process the email through our import system
    const result = await EmailService.importEmailResponses([emailData]);

    if (!result.success) {
      console.warn("Failed to process inbound email", result);
      // Still return 200 to prevent SendGrid from retrying
      return res.status(200).json({
        message: "Email received but could not be processed",
        errors: result.errors
      });
    }

    return res.status(200).json({
      message: "Email processed successfully",
      imported: result.imported
    });
  } catch (error) {
    console.error("Error handling inbound email webhook:", error);
    // Always return 200 for webhook, even on error, to prevent retries
    return res.status(200).json({
      message: "Error processing webhook",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}