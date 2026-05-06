import prisma from './src/prisma.js';

async function main() {
  try {
    const pricing = await prisma.whatsappPricing.findMany();
    console.log(JSON.stringify(pricing, null, 2));
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
