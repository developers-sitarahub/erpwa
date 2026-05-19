import "dotenv/config";
import prisma from "../src/prisma.js";
import { hashPassword } from "../src/utils/password.js";

async function main() {
  const passwordHash = await hashPassword("Password@123");

  // 1️⃣ Create Vendor FIRST
  const vendor = await prisma.vendor.create({
    data: {
      name: "GPSERP Support",
      subscriptionStart: new Date(),
      subscriptionEnd: new Date("2099-12-31T23:59:59.999Z"), // Unlimited access
    },
  });

  console.log("✅ Vendor created:", vendor.id);

  // 2️⃣ Create users linked to vendor
  const users = [
    // {
    //   email: "sohamsawalakhe@gmail.com",
    //   name: "Soham Sawalakhe",
    //   role: "vendor_admin",
    // },
    {
      email: "gauravrai3133@gmail.com",
      name: "Gaurav Rai",
      role: "vendor_owner",
    },
    // {
    //   email: "pradhanpratik219@gmail.com",
    //   name: "Pratik Pradhan",
    //   role: "vendor_admin",
    // },
    // {
    //   email: "support@gpserp.com",
    //   name: "GPSERP Support",
    //   role: "vendor_owner",
    // },
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
