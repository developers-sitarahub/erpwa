/**
 * Interactive CLI for one-time Super Admin registration.
 * Run: npm run create:super-admin
 *
 * - Prompts for name, email, password (hidden), confirm password
 * - Validates all inputs
 * - Creates the SuperAdmin record in the DB (blocked if one already exists)
 * - Sends a welcome email via Resend
 */

import "dotenv/config";
import readline from "readline";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import { sendMail } from "../utils/mailer.js";
import { superAdminWelcomeTemplate } from "../emails/superAdminWelcome.template.js";

/* ─── Helpers ─────────────────────────────────────────────── */

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/** Read a password from stdin with * masking (works on Windows PowerShell). */
function askPassword(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    let password = "";

    const onData = (buf) => {
      const char = buf.toString("utf8");
      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        // Ctrl+C
        process.stdout.write("\n");
        process.exit(0);
      } else if (char === "\u007f" || char === "\b") {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + "*".repeat(password.length));
        }
      } else {
        password += char;
        process.stdout.write("*");
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const BORDER = "╔══════════════════════════════════════════════╗";
const MID    = "╠══════════════════════════════════════════════╣";
const END    = "╚══════════════════════════════════════════════╝";

/* ─── Main ────────────────────────────────────────────────── */

console.log("\n" + BORDER);
console.log("║   GPS ERP — Super Admin Registration CLI    ║");
console.log(END + "\n");

// Block if super admin already exists
const existing = await prisma.superAdmin.findFirst();
if (existing) {
  console.log("⚠️  A Super Admin already exists in the database.");
  console.log(`   Email: ${existing.email}`);
  console.log("\n   To change the password, use Settings → Change Password after logging in.");
  console.log("   To reset everything, delete the record from Prisma Studio first.\n");
  await prisma.$disconnect();
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Collect inputs
const name = (await ask(rl, "👤 Full Name   : ")).trim();
const email = (await ask(rl, "📧 Email       : ")).trim();
rl.close();

const password = await askPassword("🔒 Password    : ");
const confirm  = await askPassword("🔒 Confirm     : ");

// Validate
const errors = [];
if (!name)                          errors.push("  • Name is required");
if (!email)                         errors.push("  • Email is required");
else if (!isValidEmail(email))      errors.push("  • Email format is invalid");
if (!password)                      errors.push("  • Password is required");
else if (password.length < 8)       errors.push("  • Password must be at least 8 characters");
if (password !== confirm)           errors.push("  • Passwords do not match");

if (errors.length > 0) {
  console.error("\n❌  Validation failed:\n" + errors.join("\n") + "\n");
  await prisma.$disconnect();
  process.exit(1);
}

// Check email uniqueness
const byEmail = await prisma.superAdmin.findUnique({ where: { email } });
if (byEmail) {
  console.error(`\n❌  A Super Admin with email "${email}" already exists.\n`);
  await prisma.$disconnect();
  process.exit(1);
}

try {
  // Create record
  console.log("\n⏳ Creating account...");
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.superAdmin.create({
    data: { name, email, passwordHash },
  });

  // Send welcome email
  console.log("⏳ Sending welcome email...");
  const mailResult = await sendMail({
    to: email,
    ...superAdminWelcomeTemplate({ name, email }),
  });

  if (mailResult.error) {
    console.warn("⚠️  Account created but welcome email failed:", mailResult.error.message);
  } else {
    console.log(`✅ Welcome email sent to: ${email}`);
  }

  console.log("\n" + BORDER);
  console.log("║           ✅ SUPER ADMIN CREATED!            ║");
  console.log(MID);
  console.log(`║  Name  : ${admin.name.padEnd(36)}║`);
  console.log(`║  Email : ${admin.email.padEnd(36)}║`);
  console.log(MID);
  console.log("║  Login at: localhost:3000/admin-login        ║");
  console.log(END + "\n");
} catch (err) {
  console.error("\n❌ Failed to create Super Admin:", err.message, "\n");
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
