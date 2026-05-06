import prisma from '../src/prisma.js';

async function main() {
  const India = await prisma.whatsappPricing.findUnique({
    where: { country: 'India' }
  });
  console.log('Current India Pricing in DB:', India);

  const updated = await prisma.whatsappPricing.upsert({
    where: { country: 'India' },
    update: {
      service: 0.0,
      utility: 0.115,
      marketing: 0.8631,
      authentication: 0.115,
    },
    create: {
      country: 'India',
      service: 0.0,
      utility: 0.115,
      marketing: 0.8631,
      authentication: 0.115,
    },
  });
  console.log('Updated India Pricing in DB:', updated);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
