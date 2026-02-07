import { buildSearchText, getLocalizedField, getLocalizedArrayField } from "../../lib/productUtils";
import { getStorefrontProducts } from "../../lib/storefront/products";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const query = String(req.query?.q || "").trim().toLowerCase();
  const limit = Number(req.query?.limit || 6);
  const lang = req.query?.lang === "en" ? "en" : "tr";
  if (!query) {
    res.status(200).json({ items: [] });
    return;
  }

  try {
    const products = await getStorefrontProducts();
    const matches = products.filter((product) => {
      const haystack = product.searchText || buildSearchText(product, lang);
      return haystack.includes(query);
    });

    const seen = new Set();
    const items = [];

    matches.forEach((product) => {
      if (items.length >= limit) return;
      const name = getLocalizedField(product, "name", lang) || product.name;
      if (!name || seen.has(name)) return;
      seen.add(name);
      items.push({ type: "product", label: name, value: name });
    });

    matches.forEach((product) => {
      if (items.length >= limit) return;
      const category = product.category || product.mainCode;
      if (!category || seen.has(category)) return;
      seen.add(category);
      items.push({ type: "category", label: category, value: category });
    });

    matches.forEach((product) => {
      if (items.length >= limit) return;
      const tags = getLocalizedArrayField(product, "tags", lang);
      tags.forEach((tag) => {
        if (items.length >= limit) return;
        if (!tag || seen.has(tag)) return;
        if (!tag.toLowerCase().includes(query)) return;
        seen.add(tag);
        items.push({ type: "tag", label: tag, value: tag });
      });
    });

    res.status(200).json({ items: items.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
