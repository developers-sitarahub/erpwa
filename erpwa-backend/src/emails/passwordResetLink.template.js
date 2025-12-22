export function passwordResetLinkTemplate({ name, resetLink }) {
  return {
    subject: "Reset your password",
    text: `
Hello ${name},

You requested to reset your password.

Use the link below (valid for 1 hour):
${resetLink}

If you didn’t request this, you can ignore this email.
`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="500" style="background:#ffffff; padding:20px; border-radius:6px;">
            <tr>
              <td>
                <h2>Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>You requested to reset your password.</p>

                <p style="text-align:center; margin:30px 0;">
                  <a href="${resetLink}"
                     style="background:#16a34a; color:#ffffff; padding:12px 20px;
                            text-decoration:none; border-radius:4px; display:inline-block;">
                    Reset Password
                  </a>
                </p>

                <p>This link is valid for <strong>1 hour</strong>.</p>
                <p>If you didn’t request this, you can safely ignore this email.</p>

                <p style="font-size:12px; color:#777;">
                  Do not share this link with anyone.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
  };
}
