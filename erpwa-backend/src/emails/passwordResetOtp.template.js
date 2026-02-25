export function passwordResetOtpTemplate({ name, otp }) {
  return {
    subject: `${otp} is your WhatsApp ERP verification code`,
    text: `
Hello ${name},

Your verification code for WhatsApp ERP is: ${otp}

This code is valid for 10 minutes. Do not share it with anyone.

If you did not request this, please ignore this email.

— WhatsApp ERP
`,
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification Code</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="520" cellpadding="0" cellspacing="0" role="presentation"
                 style="background:#ffffff; border-radius:12px; overflow:hidden;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width:520px; width:100%;">

            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                          padding: 28px 32px; text-align:center;">
                <p style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">
                  WhatsApp ERP
                </p>
                <p style="margin:6px 0 0; color:#a0aec0; font-size:13px;">
                  Super Admin Portal
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px 28px;">
                <p style="margin:0 0 8px; font-size:16px; color:#1a202c; font-weight:600;">
                  Hello ${name},
                </p>
                <p style="margin:0 0 28px; font-size:14px; color:#718096; line-height:1.6;">
                  Use the verification code below to confirm your identity and proceed with changing your password.
                </p>

                <!-- OTP Box -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center">
                      <div style="background:#f7f8fa; border:2px solid #e2e8f0; border-radius:10px;
                                  padding: 20px 32px; display:inline-block; margin-bottom:28px;">
                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase;
                                  letter-spacing:1.5px; color:#a0aec0; font-weight:600;">
                          Verification Code
                        </p>
                        <p style="margin:0; font-size:38px; font-weight:800; letter-spacing:12px;
                                  color:#1a202c; font-variant-numeric:tabular-nums;">
                          ${otp}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px; font-size:13px; color:#718096; text-align:center;">
                  ⏱ This code expires in <strong style="color:#1a202c;">10 minutes</strong>.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 32px;">
                <hr style="border:none; border-top:1px solid #edf2f7; margin:0;" />
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px 28px;">
                <p style="margin:0; font-size:12px; color:#a0aec0; line-height:1.6;">
                  If you did not request this code, you can safely ignore this email.
                  Someone may have typed your email address by mistake.
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
