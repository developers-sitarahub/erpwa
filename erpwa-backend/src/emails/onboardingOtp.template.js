export function onboardingOtpTemplate({ name, otp }) {
  return {
    subject: "Your Registration OTP for WhatsApp SaaS Platform",
    text: `
Hello ${name},

Welcome to the platform! Your OTP for email verification is: ${otp}

This OTP is valid for 10 minutes.
Do not share this code with anyone.
`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="500" style="background:#ffffff; padding:20px; border-radius:6px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tr>
              <td>
                <h2 style="color: #333 text-align:center;">Welcome to the Platform!</h2>
                <p>Hello ${name},</p>
                <p>Thank you for starting your onboarding process. Use the OTP below to verify your email address:</p>

                <p style="font-size:32px; font-weight:bold; text-align:center; letter-spacing:6px; color: #000; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                  ${otp}
                </p>

                <p style="margin-top:20px;">This OTP is valid for <strong>10 minutes</strong>.</p>
                <p style="font-size:12px; color:#777; margin-top:20px;">
                  Never share this code with anyone. If you didn't request this email, please ignore it.
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
