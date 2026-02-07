import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { ProductSchema } from "@/lib/validators/product";
import { toSlug } from "@/lib/slug";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateProducts } from "@/lib/revalidate";
import { Prisma } from "@prisma/client";

async function ensureUniqueSlug(slug: string, id: string) {
  let candidate = slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === id) return candidate;
    candidate = `${slug}-${counter++}`;
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "products:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        media: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...product,
      media: product.media.map((pm) => ({
        id: pm.media.id,
        url: pm.media.url,
        altText: pm.media.altText,
        folder: pm.media.folder,
        sortOrder: pm.sortOrder,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "products:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = ProductSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.product.findUnique({ where: { id: params.id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let slug = before.slug;
  if (parsed.data.slug || parsed.data.nameTR) {
    const baseSlug = parsed.data.slug ? toSlug(parsed.data.slug) : toSlug(parsed.data.nameTR || before.nameTR);
    slug = await ensureUniqueSlug(baseSlug, params.id);
  }

  let product;
  try {
    product = await prisma.product.update({
      where: { id: params.id },
      data: {
        nameTR: parsed.data.nameTR ?? undefined,
        nameEN: parsed.data.nameEN ?? undefined,
        slug,
        sku: parsed.data.sku ?? undefined,
        barcode: parsed.data.barcode ?? undefined,
        categoryId: parsed.data.categoryId ?? undefined,
        priceRetail: parsed.data.priceRetail ?? undefined,
        priceWholesale: parsed.data.priceWholesale ?? undefined,
        priceVip: parsed.data.priceVip ?? undefined,
        discount: parsed.data.discount ?? undefined,
        stockQty: parsed.data.stockQty ?? undefined,
        isActive: parsed.data.isActive ?? undefined,
        isFeatured: parsed.data.isFeatured ?? undefined,
        tags: parsed.data.tags ?? undefined,
        shortDescTR: parsed.data.shortDescTR ?? undefined,
        shortDescEN: parsed.data.shortDescEN ?? undefined,
        longDescTR: parsed.data.longDescTR ?? undefined,
        longDescEN: parsed.data.longDescEN ?? undefined,
        seoTitle: parsed.data.seoTitle ?? undefined,
        seoDesc: parsed.data.seoDesc ?? undefined,
        status: parsed.data.status ?? undefined,
        publishedAt:
          parsed.data.status === "PUBLISHED"
            ? new Date()
            : parsed.data.status === "DRAFT"
            ? null
            : undefined,
      },
    });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = Array.isArray((e as any).meta?.target) ? (e as any).meta.target.join(", ") : String((e as any).meta?.target || "unique");
      return NextResponse.json({ error: `Unique constraint failed: ${target}` }, { status: 400 });
    }
    throw e;
  }

  if (parsed.data.mediaIds) {
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.createMany({
      data: parsed.data.mediaIds.map((mediaId, index) => ({ productId: product.id, mediaId, sortOrder: index })),
    });
  }

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.UPDATE,
    entityType: "Product",
    entityId: product.id,
    before,
    after: product,
    request,
  });

  revalidateProducts();
  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "products:delete");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const before = await prisma.product.findUnique({ where: { id: params.id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.DELETE,
    entityType: "Product",
    entityId: product.id,
    before,
    after: product,
    request,
  });

  revalidateProducts();
  return NextResponse.json(product);
}

