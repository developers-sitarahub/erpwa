import prisma from "./src/prisma.js";
async function run() {
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // last message preview
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    take: 2,
  });
  console.log(JSON.stringify(conversations, null, 2));
}
run();
