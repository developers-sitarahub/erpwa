import "dotenv/config"; 
import { sendMail } from "./src/utils/mailer.js";

(async () => {
  try {
    await sendMail({
      to: "gauravrai3133@gmail.com",
      subject: "SMTP Test",
      text: "SMTP is working correctly",
      html: "<b>SMTP is working correctly</b>",
    });

    console.log("✅ SMTP email sent successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ SMTP test failed:", err);
    process.exit(1);
  }
})();
