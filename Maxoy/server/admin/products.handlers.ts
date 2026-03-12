import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { ProductSchema } from "@/lib/validators/product";
import { toSlug } from "@/lib/slug";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateProducts } from "@/lib/revalidate";
import { Prisma } from "@prisma/client";
import {
  buildVariantFields,
  createVariantGroupKey,
  normalizeVariantGroup,
} from "./product-variant-utils";

async function ensureUniqueSlug(slug: string) {
  let candidate = slug;
  let counter = 1;
  try {
    while (await prisma.product.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${counter++}`;
    }
    return candidate;
  } catch {
    return candidate;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "products:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q") || undefined;
  const sku = params.get("sku") || undefined;
  const categoryId = params.get("category") || undefined;
  const status = params.get("status") || undefined;
  const inStock = params.get("inStock") === "1";
  const tag = params.get("tag") || undefined;
  const isActive = params.get("isActive");
  const isDiscounted = params.get("isDiscounted") === "1";
  const includeDeleted = params.get("includeDeleted") === "1";

  try {
    const items = await prisma.product.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
        sku: sku ? { contains: sku, mode: "insensitive" } : undefined,
        categoryId: categoryId || undefined,
        status: status ? (status as any) : undefined,
        stockQty: inStock ? { gt: 0 } : undefined,
        isActive: isActive ? isActive === "1" : undefined,
        discount: isDiscounted ? { gt: 0 } : undefined,
        tags: tag ? { has: tag } : undefined,
        OR: q
          ? [
              { nameTR: { contains: q, mode: "insensitive" } },
              { nameEN: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], dbOffline: true, error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "products:create");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const payload = parsed.data;
    const existingSku = await prisma.product.findUnique({ where: { sku: payload.sku } });
    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    const incomingVariants = Array.isArray(payload.variants) ? payload.variants : [];
    const hasSiblingVariants = incomingVariants.length > 0;
    const explicitGroup = normalizeVariantGroup(payload.variantGroup);
    const variantGroup = explicitGroup || (hasSiblingVariants ? createVariantGroupKey(payload.slug || payload.nameTR) : null);
    const baseSlug = payload.slug ? toSlug(payload.slug) : toSlug(payload.nameTR);
    const slug = await ensureUniqueSlug(baseSlug);
    const sharedFields = {
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
    const { categoryId, ...sharedFieldsWithoutCategory } = sharedFields;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...sharedFieldsWithoutCategory,
          category: { connect: { id: categoryId } },
          slug,
          sku: payload.sku,
          variantGroup,
          ...buildVariantFields(
            {
              barcode: payload.barcode,
              priceRetail: payload.priceRetail,
              priceWholesale: payload.priceWholesale,
              priceVip: payload.priceVip,
              discount: payload.discount,
              stockQty: payload.stockQty,
              isActive: payload.isActive,
              status: payload.status,
              colorToneTR: payload.colorToneTR,
              colorToneEN: payload.colorToneEN,
              secondaryColorTR: payload.secondaryColorTR,
              secondaryColorEN: payload.secondaryColorEN,
              variantLabelTR: payload.variantLabelTR,
              variantLabelEN: payload.variantLabelEN,
              swatchPrimary: payload.swatchPrimary,
              swatchSecondary: payload.swatchSecondary,
              variantSortOrder: payload.variantSortOrder,
            },
            0
          ),
          media: payload.mediaIds?.length
            ? {
                create: payload.mediaIds.map((mediaId, index) => ({ mediaId, sortOrder: index })),
              }
            : undefined,
        },
      });

      for (let index = 0; index < incomingVariants.length; index += 1) {
        const variant = incomingVariants[index];
        const variantBaseSlug = variant.slug ? toSlug(variant.slug) : toSlug(`${payload.nameTR}-${variant.sku}`);
        const variantSlug = await ensureUniqueSlug(variantBaseSlug);

        await tx.product.create({
          data: {
            ...sharedFieldsWithoutCategory,
            category: { connect: { id: categoryId } },
            slug: variantSlug,
            sku: variant.sku,
            variantGroup,
            ...buildVariantFields({ ...variant, status: variant.status ?? payload.status }, index + 1),
            media: variant.mediaIds?.length
              ? {
                  create: variant.mediaIds.map((mediaId, mediaIndex) => ({ mediaId, sortOrder: mediaIndex })),
                }
              : undefined,
          },
        });
      }

      return created;
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.CREATE,
      entityType: "Product",
      entityId: product.id,
      after: product,
      request,
    });

    revalidateProducts();
    return NextResponse.json(product);
  } catch (e: any) {
    // Friendly unique errors (slug/sku/barcode)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = Array.isArray((e as any).meta?.target) ? (e as any).meta.target.join(", ") : String((e as any).meta?.target || "unique");
      return NextResponse.json({ error: `Unique constraint failed: ${target}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

