import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import prisma from "./prisma.js";
import authRoutes from "./routes/auth.routes.js";
import vendorWhatsappRoutes from "./routes/vendorWhatsapp.route.js";
import vendorWhatsappMessageRoutes from "./routes/vendorWhatsappMessage.route.js";
import whatsappWebhookRoutes from "./routes/whatsappWebhook.route.js";
import whatsappTestRoutes from "./routes/whatsappTest.route.js";
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.set("etag", false);

/* ================= ROUTES ================= */
app.get("/ping", (req, res) => res.send("pong"));

app.use("/api/auth", authRoutes);

// Vendor WhatsApp (setup, config, send message)
app.use("/api/whatsapp-test", whatsappTestRoutes);
app.use("/api/vendor", vendorWhatsappRoutes);
app.use("/api/vendor/whatsapp", vendorWhatsappMessageRoutes);

// WhatsApp Webhook (Meta → Your server)
app.use("/webhook", whatsappWebhookRoutes);

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error);
    process.exit(1);
  }
}

startServer();
