import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { SettingsSchema } from "@/lib/validators/settings";
import { revalidateSettings } from "@/lib/revalidate";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "settings:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json({ data: settings?.data || {} });
  } catch {
    return NextResponse.json({ error: "Database unavailable", dbOffline: true }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "settings:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await prisma.settings.findFirst();
    const updated = existing
      ? await prisma.settings.update({ where: { id: existing.id }, data: { data: parsed.data } })
      : await prisma.settings.create({ data: { data: parsed.data } });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "Settings",
      entityId: updated.id,
      before: existing?.data,
      after: updated.data,
      request,
    });

    revalidateSettings();
    return NextResponse.json({ data: updated.data });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

