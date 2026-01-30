
import "dotenv/config";
import prisma from "../src/prisma.js";

async function main() {
    const phone = "917558496659";

    console.log("--- LOOKING FOR LEAD ---");
    const lead = await prisma.lead.findFirst({
        where: { phoneNumber: { contains: phone } }
    });
    console.log("Lead:", lead);

    console.log("\n--- LOOKING FOR USERS ---");
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true }
    });
    console.log("Users:", users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
