import { getStorefrontCategories } from "../../../lib/storefront/categories";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const categories = await getStorefrontCategories();
    return res.status(200).json({ categories });
  } catch (e) {
    return res.status(200).json({ categories: [], dbOffline: true });
  }
}
