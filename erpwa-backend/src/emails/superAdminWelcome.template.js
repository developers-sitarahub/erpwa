/**
 * Super Admin Welcome Email Template
 * Sent after successful registration via the CLI tool.
 */
export function superAdminWelcomeTemplate({ name, email }) {
  return {
    subject: "Welcome to GPS ERP — Your Super Admin Account is Ready",
    text: `
Hello ${name},

Your Super Admin account has been successfully created.

Email   : ${email}
Role    : Super Admin
Login   : http://localhost:3000/admin-login

Keep your credentials safe. If you need to change your password,
use the Settings > Change Password flow after logging in.

— GPS ERP System
`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="520" style="background:#ffffff; padding:32px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td>
                <h1 style="color:#1a1a2e; margin:0 0 8px;">GPS ERP</h1>
                <p style="color:#6b7280; margin:0 0 24px; font-size:14px;">Super Admin Portal</p>
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:0 0 24px;" />

                <h2 style="color:#1a1a2e; margin:0 0 16px;">Welcome, ${name}!</h2>
                <p style="color:#374151; line-height:1.6;">
                  Your Super Admin account has been successfully created and is ready to use.
                </p>

                <table style="background:#f9fafb; border-radius:6px; padding:16px; margin:20px 0; width:100%;">
                  <tr>
                    <td style="color:#6b7280; font-size:13px; padding:4px 0;">Email</td>
                    <td style="color:#111827; font-weight:600; font-size:13px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280; font-size:13px; padding:4px 0;">Role</td>
                    <td style="color:#111827; font-weight:600; font-size:13px;">Super Admin</td>
                  </tr>
                </table>

                <a href="http://localhost:3000/admin-login"
                   style="display:inline-block; background:#6366f1; color:#ffffff;
                          text-decoration:none; padding:12px 28px; border-radius:6px;
                          font-weight:600; font-size:14px; margin:8px 0;">
                  Login to ERP
                </a>

                <p style="color:#9ca3af; font-size:12px; margin-top:24px; line-height:1.5;">
                  Keep your credentials secure. To change your password after login,
                  go to <strong>Settings → Change Password</strong>.
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
