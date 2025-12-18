import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool from "./db/index.js";

const PORT = process.env.PORT;

async function startServer() {
  try {
    // 🔹 Test DB connection
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    console.log("✅ Database connected successfully");

    // 🔹 Start server only if DB is OK
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database");
    console.error(error);
    process.exit(1); // stop app if DB fails
  }
}

startServer();
