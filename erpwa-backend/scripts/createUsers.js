import "dotenv/config"; // 👈 IMPORTANT
import prisma from "../src/prisma.js";
import { hashPassword } from "../src/utils/password.js";

// ✅ DEBUG: check if DATABASE_URL is loaded
console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL value:", process.env.DATABASE_URL);

async function main() {
  const passwordHash = await hashPassword("Password@123");

  const users = [
    {
      email: "gauravrai3133@gmail.com",
      name: "Gaurav Rai",
      role: "vendor_owner",
    },
    {
      email: "pradhanpratik219@gmail.com",
      name: "Pratik Pradhan",
      role: "vendor_admin",
    },
    {
      email: "developers@sitarahub.com",
      name: "Sitarahub Developers",
      role: "sales",
    },
  ];

  for (const user of users) {
    const exists = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!exists) {
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          passwordHash,
        },
      });

      console.log(`✅ Created user: ${user.email}`);
    } else {
      console.log(`⚠️ User already exists: ${user.email}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
