import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { enrichProducts, groupVariants } from "@/lib/productTransforms";

export type StorefrontProduct = Record<string, any>;

function mapProduct(db: any): StorefrontProduct {
  const mediaItems = Array.isArray(db?.media) ? db.media : [];
  const images = mediaItems
    .map((m: any) => m?.media?.url)
    .filter(Boolean);

  const discountPercent = Number(db?.discount || 0);

  return {
    id: db.id,
    sku: db.sku,
    code: db.sku,
    nameTR: db.nameTR,
    nameEN: db.nameEN,
    name: db.nameTR,
    slug: { current: db.slug },
    price: Number(db.priceRetail || 0),
    priceRetail: Number(db.priceRetail || 0),
    priceWholesale: db.priceWholesale != null ? Number(db.priceWholesale) : null,
    priceVip: db.priceVip != null ? Number(db.priceVip) : null,
    priceTiers: {
      wholesale: db.priceWholesale != null ? Number(db.priceWholesale) : 0,
      vip: db.priceVip != null ? Number(db.priceVip) : 0,
    },
    discountPercent,
    salePrice: 0,
    stock: Number(db.stockQty || 0),
    stockQty: Number(db.stockQty || 0),
    isActive: Boolean(db.isActive),
    isFeatured: Boolean(db.isFeatured),
    status: db.status,
    tags: Array.isArray(db.tags) ? db.tags : [],
    categoryId: db.categoryId,
    categorySlug: db.category?.slug || "",
    categoryNameTR: db.category?.nameTR || "",
    categoryNameEN: db.category?.nameEN || "",
    mainCode: db.category?.slug || "",
    category: db.category?.slug || "",
    images,
    image: images[0] || "/placeholder-product.png",
    createdAt: db.createdAt ? new Date(db.createdAt).toISOString() : undefined,
    updatedAt: db.updatedAt ? new Date(db.updatedAt).toISOString() : undefined,
  };
}

function loadProductsFromJson() {
  const productsPath = path.join(process.cwd(), "data", "products.json");
  if (!fs.existsSync(productsPath)) return [];
  try {
    const data = fs.readFileSync(productsPath, "utf-8");
    const jsonProducts = JSON.parse(data);
    const enriched = enrichProducts(jsonProducts);
    return groupVariants(enriched);
  } catch {
    return [];
  }
}

export async function getStorefrontProducts({
  includeUnpublished = false,
}: {
  includeUnpublished?: boolean;
} = {}) {
  try {
    const items = await prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(includeUnpublished ? {} : { status: "PUBLISHED", isActive: true }),
      },
      include: {
        category: true,
        media: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = items.map(mapProduct);
    return groupVariants(mapped);
  } catch {
    return loadProductsFromJson();
  }
}

export async function getStorefrontProductBySlug(slug: string) {
  const products = await getStorefrontProducts();
  const needle = String(slug || "").trim().toLowerCase();
  if (!needle) return null;

  const flat: any[] = [];
  (products || []).forEach((p: any) => {
    flat.push(p);
    if (Array.isArray(p?.variants) && p.variants.length) {
      p.variants.forEach((v: any) => flat.push(v));
    }
  });

  return (
    flat.find((p) => String(p?.slug?.current || "").toLowerCase() === needle) ||
    flat.find((p) => String(p?.code || "").toLowerCase() === needle) ||
    flat.find((p) => String(p?.id || "").toLowerCase() === needle) ||
    flat.find((p) => String(p?.name || "").toLowerCase().replace(/\s+/g, "-") === needle) ||
    null
  );
}
