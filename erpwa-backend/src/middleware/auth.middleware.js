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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vendorId: true,
        vendor: {
          select: {
            subscriptionEnd: true,
            subscriptionStart: true,
            whatsappStatus: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
