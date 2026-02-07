import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { CategorySchema } from "@/lib/validators/category";
import { toSlug } from "@/lib/slug";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateCategories } from "@/lib/revalidate";

async function isSlugTakenByOther(slug: string, id: string) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) return false;
  return existing.id !== id;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "categories:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CategorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.category.findUnique({ where: { id: params.id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let slug: string | undefined = undefined;
  // Only update slug when explicitly provided. Prevent accidental slug changes on name updates.
  if (parsed.data.slug !== undefined) {
    const raw = parsed.data.slug?.trim();
    const baseSlug = raw ? toSlug(raw) : toSlug(parsed.data.nameTR || before.nameTR);
    if (await isSlugTakenByOther(baseSlug, params.id)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    slug = baseSlug;
  }

  const category = await prisma.category.update({
    where: { id: params.id },
    data: {
      nameTR: parsed.data.nameTR ?? undefined,
      nameEN: parsed.data.nameEN ?? undefined,
      slug: slug ?? undefined,
      parentId: parsed.data.parentId ?? undefined,
      imageAssetId: parsed.data.imageAssetId ?? undefined,
      descriptionTR: parsed.data.descriptionTR ?? undefined,
      descriptionEN: parsed.data.descriptionEN ?? undefined,
      seoTitle: parsed.data.seoTitle ?? undefined,
      seoDesc: parsed.data.seoDesc ?? undefined,
      isActive: parsed.data.isActive ?? undefined,
      sortOrder: parsed.data.sortOrder ?? undefined,
    },
  });

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.UPDATE,
    entityType: "Category",
    entityId: category.id,
    before,
    after: category,
    request,
  });

  revalidateCategories();
  return NextResponse.json(category);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "categories:delete");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const before = await prisma.category.findUnique({ where: { id: params.id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.DELETE,
    entityType: "Category",
    entityId: category.id,
    before,
    after: category,
    request,
  });

  revalidateCategories();
  return NextResponse.json(category);
}

