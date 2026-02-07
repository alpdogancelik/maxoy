import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionFromRequest, isAdminAuthDisabled, revokeSession } from "@/lib/admin-auth";
import { logAudit } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  if (isAdminAuthDisabled()) {
    const response = NextResponse.json({ ok: true, bypass: true });
    clearSessionCookie(response);
    return response;
  }

  const session = await getSessionFromRequest(request);
  if (session) {
    await revokeSession(session.token);
    await logAudit({
      actorId: session.userId,
      action: AuditAction.LOGOUT,
      entityType: "Session",
      entityId: session.token,
      ip: request.ip || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}

