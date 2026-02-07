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

async function ensureDefaults() {
  const existing = await prisma.catalogPage.findMany({ take: 1 }).catch(() => []);
  if (existing?.length) return;

  // Seed from mock data (works for real DB too)
  const { MOCK_CATALOG_PAGES } = await import("@/lib/mock-data");
  await prisma.$transaction(
    MOCK_CATALOG_PAGES.map((p: any, index: number) =>
      prisma.catalogPage.create({
        data: {
          key: p.key,
          path: p.path,
          titleTR: p.titleTR,
          titleEN: p.titleEN,
          seoTitleTR: null,
          seoTitleEN: null,
          seoDescTR: null,
          seoDescEN: null,
          initialMainCategory: p.initialMainCategory || null,
          initialSubcategory: p.initialSubcategory || null,
          allowedMainCategories: p.allowedMainCategories || [],
          allowedSubcategories: p.allowedSubcategories || [],
          sortOrder: p.sortOrder ?? index,
          navVisible: Boolean(p.navVisible),
          sidebarItems: p.sidebarItems ?? Prisma.DbNull,
          status: p.status || "DRAFT",
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        },
      })
    )
  );
}

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "catalog-pages:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    await ensureDefaults();
    const items = await prisma.catalogPage.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], dbOffline: true }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "catalog-pages:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CatalogPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await prisma.catalogPage.create({
      data: {
        key: parsed.data.key,
        path: parsed.data.path,
        titleTR: parsed.data.titleTR,
        titleEN: parsed.data.titleEN,
        seoTitleTR: parsed.data.seoTitleTR || null,
        seoTitleEN: parsed.data.seoTitleEN || null,
        seoDescTR: parsed.data.seoDescTR || null,
        seoDescEN: parsed.data.seoDescEN || null,
        initialMainCategory: parsed.data.initialMainCategory || null,
        initialSubcategory: parsed.data.initialSubcategory || null,
        allowedMainCategories: parsed.data.allowedMainCategories || [],
        allowedSubcategories: parsed.data.allowedSubcategories || [],
        sortOrder: parsed.data.sortOrder ?? 0,
        navVisible: Boolean(parsed.data.navVisible),
        sidebarItems: parsed.data.sidebarItems ?? Prisma.DbNull,
        status: "DRAFT",
        publishedAt: null,
      },
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.CREATE,
      entityType: "CatalogPage",
      entityId: created.id,
      after: created,
      request,
    });

    return NextResponse.json(created);
  } catch (error) {
    return handleCatalogError(error);
  }
}
