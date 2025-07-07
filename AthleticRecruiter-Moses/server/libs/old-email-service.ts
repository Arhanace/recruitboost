// import { MailService } from '@sendgrid/mail';
// import { db } from './db';
// import { emails, users, coaches } from '@shared/schema';
// import { eq, and, lte } from 'drizzle-orm';
// import { storage } from './storage';
// import { createGmailClient, makeRawMessage } from "./libs/gmail";

// // Configure SendGrid
// const mailService = new MailService();
// if (process.env.SENDGRID_API_KEY) {
//   mailService.setApiKey(process.env.SENDGRID_API_KEY);
// } else {
//   console.warn("Warning: SENDGRID_API_KEY not set. Email functionality will be unavailable.");
// }

// export interface EmailSendParams {
//   from: string; // User's email
//   to: string; // Coach's email
//   subject: string;
//   html: string;
//   text?: string;
//   userId: number;
//   coachId: number;
//   templateId?: number;
//   isFollowUp?: boolean;
//   followUpDays?: number; // Number of days after which to send a follow-up
// }

// export interface EmailReceiveParams {
//   to: string; // User's email
//   from: string; // Coach's email
//   subject: string;
//   html: string;
//   text?: string;
//   userId: number;
//   coachId: number;
//   receivedAt: Date;
// }

// export class EmailService {
//   /**
//    * Send an email from a user to a coach
//    */
//   static async sendEmail(params: EmailSendParams): Promise<{ success: boolean; emailId?: number; followUpId?: number; error?: string }> {
//     try {
//       // Check if SendGrid API key is configured
//       if (!process.env.SENDGRID_API_KEY) {
//         return { 
//           success: false, 
//           error: "Email service is not configured. Please set SENDGRID_API_KEY environment variable." 
//         };
//       }

//       // Get user and coach to verify email addresses
//       const user = await storage.getUser(params.userId);
//       const coach = await storage.getCoach(params.coachId);

//       if (!user) {
//         return { success: false, error: "User not found" };
//       }

//       if (!coach) {
//         return { success: false, error: "Coach not found" };
//       }

//       // Prepare SendGrid message object
//       const msg = {
//         to: params.to,         // Coach's email address
//         from: params.from,     // User's email address (sender)
//         subject: params.subject,
//         html: params.html,
//         text: params.text || params.html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
//       };

//       // Send the email using SendGrid
//       await mailService.send(msg);

//       // Record the email in our database
//       const [emailRecord] = await db.insert(emails).values({
//         userId: params.userId,
//         coachId: params.coachId,
//         subject: params.subject,
//         body: params.html,
//         sentAt: new Date(),
//         status: 'sent',
//         direction: 'outbound',
//         templateId: params.templateId,
//         isFollowUp: params.isFollowUp || false
//       }).returning();

//       // If this is a regular email (not a follow-up) and has a followUpDays parameter,
//       // schedule a follow-up email
//       let followUpId: number | undefined;

//       if (params.followUpDays && !params.isFollowUp) {
//         const followUpResult = await this.scheduleFollowUpEmail({
//           parentEmailId: emailRecord.id,
//           userId: params.userId,
//           coachId: params.coachId,
//           subject: `Follow-up: ${params.subject}`,
//           body: this.generateFollowUpBody(params.html, user, coach),
//           scheduleDays: params.followUpDays
//         });

//         if (followUpResult.success) {
//           followUpId = followUpResult.emailId;
//         }
//       }

//       return {
//         success: true,
//         emailId: emailRecord.id,
//         followUpId
//       };
//     } catch (error) {
//       console.error("Email sending error:", error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to send email"
//       };
//     }
//   }

//   /**
//    * Send an email via Gmail API if available, otherwise SendGrid
//    */
//   static async sendEmail(params: EmailSendParams): Promise<{ success: boolean; emailId?: number; followUpId?: number; error?: string }> {
//     try {
//       // Load user record (includes gmailAccessToken if connected)
//       const user = await storage.getUser(params.userId);
//       if (!user) return { success: false, error: 'User not found' };

//       // Prepare personalized content and DB record
//       const coach = await storage.getCoach(params.coachId);
//       if (!coach) return { success: false, error: 'Coach not found' };

//       // Decide sending method: Gmail if token exists, else SendGrid
//       let sendResult;
//       const sender = params.from;
//       const receiver = params.to;

