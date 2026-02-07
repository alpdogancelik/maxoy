import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";

export async function GET(request: NextRequest) {
    const auth = await requirePermissionFromRequest(request, "orders:read");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status") || undefined;
    const q = params.get("q") || undefined;
    const from = params.get("from") || undefined;
    const to = params.get("to") || undefined;
    const take = Math.min(Number(params.get("limit") || "50"), 200);

    const createdAt =
        from || to
            ? {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
            }
            : undefined;

    try {
        const items = await prisma.order.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(createdAt ? { createdAt } : {}),
                ...(q
                    ? {
                        OR: [
                            { id: { contains: q, mode: "insensitive" } },
                            { customerInfo: { fullName: { contains: q, mode: "insensitive" } } },
                            { customerInfo: { phone: { contains: q, mode: "insensitive" } } },
                        ],
                    }
                    : {}),
            },
            include: { customerInfo: true },
            orderBy: { createdAt: "desc" },
            take,
        });

        return NextResponse.json({ items });
    } catch (e: any) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
}

