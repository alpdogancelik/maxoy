import { prisma } from "./db";
import { AuditAction } from "@prisma/client";

function getRequestMeta(request: Request | { headers: Headers; ip?: string | null }) {
  const userAgent = request.headers.get("user-agent") || undefined;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    ("ip" in request ? request.ip ?? undefined : undefined);
  return { ip, userAgent };
}

/**
 * Preferred helper (requested): captures common metadata automatically.
 * Note: stored model is `AuditLog` (Prisma) but this function is the project-level abstraction.
 */
export async function logAdminAction({
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
  request,
}: {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  request?: Request | { headers: Headers; ip?: string | null };
}) {
  const meta = request ? getRequestMeta(request) : {};
  if (actorId === "dev-admin") return;
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        before: before as any,
        after: after as any,
        ip: (meta as any).ip,
        userAgent: (meta as any).userAgent,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2003") return;
    if (error?.code === "P2025") return;
    console.warn("Audit log write skipped:", error?.message || error);
  }
}

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
  ip,
  userAgent,
}: {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}) {
  if (actorId === "dev-admin") return;
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        before: before as any,
        after: after as any,
        ip,
        userAgent,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2003") return;
    if (error?.code === "P2025") return;
    console.warn("Audit log write skipped:", error?.message || error);
  }
}
