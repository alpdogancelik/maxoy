import { getNavbarCatalogPages } from "../../../lib/storefront/catalog-pages";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const pages = await getNavbarCatalogPages();
    return res.status(200).json({ pages });
  } catch (e) {
    return res.status(200).json({ pages: [], dbOffline: true });
  }
}

