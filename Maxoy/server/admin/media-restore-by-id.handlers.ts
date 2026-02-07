import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "media:restore");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const before = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const asset = await prisma.mediaAsset.update({
    where: { id: params.id },
    data: { deletedAt: null },
  });

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.RESTORE,
    entityType: "MediaAsset",
    entityId: asset.id,
    before,
    after: asset,
    request,
  });

  return NextResponse.json(asset);
}

