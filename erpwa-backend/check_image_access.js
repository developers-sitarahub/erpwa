
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

async function checkUrl(url) {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('http')) {
            resolve({ status: 'Invalid URL', code: 0 });
            return;
        }

        https.get(url, (res) => {
            resolve({ status: res.statusCode === 200 ? 'OK' : 'Error', code: res.statusCode });
        }).on('error', (e) => {
            resolve({ status: 'Network Error', code: 0, error: e.message });
        });
    });
}

async function main() {
    try {
        const image = await prisma.galleryImage.findFirst({
            orderBy: { id: 'desc' }
        });

        if (!image) {
            console.log('❌ No images found in database.');
            return;
        }

        console.log('--- Latest Image Diagnostic ---');
        console.log(`ID: ${image.id}`);
        console.log(`Title: ${image.title}`);
        console.log(`S3 URL (DB): ${image.s3Url}`);
        console.log(`S3 Key: ${image.s3Key}`);

        if (image.s3Url) {
            console.log(`\nTesting access to: ${image.s3Url}`);
            const result = await checkUrl(image.s3Url);
            console.log(`HTTP Status: ${result.code} (${result.status})`);

            if (result.code === 403) {
                console.log('\n❌ ERROR: 403 Forbidden');
                console.log('👉 CAUSE: Your S3 bucket is blocking public access.');
                console.log('👉 FIX: Please follow the S3_SETUP_GUIDE.md to add a Bucket Policy.');
            } else if (result.code === 200) {
                console.log('\n✅ SUCCESS: Image is accessible!');
                console.log('👉 If you cannot see it in frontend, check your Category filters.');
            } else {
                console.log(`\n⚠️ Issue: Received status ${result.code}`);
            }
        } else {
            console.log('\n❌ Image has no S3 URL.');
        }

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
