// Run: node scripts/seed-plans.js
// Seeds or updates subscription plans with correct durationDays and isActive

import prisma from "../src/prisma.js";

const plans = [
    { name: "Free", price: 0, conversationLimit: 100, galleryLimit: 50, chatbotLimit: 1, templateLimit: 5, formLimit: 2, teamUsersLimit: 1 },
    { name: "Basic", price: 29, conversationLimit: 1000, galleryLimit: 500, chatbotLimit: 3, templateLimit: 20, formLimit: 5, teamUsersLimit: 3 },
    { name: "Unlimited", price: 299, conversationLimit: -1, galleryLimit: -1, chatbotLimit: -1, templateLimit: -1, formLimit: -1, teamUsersLimit: -1 },
];

async function seedPlans() {
  console.log("Seeding subscription plans...");
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { name: plan.name } });
    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { name: plan.name },
        data: plan,
      });
      console.log(`✅ Updated: ${plan.name}`);
    } else {
      await prisma.subscriptionPlan.create({ data: plan });
      console.log(`✅ Created: ${plan.name}`);
    }
  }
  console.log("Done!");
  await prisma.$disconnect();
}

seedPlans().catch((e) => {
  console.error(e);
  process.exit(1);
});
