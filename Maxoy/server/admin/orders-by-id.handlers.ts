import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeRoleName } from "@/lib/admin-permissions";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { OrderStatusSchema } from "@/lib/validators/order";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "orders:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, customerInfo: true, address: true, receiptAsset: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const role = normalizeRoleName(auth.user.role?.name as any);
    if (role !== "ADMIN") {
      // PII masking for non-admin: redact address details
      return NextResponse.json({
        ...order,
        address: order.address
          ? {
              ...order.address,
              line1: "[redacted]",
              line2: null,
              postalCode: null,
            }
          : null,
        customerInfo: order.customerInfo
          ? {
              ...order.customerInfo,
              email: null,
              whatsapp: null,
            }
          : null,
        adminNote: null,
      });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermissionFromRequest(request, "orders:update-status");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = OrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const before = await prisma.order.findUnique({ where: { id: params.id } });
    if (!before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const role = normalizeRoleName(auth.user.role?.name as any);
    const STATUS_RANK: Record<string, number> = {
      PENDING: 0,
      PAID: 1,
      PREPARING: 2,
      SHIPPED: 3,
      DELIVERED: 4,
      CANCELLED: 10,
      REFUNDED: 11,
    };

    if (parsed.data.status) {
      const cur = before.status as any as string;
      const next = parsed.data.status as any as string;
      const curRank = STATUS_RANK[cur] ?? 0;
      const nextRank = STATUS_RANK[next] ?? 0;

      const isBackwards = nextRank < curRank;
      if (isBackwards && !parsed.data.force) {
        return NextResponse.json({ error: "Backwards transition requires force=true" }, { status: 400 });
      }

      // Require reason note for cancel/refund (validated by schema too)
      if ((next === "CANCELLED" || next === "REFUNDED") && !(parsed.data.adminNote && parsed.data.adminNote.trim().length >= 3)) {
        return NextResponse.json({ error: "Reason (adminNote) required for cancel/refund" }, { status: 400 });
      }
    }

    // Internal notes: only ADMIN can set arbitrary adminNote (except cancel/refund reason which is allowed)
    const isReasonForCancelRefund =
      parsed.data.status === "CANCELLED" || parsed.data.status === "REFUNDED";
    if (parsed.data.adminNote !== undefined && role !== "ADMIN" && !isReasonForCancelRefund) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.adminNote !== undefined ? { adminNote: parsed.data.adminNote } : {}),
      },
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "Order",
      entityId: order.id,
      before,
      after: order,
      request,
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

