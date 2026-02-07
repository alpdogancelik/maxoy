import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { MediaCreateSchema } from "@/lib/validators/media";

function parseIntParam(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "media:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q") || undefined;
  const type = params.get("type") || undefined; // image | video | other
  const mime = params.get("mime") || undefined; // kept for backward-compat
  const folder = params.get("folder") || undefined;
  const from = params.get("from") || undefined;
  const includeDeleted = params.get("includeDeleted") === "1";
  const page = parseIntParam(params.get("page"), 1);
  const pageSize = Math.min(parseIntParam(params.get("pageSize"), 24), 100);

  const folderNorm = folder ? folder.replace(/\/$/, "") : undefined;

  const where: any = {
    deletedAt: includeDeleted ? undefined : null,
    createdAt: from ? { gte: new Date(from) } : undefined,
    ...(type === "image"
      ? { mime: { startsWith: "image/" } }
      : type === "video"
        ? { mime: { startsWith: "video/" } }
        : type === "other"
          ? { NOT: [{ mime: { startsWith: "image/" } }, { mime: { startsWith: "video/" } }] }
          : {}),
    ...(mime ? { mime: { contains: mime } } : {}),
    ...(folderNorm
      ? {
          OR: [
            { folder: { startsWith: folderNorm } },
            { key: { startsWith: `${folderNorm}/` } },
            ...(folderNorm === "uploads" ? [{ key: { startsWith: "uploads/" } }] : []),
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { altText: { contains: q, mode: "insensitive" } },
            { key: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [total, items] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch {
    return NextResponse.json(
      { items: [], total: 0, page, pageSize, dbOffline: true },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "media:upload");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = MediaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const asset = await prisma.mediaAsset.create({ data: parsed.data });
    return NextResponse.json(asset);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

