// import fetch from "node-fetch";
// import FormData from "form-data";
// import path from "path";

// export async function uploadMediaToWhatsApp({
//   accessToken,
//   phoneNumberId,
//   mediaUrl,
//   mimeType,
// }) {
//   const download = await fetch(mediaUrl);
//   if (!download.ok) throw new Error("Failed to download media from S3");

//   const buffer = await download.buffer();

//   const form = new FormData();
//   form.append("messaging_product", "whatsapp");
//   form.append("file", buffer, {
//     filename: path.basename(mediaUrl),
//     contentType: mimeType,
//   });

//   const resp = await fetch(
//     `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         ...form.getHeaders(), // 🔥 REQUIRED
//       },
//       body: form,
//     }
//   );

//   const data = await resp.json();
//   if (!resp.ok) throw data;

//   return data.id;
// }


export async function uploadMediaToWhatsApp({
  buffer,
  mimeType,
  accessToken,
  phoneNumberId,
}) {
  console.log("USING PHONE NUMBER ID:", phoneNumberId);

  const form = new FormData();

  const blob = new Blob([buffer], { type: mimeType });

  form.append("file", blob, "header-media");
  form.append("type", mimeType);
  form.append("messaging_product", "whatsapp");

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("META MEDIA UPLOAD ERROR:", JSON.stringify(data, null, 2));
    throw new Error(data?.error?.message || "Meta media upload failed");
  }

  return data.id; // ✅ THIS IS THE media_handle
}
