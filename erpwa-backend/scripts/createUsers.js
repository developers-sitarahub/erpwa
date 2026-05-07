import "dotenv/config";
import prisma from "../src/prisma.js";
import { hashPassword } from "../src/utils/password.js";

async function main() {
  const passwordHash = await hashPassword("Eqweasd@123");

  const entities = [
    {
      vendorName: "GPSERP Support",
      user: {
        email: "support@gpserp.com",
        name: "GPSERP Support",
        role: "vendor_owner",
      }
    },
    {
      vendorName: "GPSERP Marketing",
      user: {
        email: "admin@gpserp.com",
        name: "GPSERP Marketing",
        role: "vendor_owner",
      }
    }
  ];

  for (const entity of entities) {
    // 1️⃣ Create Vendor
    const vendor = await prisma.vendor.create({
      data: {
        name: entity.vendorName,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date("2099-12-31T23:59:59.999Z"), // Unlimited access
      },
    });

    console.log(`✅ Vendor created: ${vendor.name} (${vendor.id})`);

    // 2️⃣ Create user linked to vendor
    await prisma.user.create({
      data: {
        email: entity.user.email,
        name: entity.user.name,
        role: entity.user.role,
        passwordHash,
        vendorId: vendor.id,
        onboardingStatus: "activated",
      },
    });

    console.log(`✅ Created ${entity.user.role}: ${entity.user.email} under vendor ${vendor.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
