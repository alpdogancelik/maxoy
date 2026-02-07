import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { MediaUpdateSchema } from "@/lib/validators/media";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";
import { deleteObject, getPublicUrl, moveObject } from "@/lib/storage";
import { toSlug } from "@/lib/slug";

function buildVariants(url: string) {
    const variants: Record<string, string> = { original: url };
    const webpSuffix = process.env.MEDIA_WEBP_SUFFIX || "";
    const avifSuffix = process.env.MEDIA_AVIF_SUFFIX || "";
    if (webpSuffix) variants.webp = `${url}${webpSuffix}`;
    if (avifSuffix) variants.avif = `${url}${avifSuffix}`;
    return variants;
}

async function ensureUniqueKey(candidate: string, selfId: string) {
    let key = candidate;
    let counter = 1;
    // key is unique; ensure we don't collide
    while (true) {
        const existing = await prisma.mediaAsset.findUnique({ where: { key } });
        if (!existing || existing.id === selfId) return key;
        const parts = candidate.split(".");
        if (parts.length < 2) {
            key = `${candidate}-${counter++}`;
            continue;
        }
        const ext = parts.pop();
        const base = parts.join(".");
        key = `${base}-${counter++}.${ext}`;
    }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requirePermissionFromRequest(request, "media:read");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!asset) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requirePermissionFromRequest(request, "media:update");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = MediaUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const before = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!before) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wantsRename = Boolean(parsed.data.fileName);
    const wantsMove = parsed.data.folder !== undefined && (parsed.data.folder || null) !== (before.folder || null);

    // If moving folders or renaming file, we also update the storage key + url.
    let nextKey = before.key;
    let nextUrl = before.url;
    let nextVariants: any = before.variants;

    if (wantsRename || wantsMove) {
        const oldParts = before.key.split("/");
        const oldFile = oldParts.pop() || before.key;
        const oldDir = oldParts.join("/") || "uploads";
        const oldExt = oldFile.includes(".") ? oldFile.split(".").pop() || "" : "";

        const targetFolderRaw = parsed.data.folder !== undefined ? parsed.data.folder : before.folder || null;
        const targetDir = (targetFolderRaw || oldDir || "uploads").replace(/\/$/, "") || "uploads";

        let targetFile = oldFile;
        if (parsed.data.fileName) {
            const base = parsed.data.fileName.replace(/\.[^/.]+$/, "");
            const slugBase = toSlug(base) || "asset";
            targetFile = oldExt ? `${slugBase}.${oldExt}` : slugBase;
        }

        const candidate = `${targetDir}/${targetFile}`;
        nextKey = await ensureUniqueKey(candidate, before.id);

        try {
            if (nextKey !== before.key) {
                await moveObject(before.key, nextKey);
            }
            nextUrl = getPublicUrl(nextKey);
            nextVariants = buildVariants(nextUrl);
        } catch {
            return NextResponse.json({ error: "Storage move failed" }, { status: 502 });
        }
    }

    const asset = await prisma.mediaAsset.update({
        where: { id: params.id },
        data: {
            altText: parsed.data.altText ?? undefined,
            folder: parsed.data.folder ?? undefined,
            key: nextKey !== before.key ? nextKey : undefined,
            url: nextUrl !== before.url ? nextUrl : undefined,
            variants: nextVariants !== before.variants ? nextVariants : undefined,
        },
    });

    await logAdminAction({
        actorId: auth.user.id,
        action: AuditAction.UPDATE,
        entityType: "MediaAsset",
        entityId: asset.id,
        before,
        after: asset,
        request,
    });

    return NextResponse.json(asset);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requirePermissionFromRequest(request, "media:delete");
    if (!auth.user) {
        return NextResponse.json(
            { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
            { status: auth.forbidden ? 403 : 401 }
        );
    }

    const hard = request.nextUrl.searchParams.get("hard") === "1";
    if (hard) {
        return NextResponse.json({ error: "Hard delete disabled" }, { status: 400 });
    }

    const before = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!before) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (hard) {
        await deleteObject(before.key).catch(() => null);
        await prisma.mediaAsset.delete({ where: { id: params.id } });
        await logAdminAction({
            actorId: auth.user.id,
            action: AuditAction.DELETE,
            entityType: "MediaAsset",
            entityId: before.id,
            before,
            request,
        });
        return NextResponse.json({ ok: true });
    }

    const asset = await prisma.mediaAsset.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
    });

    await logAdminAction({
        actorId: auth.user.id,
        action: AuditAction.DELETE,
        entityType: "MediaAsset",
        entityId: asset.id,
        before,
        after: asset,
        request,
    });

    return NextResponse.json(asset);
}

