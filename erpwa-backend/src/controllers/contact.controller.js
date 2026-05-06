import prisma from "../prisma.js";
import { sendMail } from "../utils/mailer.js";

export const submitInquiry = async (req, res) => {
  try {
    const { name, email, message, company } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Please provide name, email and message." });
    }

    // 1. Log to Activity Logs for persistence without schema change
    await prisma.activityLog.create({
      data: {
        type: "contact_inquiry",
        status: "received",
        event: "website_inquiry",
        payload: {
          name,
          email,
          message,
          company: company || "N/A",
          source: "contact_form"
        }
      }
    });

    // 2. Send Email Notification
    // Note: In real production, this would go to process.env.SALES_EMAIL
    const salesEmail = "sales@gpserp.com"; 
    
    await sendMail({
      to: salesEmail,
      subject: `New Website Inquiry from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Company: ${company || 'N/A'}
        
        Message:
        ${message}
      `,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">New Website Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `
    }).catch(err => console.error("Failed to send contact email:", err));

    return res.status(200).json({ 
      success: true, 
      message: "Your inquiry has been received. Our team will contact you shortly." 
    });

  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ 
      message: "Internal server error. Please try again later." 
    });
  }
};
