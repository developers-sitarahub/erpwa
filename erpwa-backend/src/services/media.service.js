import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3({
  buffer,
  mimeType,
  vendorId,
  conversationId,
  extension,
}) {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not set");
  }

  if (!process.env.CLOUDFRONT_BASE_URL) {
    throw new Error("CLOUDFRONT_BASE_URL is not set");
  }

  const key = `vendors/${vendorId}/conversations/${conversationId}/${uuid()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${process.env.CLOUDFRONT_BASE_URL}/${key}`;
}
