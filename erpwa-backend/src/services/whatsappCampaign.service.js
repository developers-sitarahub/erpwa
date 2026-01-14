import axios from "axios";

export async function sendWhatsAppImage({
  phoneNumberId,
  accessToken,
  to,
  imageUrl,
  caption,
}) {
  const url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: {
      link: imageUrl,
      ...(caption ? { caption } : {}),
    },
  };

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}
