// ...existing code...
import crypto from "crypto";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
