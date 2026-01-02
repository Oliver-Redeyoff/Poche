import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('RESEND_API_KEY not set - password reset emails will not be sent');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email sender address - update this to your verified domain
const FROM_EMAIL = process.env.EMAIL_FROM || 'Poche <noreply@poche.to>';

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ 
  to, 
  resetUrl 
}: SendPasswordResetEmailParams): Promise<void> {
  if (!resend) {
    console.error('Cannot send password reset email: RESEND_API_KEY not configured');
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Poche Password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #EF4056; margin: 0; font-size: 32px;">Poche</h1>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
  
  <p>We received a request to reset the password for your Poche account. Click the button below to choose a new password:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #EF4056; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
  
  <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${resetUrl}" style="color: #EF4056; word-break: break-all;">${resetUrl}</a>
  </p>
</body>
</html>
    `,
    text: `
Reset Your Poche Password

We received a request to reset the password for your Poche account.

Click the link below to choose a new password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    `.trim(),
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  console.log(`Password reset email sent to ${to}`);
}

