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
    const variants = product.variantGroup
      ? await prisma.product.findMany({
          where: {
            variantGroup: product.variantGroup,
            id: { not: product.id },
            deletedAt: null,
          },
          include: {
            media: { include: { media: true }, orderBy: { sortOrder: "asc" } },
          },
          orderBy: [{ variantSortOrder: "asc" }, { createdAt: "asc" }],
        })
      : [];
    return NextResponse.json({
      ...product,
      media: product.media.map((pm) => ({
        id: pm.media.id,
        url: pm.media.url,
        altText: pm.media.altText,
        folder: pm.media.folder,
        sortOrder: pm.sortOrder,
      })),
      variants: variants.map((variant) => ({
        ...variant,
        media: variant.media.map((pm) => ({
          id: pm.media.id,
          url: pm.media.url,
          altText: pm.media.altText,
          folder: pm.media.folder,
          sortOrder: pm.sortOrder,
        })),
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

  const bodyHasVariants = Object.prototype.hasOwnProperty.call(body, "variants");
  const incomingVariants = Array.isArray(parsed.data.variants) ? parsed.data.variants : [];
  const explicitGroup = Object.prototype.hasOwnProperty.call(body, "variantGroup")
    ? normalizeVariantGroup(parsed.data.variantGroup)
    : before.variantGroup;
  const hasSiblingVariants = bodyHasVariants ? incomingVariants.length > 0 : Boolean(before.variantGroup);
  const desiredVariantGroup =
    explicitGroup || (hasSiblingVariants ? before.variantGroup || createVariantGroupKey(parsed.data.slug || parsed.data.nameTR || before.nameTR) : null);

  let slug = before.slug;
  if (parsed.data.slug || parsed.data.nameTR) {
    const baseSlug = parsed.data.slug ? toSlug(parsed.data.slug) : toSlug(parsed.data.nameTR || before.nameTR);
    slug = await ensureUniqueSlug(baseSlug, params.id);
  }

  let product;
  try {
    product = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id: params.id } });
      if (!current) throw new Error("Not found");

      const updated = await tx.product.update({
        where: { id: params.id },
        data: {
          nameTR: parsed.data.nameTR ?? undefined,
          nameEN: parsed.data.nameEN ?? undefined,
          slug,
          sku: parsed.data.sku ?? undefined,
          barcode: Object.prototype.hasOwnProperty.call(body, "barcode") ? parsed.data.barcode ?? null : undefined,
          categoryId: parsed.data.categoryId ?? undefined,
          priceRetail: parsed.data.priceRetail ?? undefined,
          priceWholesale: Object.prototype.hasOwnProperty.call(body, "priceWholesale") ? parsed.data.priceWholesale ?? null : undefined,
          priceVip: Object.prototype.hasOwnProperty.call(body, "priceVip") ? parsed.data.priceVip ?? null : undefined,
          discount: Object.prototype.hasOwnProperty.call(body, "discount") ? parsed.data.discount ?? null : undefined,
          stockQty: parsed.data.stockQty ?? undefined,
          isActive: parsed.data.isActive ?? undefined,
          isFeatured: parsed.data.isFeatured ?? undefined,
          variantGroup: bodyHasVariants || Object.prototype.hasOwnProperty.call(body, "variantGroup") ? desiredVariantGroup : undefined,
          colorToneTR: Object.prototype.hasOwnProperty.call(body, "colorToneTR") ? parsed.data.colorToneTR ?? null : undefined,
          colorToneEN: Object.prototype.hasOwnProperty.call(body, "colorToneEN") ? parsed.data.colorToneEN ?? null : undefined,
          secondaryColorTR: Object.prototype.hasOwnProperty.call(body, "secondaryColorTR") ? parsed.data.secondaryColorTR ?? null : undefined,
          secondaryColorEN: Object.prototype.hasOwnProperty.call(body, "secondaryColorEN") ? parsed.data.secondaryColorEN ?? null : undefined,
          variantLabelTR: Object.prototype.hasOwnProperty.call(body, "variantLabelTR") ? parsed.data.variantLabelTR ?? null : undefined,
          variantLabelEN: Object.prototype.hasOwnProperty.call(body, "variantLabelEN") ? parsed.data.variantLabelEN ?? null : undefined,
          swatchPrimary: Object.prototype.hasOwnProperty.call(body, "swatchPrimary") ? parsed.data.swatchPrimary ?? null : undefined,
          swatchSecondary: Object.prototype.hasOwnProperty.call(body, "swatchSecondary") ? parsed.data.swatchSecondary ?? null : undefined,
          variantSortOrder: parsed.data.variantSortOrder ?? undefined,
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

      if (bodyHasVariants) {
        const sharedFields = {
          nameTR: parsed.data.nameTR ?? current.nameTR,
          nameEN: parsed.data.nameEN ?? current.nameEN,
          categoryId: parsed.data.categoryId ?? current.categoryId,
          shortDescTR: parsed.data.shortDescTR ?? current.shortDescTR,
          shortDescEN: parsed.data.shortDescEN ?? current.shortDescEN,
          longDescTR: parsed.data.longDescTR ?? current.longDescTR,
          longDescEN: parsed.data.longDescEN ?? current.longDescEN,
          seoTitle: parsed.data.seoTitle ?? current.seoTitle,
          seoDesc: parsed.data.seoDesc ?? current.seoDesc,
          isFeatured: parsed.data.isFeatured ?? current.isFeatured,
          tags: parsed.data.tags ?? current.tags,
        };

        const existingVariants = current.variantGroup
          ? await tx.product.findMany({
              where: {
                variantGroup: current.variantGroup,
                id: { not: current.id },
              },
              include: { media: true },
            })
          : [];

        const keepIds = new Set<string>();

        for (let index = 0; index < incomingVariants.length; index += 1) {
          const variant = incomingVariants[index];
          const variantBaseSlug = variant.slug ? toSlug(variant.slug) : toSlug(`${sharedFields.nameTR}-${variant.sku}`);
          const variantId = variant.id && existingVariants.some((item) => item.id === variant.id) ? variant.id : null;
          const variantSlug = await ensureUniqueSlug(variantBaseSlug, variantId || `new-${index}`);
          const variantData = {
            ...sharedFields,
            slug: variantSlug,
            sku: variant.sku,
            variantGroup: desiredVariantGroup,
            ...buildVariantFields(
              { ...variant, status: variant.status ?? parsed.data.status ?? current.status },
              index + 1
            ),
          };

          if (variantId) {
            keepIds.add(variantId);
            await tx.product.update({
              where: { id: variantId },
              data: variantData,
            });
            if (variant.mediaIds) {
              await tx.productMedia.deleteMany({ where: { productId: variantId } });
              if (variant.mediaIds.length) {
                await tx.productMedia.createMany({
                  data: variant.mediaIds.map((mediaId, mediaIndex) => ({
                    productId: variantId,
                    mediaId,
                    sortOrder: mediaIndex,
                  })),
                });
              }
            }
          } else {
            const { categoryId, ...variantDataWithoutCategory } = variantData;
            const createdVariant = await tx.product.create({
              data: {
                ...variantDataWithoutCategory,
                category: { connect: { id: categoryId } },
                media: variant.mediaIds?.length
                  ? {
                      create: variant.mediaIds.map((mediaId, mediaIndex) => ({ mediaId, sortOrder: mediaIndex })),
                    }
                  : undefined,
              },
            });
            keepIds.add(createdVariant.id);
          }
        }

        const toDelete = existingVariants.filter((item) => !keepIds.has(item.id));
        if (toDelete.length) {
          await tx.productMedia.deleteMany({ where: { productId: { in: toDelete.map((item) => item.id) } } });
          await tx.product.deleteMany({ where: { id: { in: toDelete.map((item) => item.id) } } });
        }

        if (incomingVariants.length === 0) {
          await tx.product.update({
            where: { id: current.id },
            data: { variantGroup: null },
          });
          if (existingVariants.length) {
            await tx.productMedia.deleteMany({ where: { productId: { in: existingVariants.map((item) => item.id) } } });
            await tx.product.deleteMany({ where: { id: { in: existingVariants.map((item) => item.id) } } });
          }
        }
      }

      return updated;
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
    if (parsed.data.mediaIds.length) {
      await prisma.productMedia.createMany({
        data: parsed.data.mediaIds.map((mediaId, index) => ({ productId: product.id, mediaId, sortOrder: index })),
      });
    }
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

