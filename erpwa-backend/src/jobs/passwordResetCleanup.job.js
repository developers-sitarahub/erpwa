import cron from "node-cron";
import pool from "../db/index.js";

/**
 * Runs every hour
 * Deletes expired password reset links & OTPs
 */
export function startPasswordResetCleanupJob() {
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await pool.query(`
        DELETE FROM password_reset_links WHERE expires_at < NOW();
        DELETE FROM password_reset_otps WHERE expires_at < NOW();
      `);

      console.log("🧹 Password reset cleanup executed");
    } catch (err) {
      console.error("❌ Password reset cleanup failed:", err.message);
    }
  });
}
