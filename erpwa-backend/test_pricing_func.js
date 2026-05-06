import { calculateChargedCost } from './src/utils/whatsappPricing.js';

async function main() {
  const result = await calculateChargedCost("marketing", "India");
  console.log("Marketing Cost:", result);
  
  const serviceResult = await calculateChargedCost("service", "India");
  console.log("Service Cost:", serviceResult);
}

main().catch(console.error);
