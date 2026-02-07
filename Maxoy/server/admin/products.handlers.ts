import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { ProductSchema } from "@/lib/validators/product";
import { toSlug } from "@/lib/slug";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateProducts } from "@/lib/revalidate";
import { Prisma } from "@prisma/client";

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

    const baseSlug = payload.slug ? toSlug(payload.slug) : toSlug(payload.nameTR);
    const slug = await ensureUniqueSlug(baseSlug);

    const product = await prisma.product.create({
      data: {
        nameTR: payload.nameTR,
        nameEN: payload.nameEN,
        slug,
        sku: payload.sku,
        barcode: payload.barcode || null,
        categoryId: payload.categoryId,
        priceRetail: payload.priceRetail,
        priceWholesale: payload.priceWholesale ?? null,
        priceVip: payload.priceVip ?? null,
        discount: payload.discount ?? null,
        stockQty: payload.stockQty,
        isActive: payload.isActive ?? true,
        isFeatured: payload.isFeatured ?? false,
        tags: payload.tags || [],
        shortDescTR: payload.shortDescTR ?? null,
        shortDescEN: payload.shortDescEN ?? null,
        longDescTR: payload.longDescTR ?? null,
        longDescEN: payload.longDescEN ?? null,
        seoTitle: payload.seoTitle ?? null,
        seoDesc: payload.seoDesc ?? null,
        status: payload.status ?? "DRAFT",
        publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
        media: payload.mediaIds?.length
          ? {
              create: payload.mediaIds.map((mediaId, index) => ({ mediaId, sortOrder: index })),
            }
          : undefined,
      },
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

