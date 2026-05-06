/**
 * WhatsApp Pricing Configuration & Helper
 * 
 * Meta base pricing (India) + GPSERP platform markup.
 * Used to calculate per-conversation costs for vendor billing.
 */

import prisma from "../prisma.js";

// ─── Default India pricing (INR per conversation) ──────────────
const DEFAULT_META_PRICING = {
  service: 0.0,
  utility: 0.115,
  marketing: 0.8631,
  authentication: 0.115,
};

// ─── Platform markup per category ──────────────────────────────
const PLATFORM_MARKUP = {
  service: 0.00,
  utility: 0.00,
  marketing: 0.00,
  authentication: 0.00,
};

const DEFAULT_COUNTRY = "India";

/**
 * Get Meta's base price for a conversation category.
 * Checks WhatsappPricing table first, falls back to hardcoded defaults.
 *
 * @param {string} category - service | utility | marketing | authentication
 * @param {string} [country="India"]
 * @returns {Promise<number>} Meta cost in INR
 */
export async function getMetaPrice(category, country = DEFAULT_COUNTRY) {
  const normalizedCategory = category?.toLowerCase();

  if (!["service", "utility", "marketing", "authentication"].includes(normalizedCategory)) {
    return DEFAULT_META_PRICING.service;
  }

  return DEFAULT_META_PRICING[normalizedCategory];
}

/**
 * Get the platform markup for a conversation category.
 *
 * @param {string} category
 * @returns {number}
 */
export function getMarkup(category) {
  const normalizedCategory = category?.toLowerCase();
  return PLATFORM_MARKUP[normalizedCategory] ?? PLATFORM_MARKUP.service;
}

/**
 * Calculate the total charged cost = Meta base price + platform markup.
 *
 * @param {string} category
 * @param {string} [country="India"]
 * @returns {Promise<{ metaCost: number, markup: number, chargedCost: number }>}
 */
export async function calculateChargedCost(category, country = DEFAULT_COUNTRY) {
  const metaCost = await getMetaPrice(category, country);
  // Force zero markup as per user request
  return { metaCost, markup: 0, chargedCost: metaCost };
}

/**
 * Seed default India pricing into the database (idempotent).
 * Call this once during initial setup.
 */
export async function seedDefaultPricing() {
  try {
    await prisma.whatsappPricing.upsert({
      where: { country: DEFAULT_COUNTRY },
      update: {
        service: DEFAULT_META_PRICING.service,
        utility: DEFAULT_META_PRICING.utility,
        marketing: DEFAULT_META_PRICING.marketing,
        authentication: DEFAULT_META_PRICING.authentication,
      },
      create: {
        country: DEFAULT_COUNTRY,
        service: DEFAULT_META_PRICING.service,
        utility: DEFAULT_META_PRICING.utility,
        marketing: DEFAULT_META_PRICING.marketing,
        authentication: DEFAULT_META_PRICING.authentication,
      },
    });
    console.log("✅ Default WhatsApp pricing seeded for", DEFAULT_COUNTRY);
  } catch (err) {
    console.error("❌ Failed to seed default pricing:", err.message);
  }
}

export { DEFAULT_META_PRICING, PLATFORM_MARKUP, DEFAULT_COUNTRY };
