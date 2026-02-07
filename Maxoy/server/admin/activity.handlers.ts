import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { normalizeRoleName } from "@/lib/admin-permissions";

function redactPII(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactPII);

  const obj = value as Record<string, any>;
  const clone: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      [
        "address",
        "customerInfo",
        "phone",
        "email",
        "whatsapp",
        "line1",
        "line2",
        "postalCode",
        "taxNo",
        "taxOffice",
      ].includes(k)
    ) {
      clone[k] = "[redacted]";
      continue;
    }
    clone[k] = redactPII(v);
  }
  return clone;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "activity:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q") || undefined;
  const action = params.get("action") || undefined;
  const entityType = params.get("entityType") || undefined;
  const actor = params.get("actor") || undefined;
  const from = params.get("from") ? new Date(params.get("from") as string) : undefined;
  const to = params.get("to") ? new Date(params.get("to") as string) : undefined;

  try {
    const items = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
        action: action ? (action as any) : undefined,
        entityType: entityType ? { equals: entityType } : undefined,
        OR: q
          ? [
              { entityType: { contains: q, mode: "insensitive" } },
              { entityId: { contains: q, mode: "insensitive" } },
              { actor: { email: { contains: q, mode: "insensitive" } } },
            ]
          : undefined,
        ...(actor ? { actor: { email: { contains: actor, mode: "insensitive" } } } : {}),
      },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const role = normalizeRoleName(auth.user.role?.name as any);
    if (role !== "ADMIN") {
      // PII: non-admins can view activity metadata but not sensitive payloads.
      const safe = items.map((it: any) => ({
        ...it,
        before: it.entityType === "Order" || it.entityType === "Settings" ? (redactPII(it.before) as any) : it.before,
        after: it.entityType === "Order" || it.entityType === "Settings" ? (redactPII(it.after) as any) : it.after,
      }));
      return NextResponse.json({ items: safe });
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], dbOffline: true, error: "Database unavailable" }, { status: 503 });
  }
}

