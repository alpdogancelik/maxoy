import { getStorefrontProducts } from "../../../lib/storefront/products";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const products = await getStorefrontProducts();
    return res.status(200).json({ products });
  } catch (e) {
    return res.status(200).json({ products: [], dbOffline: true });
  }
}
