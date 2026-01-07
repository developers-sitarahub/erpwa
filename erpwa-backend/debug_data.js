import "dotenv/config";
import prisma from "./src/prisma.js";

async function checkData() {
    console.log("--- USERS ---");
    const users = await prisma.user.findMany({
        include: { vendor: true }
    });
    users.forEach(u => {
        console.log(`User: ${u.email} (Role: ${u.role}) -> Vendor: ${u.vendorId} (${u.vendor?.name})`);
    });

    console.log("\n--- TEMPLATES ---");
    const templates = await prisma.template.findMany({
        include: { vendor: true }
    });
    templates.forEach(t => {
        console.log(`Template: ${t.displayName} (${t.status}) -> Vendor: ${t.vendorId} (${t.vendor?.name})`);
    });
}

checkData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
