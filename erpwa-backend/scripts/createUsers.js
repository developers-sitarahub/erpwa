import "dotenv/config";
import prisma from "../src/prisma.js";
import { hashPassword } from "../src/utils/password.js";

async function main() {
  const passwordHash = await hashPassword("Eqweasd@123");

  const unlimitedPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: "Unlimited" }
  });

  if (!unlimitedPlan) {
    throw new Error("Unlimited plan not found in database. Run initPlans.js first.");
  }

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
    // 1 month from now
    const subEnd = new Date();
    subEnd.setMonth(subEnd.getMonth() + 1);

    // 1️⃣ Create Vendor
    const vendor = await prisma.vendor.create({
      data: {
        name: entity.vendorName,
        subscriptionStart: new Date(),
        subscriptionEnd: subEnd, // 1 month access
        subscriptionPlanId: unlimitedPlan.id,
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
