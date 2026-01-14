import { processImageQueue } from "./whatsappImage.worker.js";

processImageQueue().catch((err) => {
  console.error("❌ Image worker crashed:", err);
  process.exit(1);
});
