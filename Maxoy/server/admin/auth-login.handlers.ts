import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, getClientInfo, isAdminAuthDisabled, setSessionCookie, verifyPassword } from "@/lib/admin-auth";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logAudit } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const { ip, userAgent } = getClientInfo(request);

  // Dev bypass: accept any credentials and set a dummy session cookie.
  if (isAdminAuthDisabled()) {
    const response = NextResponse.json({ ok: true, role: "ADMIN", bypass: true });
    setSessionCookie(response, "dev");
    return response;
  }

  const key = `login:${ip || "unknown"}`;
  const limiter = rateLimit({ key, limit: 5, windowMs: 10 * 60 * 1000 });

  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts" },
      { status: 429, headers: getRateLimitHeaders({ limit: 5, remaining: 0, resetAt: limiter.resetAt }) }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await createSession({ userId: user.id, ip, userAgent });
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await logAudit({
    actorId: user.id,
    action: AuditAction.LOGIN,
    entityType: "Session",
    entityId: session.token,
    ip,
    userAgent,
  });

  const response = NextResponse.json({ ok: true, role: user.role.name });
  setSessionCookie(response, session.token);
  return response;
}

