import { getStorefrontSettings } from "../../../lib/storefront/settings";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const settings = await getStorefrontSettings();
    return res.status(200).json({ settings });
  } catch (e) {
    return res.status(200).json({
      settings: {
        brand: { siteName: "Maxoy", logoUrl: "/maxoy_logo.png", faviconUrl: null },
        contact: { phone: "", whatsapp: "", email: "", address: "" },
        shipping: {},
        social: {},
        legal: {},
      },
      dbOffline: true,
    });
  }
}
