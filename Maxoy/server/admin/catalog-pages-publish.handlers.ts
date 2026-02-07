import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
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

  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("database")) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  return NextResponse.json({ error: "Publish failed" }, { status: 500 });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const published = await prisma.catalogPage.update({
      where: { id: params.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "CatalogPage",
      entityId: published.id,
      before,
      after: published,
      request,
    });

    return NextResponse.json({ ok: true, publishedAt: published.publishedAt });
  } catch (error) {
    return handleCatalogError(error);
  }
}
