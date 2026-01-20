export function passwordResetOtpTemplate({ name, otp }) {
  return {
    subject: "Your password reset OTP",
    text: `
Hello ${name},

Your OTP for password reset is: ${otp}

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
          <table width="500" style="background:#ffffff; padding:20px; border-radius:6px;">
            <tr>
              <td>
                <h2>OTP Verification</h2>
                <p>Hello ${name},</p>
                <p>Use the OTP below to continue resetting your password:</p>

                <p style="font-size:28px; font-weight:bold; text-align:center; letter-spacing:4px;">
                  ${otp}
                </p>

                <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                <p style="font-size:12px; color:#777;">
                  Never share this code with anyone.
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
