import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateProducts } from "@/lib/revalidate";

const BulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["publish", "unpublish", "setCategory", "adjustStock"]),
  categoryId: z.string().optional(),
  delta: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "products:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, action, categoryId, delta } = parsed.data;

  try {
    const before = await prisma.product.findMany({ where: { id: { in: ids } } });

    if (action === "setCategory") {
      if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId } });
    } else if (action === "adjustStock") {
      if (delta === undefined) return NextResponse.json({ error: "delta required" }, { status: 400 });
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { stockQty: { increment: delta } },
      });
    } else if (action === "publish") {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    } else if (action === "unpublish") {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: "DRAFT", publishedAt: null },
      });
    }

    const after = await prisma.product.findMany({ where: { id: { in: ids } } });
    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "ProductBulk",
      entityId: ids.join(","),
      before,
      after,
      request,
    });

    revalidateProducts();
    return NextResponse.json({ ok: true, count: ids.length });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

