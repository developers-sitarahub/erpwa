export function vendorActivatedWithPasswordTemplate({ name, email, password }) {
  return {
    subject: "Your Account is Activated - Login Details Inside",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #00E676; padding-bottom: 20px; margin-bottom: 20px; }
          .title { color: #00E676; font-size: 24px; font-weight: bold; margin: 0; }
          .content { font-size: 16px; line-height: 1.6; color: #555; }
          .bold { font-weight: bold; color: #333; }
          .creds-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 15px; }
          .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00E676; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 4px; }
          .footer { margin-top: 30px; font-size: 12px; color: #aaa; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Account Activated ✅</h1>
          </div>
          <div class="content">
            <p>Hi <span class="bold">${name}</span>,</p>
            <p>Great news! Your vendor account has been successfully verified and activated by our team.</p>
            <p>Below are your temporary login credentials. We strongly recommend changing your password after you log in.</p>
            
            <div class="creds-box">
              <div><strong>Email:</strong> ${email}</div>
              <div style="margin-top: 8px;"><strong>Password:</strong> ${password}</div>
            </div>

            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">Log In Now</a>
            </center>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GPS ERP. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
