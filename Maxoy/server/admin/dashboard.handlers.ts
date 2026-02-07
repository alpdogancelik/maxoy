import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";

function startOfDayIso(d: Date) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
}

async function buildOrdersChart(rangeDays: 7 | 30) {
    const now = new Date();
    const from = new Date(now.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
    });

    const countsByDay: Record<string, number> = {};
    for (let i = 0; i < rangeDays; i += 1) {
        const day = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
        countsByDay[startOfDayIso(day)] = 0;
    }
    orders.forEach((o) => {
        const key = startOfDayIso(new Date(o.createdAt));
        if (countsByDay[key] !== undefined) countsByDay[key] += 1;
    });

    const days = Object.keys(countsByDay);
    const series = days.map((d) => countsByDay[d]);
    return { days, series, rangeDays };
}

export async function GET(request: NextRequest) {
    const auth = await requirePermissionFromRequest(request, "dashboard:read");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    try {
        const [products, categories, media, orders] = await Promise.all([
            prisma.product.count({ where: { deletedAt: null } }),
            prisma.category.count({ where: { deletedAt: null } }),
            prisma.mediaAsset.count({ where: { deletedAt: null } }),
            prisma.order.count(),
        ]);

        const recentOrders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { customerInfo: true },
        });

        const lowStock = await prisma.product.findMany({
            where: { deletedAt: null, stockQty: { lte: 5 } },
            orderBy: [{ stockQty: "asc" }, { updatedAt: "desc" }],
            take: 10,
            select: { id: true, sku: true, nameTR: true, stockQty: true, isActive: true },
        });

        const [chart7, chart30] = await Promise.all([buildOrdersChart(7), buildOrdersChart(30)]);
        const has30 = chart30.series.some((n) => n > 0);

        return NextResponse.json({
            counts: { products, categories, media, orders },
            recentOrders,
            lowStock,
            chart: chart7,
            chart30: has30 ? chart30 : undefined,
        });
    } catch {
        return NextResponse.json(
            {
                counts: { products: 0, categories: 0, media: 0, orders: 0 },
                recentOrders: [],
                lowStock: [],
                chart: { days: [], series: [], rangeDays: 7 },
                chart30: undefined,
                dbOffline: true,
            },
            { status: 503 }
        );
    }
}

