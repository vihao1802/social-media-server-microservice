export const generateOtpEmailHtml = (userName: string, otp: string): string => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${userName},</h2>
        <p>We received a request to reset your password.</p>
        <p><strong>Your OTP code is:</strong></p>
        <div style="font-size: 24px; font-weight: bold; margin: 10px 0; color: #2c3e50;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br />
        <p>Best regards,<br />Your Support Team</p>
      </body>
    </html>
  `;
};
