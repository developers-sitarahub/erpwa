import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const ACCESS_TOKEN_EXPIRES = "15m";

export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      vendorId: user.vendor_id,
      role: user.role,
      type: "access",
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}