//       // Gmail API path
//       if (user.gmailAccessToken) {
//         try {
//           const gmail = createGmailClient(user.gmailAccessToken);
//           const raw = makeRawMessage(sender, receiver, params.subject, params.html);
//           const result = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
//           console.log('Gmail message sent:', result.data.id);
//           sendResult = { success: true };
//         } catch (gmailErr) {
//           console.error('Gmail API send error, falling back to SendGrid:', gmailErr);
//           sendResult = { success: false, error: gmailErr instanceof Error ? gmailErr.message : String(gmailErr) };
//         }
//       }

//       // Fallback to SendGrid if Gmail not configured or failed
//       if (!user.gmailAccessToken || !sendResult.success) {
//         if (!process.env.SENDGRID_API_KEY) {
//           return { success: false, error: 'No email provider configured' };
//         }
//         const msg = {
//           to: receiver,
//           from: sender,
//           subject: params.subject,
//           html: params.html,
//           text: params.text || params.html.replace(/<[^>]*>/g, '')
//         };
//         await mailService.send(msg);
//       }

//       // Record email
//       const [emailRecord] = await db.insert(emails).values({
//         userId: params.userId,
//         coachId: params.coachId,
//         subject: params.subject,
//         body: params.html,
//         sentAt: new Date(),
//         status: 'sent',
//         direction: 'outbound',
//         templateId: params.templateId,
//         isFollowUp: params.isFollowUp || false
//       }).returning();

//       let followUpId: number | undefined;
//       if (params.followUpDays && !params.isFollowUp) {
//         const scheduled = await this.scheduleFollowUpEmail({
//           parentEmailId: emailRecord.id,
//           userId: params.userId,
//           coachId: params.coachId,
//           subject: `Follow-up: ${params.subject}`,
//           body: this.generateFollowUpBody(params.html, user, coach),
//           scheduleDays: params.followUpDays
//         });
//         if (scheduled.success) followUpId = scheduled.emailId;
//       }

//       return { success: true, emailId: emailRecord.id, followUpId };
//     } catch (error) {
//       console.error('Email sending error:', error);
//       return { success: false, error: error instanceof Error ? error.message : String(error) };
//     }
//   }

//   /**
//    * Schedule a follow-up email to be sent in the future
//    */
//   static async scheduleFollowUpEmail(params: {
//     parentEmailId: number,
//     userId: number,
//     coachId: number,
//     subject: string,
//     body: string,
//     scheduleDays: number
//   }): Promise<{ success: boolean; emailId?: number; error?: string }> {
//     try {
//       // Calculate scheduled date
//       const scheduledDate = new Date();
//       scheduledDate.setDate(scheduledDate.getDate() + params.scheduleDays);

//       // Get user and coach
//       const user = await storage.getUser(params.userId);
//       const coach = await storage.getCoach(params.coachId);

//       if (!user) {
//         return { success: false, error: "User not found" };
//       }

//       if (!coach) {
//         return { success: false, error: "Coach not found" };
//       }

//       // Create the scheduled follow-up email record
//       const [scheduledEmail] = await db.insert(emails).values({
//         userId: params.userId,
//         coachId: params.coachId,
//         subject: params.subject,
//         body: params.body,
//         sentAt: scheduledDate, // This will be updated when actually sent
//         status: 'scheduled',
//         direction: 'outbound',
//         isFollowUp: true,
//         scheduledFor: scheduledDate,
//         parentEmailId: params.parentEmailId
//       }).returning();

//       // Log activity for scheduling a follow-up
//       await storage.createActivity({
//         userId: params.userId,
//         coachId: params.coachId,
//         type: "follow_up_scheduled",
//         description: `Follow-up email to ${coach.firstName} ${coach.lastName} scheduled for ${scheduledDate.toLocaleDateString()}`,
//         timestamp: new Date(),
//         metaData: {
//           emailId: scheduledEmail.id,
//           scheduledFor: scheduledDate,
//           parentEmailId: params.parentEmailId
//         }
//       });

//       return {
//         success: true,
//         emailId: scheduledEmail.id
//       };
//     } catch (error) {
//       console.error("Error scheduling follow-up email:", error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to schedule follow-up"
//       };
//     }
//   }

//   /**
//    * Generate a follow-up email body based on the original email
//    */
//   private static generateFollowUpBody(originalHtml: string, user: any, coach: any): string {
//     // This is a simple follow-up template
//     // In a real app, you might use AI to generate personalized follow-ups
//     return `
//       <p>Hi ${coach.firstName},</p>

//       <p>I wanted to follow up on my previous email about my interest in the ${coach.sport} program at ${coach.school}.</p>

//       <p>I'm still very interested in learning more about the program and would appreciate the opportunity to discuss how I could contribute to the team.</p>

//       <p>Thank you for your time and consideration.</p>

