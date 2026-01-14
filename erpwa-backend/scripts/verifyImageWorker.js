import prisma from "../src/prisma.js";

async function verifyImageWorker() {
  console.log("🧪 Verifying WhatsApp Image Worker...");

  const conversation = await prisma.conversation.findFirst({
    where: {
      channel: "whatsapp",
      sessionExpiresAt: { gt: new Date() },
    },
    include: {
      lead: true,
      vendor: true,
    },
  });

  if (!conversation) throw new Error("No active conversation");

  const image = await prisma.galleryImage.findFirst({
    where: { vendorId: conversation.vendorId },
  });

  if (!image) throw new Error("No gallery image");

  // ✅ STEP 1: Create Message
  const message = await prisma.message.create({
    data: {
      vendorId: conversation.vendorId,
      conversationId: conversation.id,
      direction: "outbound",
      channel: "whatsapp",
      messageType: "image",
      status: "queued",
    },
  });

  // ✅ STEP 2: Create Media
  const media = await prisma.messageMedia.create({
    data: {
      messageId: message.id,
      mediaType: "image",
      mimeType: "image/jpeg",
      mediaUrl: image.s3Url,
      caption: image.title ?? "Worker verification test",
    },
  });

  // ✅ STEP 3: Create Delivery (NOW Prisma is satisfied)
  const delivery = await prisma.messageDelivery.create({
    data: {
      messageId: message.id,
      messageMediaId: media.id,
      conversationId: conversation.id,
      status: "queued",
    },
  });

  console.log("✅ Message:", message.id);
  console.log("📦 Media:", media.id);
  console.log("🚚 Delivery:", delivery.id);

  console.log("🎯 Verification complete");
}

verifyImageWorker()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Verification failed:", err.message);
    process.exit(1);
  });
