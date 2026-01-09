import imageCompression from "browser-image-compression";

/* ===============================
   WhatsApp Media Limits
=============================== */
export const MEDIA_LIMITS_MB = {
  image: 5,
  video: 16,
  audio: 16,
  document: 100,
};

/* ===============================
   Detect Media Type
=============================== */
export function getMediaType(file: File): keyof typeof MEDIA_LIMITS_MB {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

/* ===============================
   Image Compression
=============================== */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MEDIA_LIMITS_MB.image, // 5MB
    maxWidthOrHeight: 1920, // Increased from 1600 for better quality
    useWebWorker: true,
    initialQuality: 0.95, // Increased from 0.8
    fileType: "image/jpeg",
    preserveExif: false,
  };

  const compressed = await imageCompression(file, options);

  // Create a new File with .jpg extension to ensure S3/Backend sees it correctly
  const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
  const finalFile = new File([compressed], newName, { type: "image/jpeg" });

  console.log("🖼 Image compressed:", {
    before: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    after: `${(finalFile.size / 1024 / 1024).toFixed(2)} MB`,
  });

  return finalFile;
}

/* ===============================
   Main Processor (REUSABLE)
=============================== */
export async function processMedia(file: File): Promise<{
  file: File;
  mediaType: keyof typeof MEDIA_LIMITS_MB;
}> {
  const mediaType = getMediaType(file);

  // 🖼 Image → compress
  if (mediaType === "image") {
    const compressed = await compressImage(file);
    return { file: compressed, mediaType };
  }

  // 🎥 Video / 🎧 Audio / 📄 Document → validate only
  const maxBytes = MEDIA_LIMITS_MB[mediaType] * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(
      `${mediaType.toUpperCase()} exceeds WhatsApp limit (${MEDIA_LIMITS_MB[mediaType]
      } MB)`
    );
  }

  return { file, mediaType };
}