//       <p>Best regards,<br>${user.firstName} ${user.lastName}</p>
//     `;
//   }

//   /**
//    * Record a received email from a coach to a user
//    */
//   static async recordReceivedEmail(params: EmailReceiveParams): Promise<{ success: boolean; emailId?: number; error?: string }> {
//     try {
//       // Record the received email in our database
//       const [emailRecord] = await db.insert(emails).values({
//         userId: params.userId,
//         coachId: params.coachId,
//         subject: params.subject,
//         body: params.html,
//         sentAt: params.receivedAt,
//         receivedAt: new Date(), // When we processed/imported it
//         status: 'received',
//         direction: 'inbound'
//       }).returning();

//       return {
//         success: true,
//         emailId: emailRecord.id
//       };
//     } catch (error) {
//       console.error("Error recording received email:", error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to record received email"
//       };
//     }
//   }

//   /**
//    * Parse and import email responses from a webhook or file
//    * This method handles both SendGrid webhook data and manually imported responses
//    */
//   static async importEmailResponses(responseData: any[]): Promise<{ success: boolean; imported: number; errors: number }> {
//     let imported = 0;
//     let errors = 0;

//     for (const response of responseData) {
//       try {
//         console.log("Processing incoming email:", {
//           to: response.to,
//           from: response.from,
//           subject: response.subject || "(No subject)"
//         });

//         // Extract email addresses (handling various formats like "Name <email@example.com>")
//         const toEmail = this.extractEmailAddress(response.to);
//         const fromEmail = this.extractEmailAddress(response.from);

//         if (!toEmail || !fromEmail) {
//           console.warn(`Invalid email addresses - to: ${response.to}, from: ${response.from}`);
//           errors++;
//           continue;
//         }

//         // Find the user by email address (who received this email)
//         const [user] = await db.select().from(users).where(eq(users.email, toEmail));

//         if (!user) {
//           console.warn(`No user found with email ${toEmail}`);
//           errors++;
//           continue;
//         }

//         // Find the coach by email address (who sent this email)
//         const [coach] = await db.select().from(coaches).where(eq(coaches.email, fromEmail));

//         if (!coach) {
//           console.warn(`No coach found with email ${fromEmail}`);

//           // Advanced: Try to find previous outbound email from this user to this coach
//           // This helps handle cases where coaches reply from a different email address
//           const previousEmail = await db
//             .select({ coachId: emails.coachId })
//             .from(emails)
//             .innerJoin(coaches, eq(emails.coachId, coaches.id))
//             .where(and(
//               eq(emails.userId, user.id),
//               eq(emails.direction, 'outbound')
//             ))
//             .orderBy(emails.sentAt)
//             .limit(1);

//           if (previousEmail && previousEmail.length > 0) {
//             // If we found a previous email exchange, use that coach ID
//             const coachId = previousEmail[0].coachId;
//             const coach = await storage.getCoach(coachId);

//             if (coach) {
//               console.log(`Found previous email exchange with coach ID ${coachId}`);

//               // Record this as a received email
//               const result = await this.recordReceivedEmail({
//                 to: response.to,
//                 from: response.from,
//                 subject: response.subject || "(No subject)",
//                 html: response.body || response.html || "",
//                 text: response.textBody || response.text || "",
//                 userId: user.id,
//                 coachId: coach.id,
//                 receivedAt: response.date ? new Date(response.date) : new Date()
//               });

//               if (result.success) {
//                 imported++;

//                 // Create an activity record for this received email
//                 await storage.createActivity({
//                   userId: user.id,
//                   coachId: coach.id,
//                   type: "email_received",
//                   description: `Email received from ${coach.firstName} ${coach.lastName}`,
//                   timestamp: new Date(),
//                   metaData: {
//                     emailId: result.emailId,
//                     subject: response.subject || "(No subject)"
//                   }
//                 });

//                 continue; // Skip to next email
//               }
//             }
//           }

//           errors++;
//           continue;
//         }

//         // Record this as a received email
//         const result = await this.recordReceivedEmail({
//           to: response.to,
//           from: response.from,
//           subject: response.subject || "(No subject)",
//           html: response.body || response.html || "",
//           text: response.textBody || response.text || "",
//           userId: user.id,
//           coachId: coach.id,
//           receivedAt: response.date ? new Date(response.date) : new Date()
//         });

//         if (result.success) {
//           imported++;

