import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const images = await prisma.galleryImage.findMany({
        orderBy: { id: 'desc' },
        take: 5
    });

    console.log('--- Recent Gallery Images ---');
    images.forEach(img => {
        console.log(`ID: ${img.id}`);
        console.log(`Title: ${img.title}`);
        console.log(`S3 URL (first 100 chars): ${img.s3Url ? img.s3Url.substring(0, 100) : 'null'}...`);
        console.log(`S3 Key: ${img.s3Key}`);
        console.log('-----------------------------');
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
