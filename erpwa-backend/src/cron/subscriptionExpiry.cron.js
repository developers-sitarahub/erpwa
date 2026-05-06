import cron from "node-cron";
import prisma from "../prisma.js";
import { sendMail } from "../utils/mailer.js";

/**
 * Runs every hour to check for expired subscriptions
 */
cron.schedule(
  "0 * * * *", // Run at minute 0 of every hour
  async () => {
    try {
      const now = new Date();

      // Find all vendors whose subscription has ended and who haven't received an email yet
      const expiredVendors = await prisma.vendor.findMany({
        where: {
          subscriptionEnd: {
            lte: now, // Target those whose end date is past
          },
          subscriptionExpiredMailSent: false, // Ensure we only send once
        },
        include: {
          users: {
            where: {
              role: "vendor_owner", // Send to the vendor owner
            },
            take: 1, // Get the primary owner
          },
        },
      });

      if (expiredVendors.length === 0) return;

      console.log(`⏳ Found ${expiredVendors.length} expired subscriptions. Sending emails...`);

      // Process each expired vendor
      for (const vendor of expiredVendors) {
        const owner = vendor.users[0];
        
        if (owner && owner.email) {
          const vendorName = vendor.name || owner.name || "Valued User";
          const frontendUrl = process.env.FRONTEND_URL || "https://app.gpserp.com";

          const subject = "⚠️ Your GPS ERP Subscription Has Expired";
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #d9534f;">Your Subscription Has Expired</h2>
              <p>Hello <strong>${vendorName}</strong>,</p>
              <p>This is a notification that your GPS ERP WhatsApp platform subscription has expired.</p>
              <p>We want to sincerely <strong>thank you</strong> for using our platform. We hope you've had a great experience leveraging WhatsApp automation to grow your business.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2563EB; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #2563EB;">Update Your Plan</h3>
                <p style="margin-bottom: 20px;">To regain access and to keep your workflows running smoothly, please update your subscription plan.</p>
                <a href="${frontendUrl}/login" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In & Update Plan</a>
              </div>

              <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #f0ad4e; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #d58512;">We Value Your Feedback!</h3>
                <p>Could you take a minute to let us know how we did? Your feedback helps us improve.</p>
                <a href="mailto:support@gpserp.com?subject=Feedback: ${vendorName}&body=Hi GPS ERP team,%0A%0AHere is my feedback on your platform:%0A%0A" style="color: #d58512; font-weight: bold; text-decoration: underline;">Provide Feedback</a>
              </div>

              <p>If you have any questions or need an extension, please feel free to reach out to our support team.</p>
              <br/>
              <p>Best regards,<br/><strong>GPS ERP Team</strong></p>
            </div>
          `;

          try {
            await sendMail({
              to: owner.email,
              subject,
              html,
            });

            // Mark the email as sent in the database
            await prisma.vendor.update({
              where: { id: vendor.id },
              data: { subscriptionExpiredMailSent: true },
            });

            console.log(`✅ Expiration email sent successfully to ${owner.email} (${vendor.id})`);
          } catch (mailError) {
            console.error(`❌ Failed to send expiration email to ${owner.email}:`, mailError);
          }
        } else {
          // If no owner or no email, just mark as sent to avoid repeated loops
          await prisma.vendor.update({
            where: { id: vendor.id },
            data: { subscriptionExpiredMailSent: true },
          });
        }
      }
    } catch (err) {
      console.error("❌ Error in subscription expiry cron job:", err);
    }
  },
  {
    scheduled: true,
  }
);
