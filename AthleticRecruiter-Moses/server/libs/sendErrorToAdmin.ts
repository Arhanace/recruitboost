
import { createGmailClientForUser, makeRawMessage } from './gmail'; // assumes this exists

export async function sendErrorToAdmin(user: any, subject: string, error: Error | string | any) {

  // Try to send via user's Gmail
  if (user?.gmailAccessToken && user?.gmailRefreshToken) {
    try {
      const gmail = createGmailClientForUser({
        gmailAccessToken: user.gmailAccessToken,
        gmailRefreshToken: user.gmailRefreshToken,
        gmailTokenExpiry: user.gmailTokenExpiry,
      });
      
      const htmlBody = `
        <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #d9534f;">🚨 Error Log</h2>
            <p>Hello Admin,</p>
            <p>An error occurred during a leadership assessment submission.</p>
            <p><strong>User ID:</strong> ${JSON.stringify(user?.id)}</p>
            <p><strong>Error Details:</strong></p>
            <pre style="background-color: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto;">
      ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)} ${JSON.stringify(error)}
            </pre>
            <p>Best Regards,<br><strong>Leadership Assessment Team</strong></p>
            <hr />
            <p style="font-size: 12px; color: #888;">&copy; 2025 The North Node Leader. All rights reserved.</p>
          </div>
        </body>
      `;


      const raw = makeRawMessage(
        user.email,
        "muzardemoses@gmail.com",
        subject,
        htmlBody,
      );

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      console.log("Error email sent using user's Gmail");
      return;
    } catch (gmailErr) {
      console.error("Failed to send via user's Gmail. Falling back...", gmailErr);
    }
  }

  console.log("Sending error email to admin...",  user.gmailAccessToken, "gmailAccessToken", user.gmailRefreshToken, "gmailRefreshToken", user.gmailTokenExpiry,)

  // Fallback to your system email
  // try {
  //   const transporter = nodemailer.createTransport({
  //     host: "smtp.gmail.com",
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: process.env.SMTP_USER,
  //       pass: process.env.SMTP_PASS,
  //     },
  //   });

  //   await transporter.sendMail({
  //     from: `"Error Reporter" <${process.env.SMTP_USER}>`,
  //     to: "muzardemmoses@gmail.com",
  //     subject: `[Error] ${subject}`,
  //     text: message,
  //   });

  //   console.log("Error email sent from system email");
  // } catch (fallbackErr) {
  //   console.error("Failed to send fallback error email:", fallbackErr);
  // }
}
