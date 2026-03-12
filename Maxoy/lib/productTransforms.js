import {
  getMainCategoryTitle,
  getMainCodeFromSubcategory,
  getSubcategoryTitle,
} from "../constants/categories";
import { normalizeArray, toNumber, getVariantGroupKey } from "./productUtils";

const normalizePriceTiers = (tiers = {}) => {
  if (!tiers) return {};
  return Object.fromEntries(
    Object.entries(tiers).map(([key, value]) => [key, toNumber(value, 0)])
  );
};

export const enrichProduct = (product = {}) => {
  const subCode = product.category || "";
  const mainCode = getMainCodeFromSubcategory(subCode);
  const mainTitle = getMainCategoryTitle(mainCode);
  const subTitle = getSubcategoryTitle(subCode);

  const detailSummary = [
    subTitle,
    product.colorTone,
    product.sizeInfo,
    product.qualitySegment,
    product.locationCode,
  ]
    .filter(Boolean)
    .join(" • ");

  const tags = [
    subTitle,
    mainTitle,
    mainCode,
    subCode,
    product.category,
    product.colorTone,
    product.qualitySegment,
    product.locationCode,
    ...normalizeArray(product.tags),
  ].filter(Boolean);

  return {
    ...product,
    price: toNumber(product.price, product.price),
    stock: toNumber(product.stock, product.stock),
    minStock: toNumber(product.minStock, product.minStock),
    discountPercent: toNumber(product.discountPercent, product.discountPercent),
    salePrice: toNumber(product.salePrice, product.salePrice),
    priceTiers: normalizePriceTiers(product.priceTiers),
    slug: {
      current:
        product.code ||
        product.name?.toLowerCase().replace(/\s+/g, "-") ||
        "",
    },
    summary: product.summary || detailSummary || mainTitle || "",
    tags: Array.from(new Set(tags)),
    mainCode,
    mainTitle,
    subTitle,
  };
};

export const enrichProducts = (products = []) => products.map(enrichProduct);

export const groupVariants = (products = []) => {
  const groups = new Map();

  products.forEach((product) => {
    const groupKey = getVariantGroupKey(product);
    if (!groupKey) {
      groups.set(product.id || product.code || product.name, { ...product, variants: [] });
      return;
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { ...product, variants: [] });
    }
    const entry = groups.get(groupKey);
    entry.variants = entry.variants ? [...entry.variants, product] : [product];
  });

  return Array.from(groups.values()).map((item) => {
    if (item.variants && item.variants.length) {
      const sorted = [...item.variants].sort((a, b) => {
        const sortDiff = Number(a.variantSortOrder || 0) - Number(b.variantSortOrder || 0);
        if (sortDiff !== 0) return sortDiff;
        const aLabel = `${a.colorTone || ""} ${a.sizeInfo || ""}`.trim();
        const bLabel = `${b.colorTone || ""} ${b.sizeInfo || ""}`.trim();
        return aLabel.localeCompare(bLabel, "tr");
      });
      return {
        ...item,
        variants: sorted,
      };
    }
    return item;
  });
};
