import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { CatalogPageSchema } from "@/lib/validators/catalog-page";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction, Prisma } from "@prisma/client";

function handleCatalogError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray((error as any).meta?.target)
        ? (error as any).meta.target.join(", ")
        : String((error as any).meta?.target || "unique");
      return NextResponse.json({ error: `Unique constraint failed: ${target}` }, { status: 409 });
    }
    if (error.code === "P2003") {
      return NextResponse.json({ error: "Related record not found" }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "Invalid catalog page payload" }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("database")) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  return NextResponse.json({ error: "Save failed" }, { status: 500 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "catalog-pages:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CatalogPageSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const before = await prisma.catalogPage.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.catalogPage.update({
      where: { id: params.id },
      data: {
        key: parsed.data.key ?? undefined,
        path: parsed.data.path ?? undefined,
        titleTR: parsed.data.titleTR ?? undefined,
        titleEN: parsed.data.titleEN ?? undefined,
        seoTitleTR: parsed.data.seoTitleTR ?? undefined,
        seoTitleEN: parsed.data.seoTitleEN ?? undefined,
        seoDescTR: parsed.data.seoDescTR ?? undefined,
        seoDescEN: parsed.data.seoDescEN ?? undefined,
        initialMainCategory: parsed.data.initialMainCategory ?? undefined,
        initialSubcategory: parsed.data.initialSubcategory ?? undefined,
        allowedMainCategories: parsed.data.allowedMainCategories ?? undefined,
        allowedSubcategories: parsed.data.allowedSubcategories ?? undefined,
        sortOrder: parsed.data.sortOrder ?? undefined,
        navVisible: parsed.data.navVisible ?? undefined,
        sidebarItems:
          parsed.data.sidebarItems === undefined
            ? undefined
            : parsed.data.sidebarItems === null
              ? Prisma.DbNull
              : parsed.data.sidebarItems,
      },
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "CatalogPage",
      entityId: updated.id,
      before,
      after: updated,
      request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleCatalogError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "catalog-pages:publish");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const before = await prisma.catalogPage.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deleted = await prisma.catalogPage.delete({ where: { id: params.id } });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.DELETE,
      entityType: "CatalogPage",
      entityId: deleted.id,
      before,
      after: deleted,
      request,
    });

    return NextResponse.json(deleted);
  } catch (error) {
    return handleCatalogError(error);
  }
}
