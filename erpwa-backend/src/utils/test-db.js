import pool from "../db/index.js";

async function testDb() {
  try {
    const result = await pool.query("SELECT NOW() as now");

    console.log("✅ Test DB query successful");
    console.log("Server time:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Test DB query failed");
    console.error(error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testDb();
