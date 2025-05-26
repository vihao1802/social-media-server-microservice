export const generateVerifyEmailHtml = (
  userName: string,
  verificationLink: string,
): string => {
  return `
    <html>
      <body>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 15 minutes.</p>
      </body>
    </html>
  `;
};
