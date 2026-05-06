import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(
      authHeader.split(" ")[1],
      process.env.ACCESS_TOKEN_SECRET,
    );

    // 🔑 Fetch user to get vendorId and subscription details
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        vendor: {
          include: {
            subscriptionPlan: true
          }
        }
      }
    });

    console.log("------------------------------------------");
    console.log("🚀 [AUTH_MIDDLEWARE] User:", user?.email);
    console.log("📦 [AUTH_MIDDLEWARE] Plan:", user?.vendor?.subscriptionPlan?.name || "MISSING");
    console.log("------------------------------------------");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
