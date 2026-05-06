/**
 * Seed Script: WhatsApp Billing Default Pricing
 * 
 * Run: node src/scripts/seedWhatsappPricing.js
 * 
 * Seeds the default India pricing into the WhatsappPricing table.
 * Safe to run multiple times (uses upsert).
 */

import "dotenv/config";
import prisma from "../prisma.js";

const DEFAULT_PRICING = {
  country: "India",
  service: 0.0,
  utility: 0.115,
  marketing: 0.8631,
  authentication: 0.115,
};

async function seed() {
  try {
    const result = await prisma.whatsappPricing.upsert({
      where: { country: DEFAULT_PRICING.country },
      update: {
        service: DEFAULT_PRICING.service,
        utility: DEFAULT_PRICING.utility,
        marketing: DEFAULT_PRICING.marketing,
        authentication: DEFAULT_PRICING.authentication,
      },
      create: DEFAULT_PRICING,
    });

    console.log("✅ WhatsApp default pricing seeded:", result);

    // Verify
    const all = await prisma.whatsappPricing.findMany();
    console.log("📋 All pricing records:", all);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