//           // Create an activity record for this received email
//           await storage.createActivity({
//             userId: user.id,
//             coachId: coach.id,
//             type: "email_received",
//             description: `Email received from ${coach.firstName} ${coach.lastName}`,
//             timestamp: new Date(),
//             metaData: {
//               emailId: result.emailId,
//               subject: response.subject || "(No subject)"
//             }
//           });
//         } else {
//           errors++;
//         }
//       } catch (error) {
//         console.error("Error processing email response:", error);
//         errors++;
//       }
//     }

//     return {
//       success: imported > 0,
//       imported,
//       errors
//     };
//   }

//   /**
//    * Extract email address from various formats like "Name <email@example.com>" or just "email@example.com"
//    */
//   private static extractEmailAddress(emailString: string): string | null {
//     if (!emailString) return null;

//     // Try to match email in angle brackets format (Name <email@example.com>)
//     const angleMatch = emailString.match(/<([^>]+)>/);
//     if (angleMatch && angleMatch[1]) {
//       return angleMatch[1].trim().toLowerCase();
//     }

//     // Otherwise try to match a plain email address
//     const emailMatch = emailString.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
//     if (emailMatch && emailMatch[1]) {
//       return emailMatch[1].trim().toLowerCase();
//     }

//     return null;
//   }

//   /**
//    * Check the SendGrid domain authentication status
//    * This is necessary to send from user addresses
//    */
//   static async checkDomainAuthentication(): Promise<boolean> {
//     try {
//       // In a real app, you would check with SendGrid API
//       // if the domain is properly authenticated for sending

//       return !!process.env.SENDGRID_API_KEY;
//     } catch (error) {
//       console.error("Error checking domain authentication:", error instanceof Error ? error.message : error);
//       return false;
//     }
//   }

//   /**
//    * Process any scheduled follow-up emails that are due to be sent
//    * This should be called on a regular schedule (e.g., hourly)
//    */
//   static async processDueFollowUps(): Promise<{ sent: number; failed: number }> {
//     let sent = 0;
//     let failed = 0;

//     try {
//       // Find all scheduled emails that are due
//       const now = new Date();
//       const dueEmails = await db.select()
//         .from(emails)
//         .where(and(
//           eq(emails.status, 'scheduled'),
//           eq(emails.isFollowUp, true),
//           // Only emails where scheduledFor is in the past
//           lte(emails.scheduledFor, now)
//         ));

//       console.log(`Found ${dueEmails.length} follow-up emails due to be sent`);

//       // Process each due email
//       for (const email of dueEmails) {
//         try {
//           // Get the user and coach
//           const user = await storage.getUser(email.userId);
//           const coach = await storage.getCoach(email.coachId);

//           if (!user || !coach) {
//             console.error(`Failed to find user or coach for follow-up email ID ${email.id}`);
//             failed++;
//             continue;
//           }

//           // Send the follow-up email
//           const result = await this.sendEmail({
//             from: user.email || '',
//             to: coach.email || '',
//             subject: email.subject,
//             html: email.body,
//             userId: email.userId,
//             coachId: email.coachId,
//             isFollowUp: true
//           });

//           if (result.success) {
//             // Update the scheduled email to show it's been sent
//             await db.update(emails)
//               .set({
//                 status: 'sent',
//                 sentAt: new Date()
//               })
//               .where(eq(emails.id, email.id));

//             console.log(`Successfully sent follow-up email ID ${email.id}`);
//             sent++;

//             // Create an activity record
//             await storage.createActivity({
//               userId: user.id,
//               coachId: coach.id,
//               type: "follow_up_sent",
//               description: `Follow-up email sent to ${coach.firstName} ${coach.lastName}`,
//               timestamp: new Date(),
//               metaData: {
//                 emailId: result.emailId,
//                 scheduledEmailId: email.id
//               }
//             });
//           } else {
//             console.error(`Failed to send follow-up email ID ${email.id}: ${result.error}`);
//             failed++;
//           }
//         } catch (error) {
//           console.error(`Error processing follow-up email ID ${email.id}:`, error);
//           failed++;
//         }
//       }

//       return { sent, failed };
//     } catch (error) {
//       console.error("Error processing due follow-ups:", error);
//       return { sent, failed: failed + 1 };
//     }
//   }

//   /**
//    * Check for and process scheduled follow-up emails
//    * This method should be called regularly (e.g., on server start and then hourly)
//    */
//   static async checkAndSendScheduledFollowUps(): Promise<void> {
//     try {
//       console.log("Checking for due follow-up emails...");
//       const result = await this.processDueFollowUps();
//       console.log(`Follow-up email check complete. Sent: ${result.sent}, Failed: ${result.failed}`);
//     } catch (error) {
//       console.error("Error in scheduled follow-up check:", error);
//     }
//   }
// }