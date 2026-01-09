import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.replace('@terminal:powershell', '').trim() : undefined,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.replace('@terminal:powershell', '').trim() : undefined,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "erp-devmedia";
const CLOUDFRONT_BASE_URL = process.env.CLOUDFRONT_BASE_URL || "https://d2xewl4dlr9aio.cloudfront.net";

/**
 * Generate a presigned URL for a file
 * @param {string} key - S3 key
 * @returns {Promise<string>} - Presigned URL
 */
export async function generatePresignedUrl(key) {
    if (!key) return null;
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        // URL expires in 1 hour (3600 seconds)
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return null;
    }
}

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folder - S3 folder path (e.g., 'gallery', 'products')
 * @returns {Promise<{s3Key: string, s3Url: string, cloudfrontUrl: string}>}
 */
export async function uploadToS3(
    fileBuffer,
    originalName,
    mimeType,
    folder = "gallery"
) {
    try {
        // Generate unique filename
        const fileExtension = path.extname(originalName);
        const fileName = `${uuidv4()}${fileExtension}`;
        const s3Key = `${folder}/${fileName}`;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: mimeType,
            // ACL removed as bucket does not allow it (Bucket Owner Enforced)
        });

        await s3Client.send(command);

        // Generate URLs
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        const cloudfrontUrl = `${CLOUDFRONT_BASE_URL}/${s3Key}`;

        return {
            s3Key,
            s3Url,
            cloudfrontUrl,
        };
    } catch (error) {
        console.error("S3 upload error:", error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
}

/**
 * Upload multiple files to S3 in parallel
 * @param {Array<{buffer: Buffer, originalName: string, mimeType: string}>} files
 * @param {string} folder
 * @returns {Promise<Array<{s3Key: string, s3Url: string, cloudfrontUrl: string, originalName: string}>>}
 */
export async function uploadMultipleToS3(files, folder = "gallery") {
    try {
        // Process uploads in batches of 10 to avoid overwhelming the server
        const batchSize = 10;
        const results = [];

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(async (file) => {
                const result = await uploadToS3(
                    file.buffer,
                    file.originalName,
                    file.mimeType,
                    folder
                );
                return {
                    ...result,
                    originalName: file.originalName,
                };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    } catch (error) {
        console.error("S3 batch upload error:", error);
        throw new Error(`Failed to upload files to S3: ${error.message}`);
    }
}

/**
 * Delete a file from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<void>}
 */
export async function deleteFromS3(s3Key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error("S3 delete error:", error);
        // Don't throw error, just log it - we don't want to fail DB operations if S3 delete fails
    }
}

/**
 * Delete multiple files from S3
 * @param {string[]} s3Keys - Array of S3 object keys
 * @returns {Promise<void>}
 */
export async function deleteMultipleFromS3(s3Keys) {
    try {
        if (!s3Keys || s3Keys.length === 0) return;

        // S3 DeleteObjects can handle up to 1000 objects at once
        const batchSize = 1000;

        for (let i = 0; i < s3Keys.length; i += batchSize) {
            const batch = s3Keys.slice(i, i + batchSize);

            const command = new DeleteObjectsCommand({
                Bucket: BUCKET_NAME,
                Delete: {
                    Objects: batch.map((key) => ({ Key: key })),
                    Quiet: true,
                },
            });

            await s3Client.send(command);
        }
    } catch (error) {
        console.error("S3 batch delete error:", error);
        // Don't throw error, just log it
    }
}

/**
 * Extract S3 key from S3 URL or CloudFront URL
 * @param {string} url
 * @returns {string|null}
 */
export function extractS3KeyFromUrl(url) {
    if (!url) return null;

    try {
        // Handle CloudFront URL
        if (url.includes(CLOUDFRONT_BASE_URL)) {
            return url.replace(`${CLOUDFRONT_BASE_URL}/`, "");
        }

        // Handle S3 URL
        if (url.includes(".s3.") && url.includes(".amazonaws.com/")) {
            const parts = url.split(".amazonaws.com/");
            return parts[1];
        }

        return null;
    } catch (error) {
        console.error("Error extracting S3 key:", error);
        return null;
    }
}