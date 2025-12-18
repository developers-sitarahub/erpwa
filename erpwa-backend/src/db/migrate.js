import pool from "./index.js";

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("Starting DB migration...");

    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        whatsapp_business_id VARCHAR(100),
        whatsapp_access_token TEXT,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        parent_id UUID REFERENCES lead_categories(id),
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone_number VARCHAR(20) NOT NULL,
        category_id UUID REFERENCES lead_categories(id),
        assigned_to UUID REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        direction VARCHAR(10),
        content TEXT,
        whatsapp_message_id VARCHAR(100),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID REFERENCES vendors(id),
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        has_media BOOLEAN DEFAULT false,
        admin_only BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log("✅ Migration completed successfully");
  } catch (err) {
    console.error("❌ Migration failed", err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
