import { toSlug } from "@/lib/slug";

type ProductLike = {
  nameTR?: string;
  nameEN?: string;
  categoryId?: string;
  shortDescTR?: string | null;
  shortDescEN?: string | null;
  longDescTR?: string | null;
  longDescEN?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  isFeatured?: boolean;
  tags?: string[];
};

type VariantLike = {
  slug?: string;
  sku?: string;
  barcode?: string | null;
  priceRetail?: number;
  priceWholesale?: number | null;
  priceVip?: number | null;
  discount?: number | null;
  stockQty?: number;
  isActive?: boolean;
  status?: "DRAFT" | "PUBLISHED";
  colorToneTR?: string | null;
  colorToneEN?: string | null;
  secondaryColorTR?: string | null;
  secondaryColorEN?: string | null;
  variantLabelTR?: string | null;
  variantLabelEN?: string | null;
  swatchPrimary?: string | null;
  swatchSecondary?: string | null;
  variantSortOrder?: number;
};

export function cleanOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
}

export function createVariantGroupKey(seed: string) {
  const base = toSlug(seed || "variant-group");
  return `${base}-${Date.now().toString(36)}`;
}

export function normalizeVariantGroup(value: unknown) {
  const cleaned = cleanOptionalString(value);
  return cleaned ? toSlug(cleaned) : null;
}

export function buildSharedProductFields(payload: ProductLike) {
  return {
    nameTR: payload.nameTR,
    nameEN: payload.nameEN,
    categoryId: payload.categoryId,
    shortDescTR: payload.shortDescTR ?? null,
    shortDescEN: payload.shortDescEN ?? null,
    longDescTR: payload.longDescTR ?? null,
    longDescEN: payload.longDescEN ?? null,
    seoTitle: payload.seoTitle ?? null,
    seoDesc: payload.seoDesc ?? null,
    isFeatured: Boolean(payload.isFeatured),
    tags: payload.tags || [],
  };
}

export function buildVariantFields(source: VariantLike, fallbackSortOrder = 0) {
  const status = source.status ?? "DRAFT";
  return {
    barcode: source.barcode || null,
    priceRetail: source.priceRetail ?? 0,
    priceWholesale: source.priceWholesale ?? null,
    priceVip: source.priceVip ?? null,
    discount: source.discount ?? null,
    stockQty: source.stockQty ?? 0,
    isActive: source.isActive ?? true,
    status,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
    colorToneTR: cleanOptionalString(source.colorToneTR),
    colorToneEN: cleanOptionalString(source.colorToneEN),
    secondaryColorTR: cleanOptionalString(source.secondaryColorTR),
    secondaryColorEN: cleanOptionalString(source.secondaryColorEN),
    variantLabelTR: cleanOptionalString(source.variantLabelTR),
    variantLabelEN: cleanOptionalString(source.variantLabelEN),
    swatchPrimary: cleanOptionalString(source.swatchPrimary),
    swatchSecondary: cleanOptionalString(source.swatchSecondary),
    variantSortOrder: Number.isFinite(source.variantSortOrder) ? Number(source.variantSortOrder) : fallbackSortOrder,
  };
}

export function buildVariantDisplayLabel(product: {
  variantLabelTR?: string | null;
  variantLabelEN?: string | null;
  colorToneTR?: string | null;
  colorToneEN?: string | null;
  secondaryColorTR?: string | null;
  secondaryColorEN?: string | null;
}) {
  const tr =
    cleanOptionalString(product.variantLabelTR) ||
    [cleanOptionalString(product.colorToneTR), cleanOptionalString(product.secondaryColorTR)].filter(Boolean).join(" / ");
  const en =
    cleanOptionalString(product.variantLabelEN) ||
    [cleanOptionalString(product.colorToneEN), cleanOptionalString(product.secondaryColorEN)].filter(Boolean).join(" / ");

  return {
    tr: tr || null,
    en: en || null,
  };
}
