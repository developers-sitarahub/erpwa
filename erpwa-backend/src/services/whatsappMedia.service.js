import fetch from "node-fetch";

export async function downloadWhatsappMedia(mediaId, accessToken) {
  // 1️⃣ Get media metadata
  const metaRes = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metaRes.ok) {
    throw new Error(`Failed to fetch media metadata (${metaRes.status})`);
  }

  const meta = await metaRes.json();

  if (!meta.url || !meta.mime_type) {
    throw new Error("Invalid WhatsApp media metadata");
  }

  // 2️⃣ Download file
  const fileRes = await fetch(meta.url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!fileRes.ok) {
    throw new Error(`Failed to download media (${fileRes.status})`);
  }

  const buffer = Buffer.from(await fileRes.arrayBuffer());

  return {
    buffer,
    mimeType: meta.mime_type,
    fileName: meta.filename || null, // 👈 IMPORTANT FOR DOCUMENTS
    fileSize: meta.file_size || null,
  };
}
