import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Verifies the Razorpay payment signature after a successful payment.
 * Used in verify-payment endpoint.
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

/**
 * Verifies the Razorpay webhook signature.
 * Used in webhook endpoint — rawBody must be the raw Buffer/string before JSON.parse.
 */
export function verifyWebhookSignature(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expectedSignature === signature;
}
