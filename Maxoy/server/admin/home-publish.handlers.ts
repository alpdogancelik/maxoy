import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { revalidateHome } from "@/lib/revalidate";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "home-builder:publish");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const home = await prisma.homePage.findFirst();
    if (!home) {
      return NextResponse.json({ error: "Home config missing" }, { status: 404 });
    }

    const updated = await prisma.homePage.update({
      where: { id: home.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "HomePage",
      entityId: home.id,
      after: updated,
      request,
    });

    revalidateHome();
    return NextResponse.json({ ok: true, publishedAt: updated.publishedAt });
  } catch {
    return NextResponse.json({ ok: true, publishedAt: new Date().toISOString(), dbOffline: true });
  }
}

