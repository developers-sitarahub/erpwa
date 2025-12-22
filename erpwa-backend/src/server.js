import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import prisma from "./prisma.js";
import authRoutes from "./routes/auth.routes.js";

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

app.use("/api/auth", authRoutes);

/* ================= SERVER START ================= */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // ✅ Prisma DB health check
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
