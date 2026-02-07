import { getStoreHome } from "../../../lib/storefront/home";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const home = (await getStoreHome({ preview: false })) || (await getStoreHome({ preview: true }));
    return res.status(200).json({ home });
  } catch (e) {
    return res.status(200).json({ home: null, dbOffline: true });
  }
}

