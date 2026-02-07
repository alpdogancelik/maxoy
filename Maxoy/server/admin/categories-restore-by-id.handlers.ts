import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateCategories } from "@/lib/revalidate";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "categories:restore");
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
    data: { deletedAt: null },
  });

  await logAdminAction({
    actorId: auth.user.id,
    action: AuditAction.RESTORE,
    entityType: "Category",
    entityId: category.id,
    before,
    after: category,
    request,
  });

  revalidateCategories();
  return NextResponse.json(category);
}

