import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { CategorySchema } from "@/lib/validators/category";
import { toSlug } from "@/lib/slug";
import { buildCategoryTree } from "@/lib/category-utils";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { revalidateCategories } from "@/lib/revalidate";

async function isSlugTaken(slug: string) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    return Boolean(existing);
}

export async function GET(request: NextRequest) {
    const auth = await requirePermissionFromRequest(request, "categories:read");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "1";
    try {
        const items = await prisma.category.findMany({
            where: { deletedAt: includeDeleted ? undefined : null },
            orderBy: { sortOrder: "asc" },
        });

        const counts = await prisma.product.groupBy({
            by: ["categoryId"],
            where: { deletedAt: null },
            _count: { _all: true },
        });
        const productCounts = Object.fromEntries(counts.map((c) => [c.categoryId, c._count._all]));

        const tree = buildCategoryTree(items);
        return NextResponse.json({ items, tree, productCounts });
    } catch {
        return NextResponse.json(
            { items: [], tree: [], productCounts: {}, dbOffline: true, error: "Database unavailable" },
            { status: 503 }
        );
    }
}

export async function POST(request: NextRequest) {
    const auth = await requirePermissionFromRequest(request, "categories:create");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    try {
        const payload = parsed.data;
        const baseSlug = payload.slug ? toSlug(payload.slug) : toSlug(payload.nameTR);

        if (await isSlugTaken(baseSlug)) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }

        const category = await prisma.category.create({
            data: {
                nameTR: payload.nameTR,
                nameEN: payload.nameEN,
                slug: baseSlug,
                parentId: payload.parentId || null,
                imageAssetId: payload.imageAssetId || null,
                descriptionTR: payload.descriptionTR || null,
                descriptionEN: payload.descriptionEN || null,
                seoTitle: payload.seoTitle || null,
                seoDesc: payload.seoDesc || null,
                isActive: payload.isActive ?? true,
                sortOrder: payload.sortOrder ?? 0,
            },
        });

        await logAdminAction({
            actorId: auth.user.id,
            action: AuditAction.CREATE,
            entityType: "Category",
            entityId: category.id,
            after: category,
            request,
        });

        revalidateCategories();
        return NextResponse.json(category);
    } catch {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
}

