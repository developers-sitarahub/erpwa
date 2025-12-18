import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // ✅ NEW PASSWORD
  database: "whatsapp_backend",
  ssl: false,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error", err);
});

export default pool;
