import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "categories:reorder");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { sourceId, targetId } = body || {};
  if (!sourceId || !targetId) {
    return NextResponse.json({ error: "sourceId and targetId required" }, { status: 400 });
  }

  const source = await prisma.category.findUnique({ where: { id: sourceId } });
  const target = await prisma.category.findUnique({ where: { id: targetId } });
  if (!source || !target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parentId = target.parentId || null;
  const siblings = await prisma.category.findMany({
    where: { parentId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  const filtered = siblings.filter((item) => item.id !== source.id);
  const targetIndex = filtered.findIndex((item) => item.id === target.id);
  filtered.splice(targetIndex, 0, { ...source, parentId });

  await prisma.$transaction(
    filtered.map((item, index) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: index, parentId },
      })
    )
  );

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.UPDATE,
    entityType: "Category",
    entityId: source.id,
    before: source,
    after: { ...source, parentId },
    request,
  });

  return NextResponse.json({ ok: true });
}

