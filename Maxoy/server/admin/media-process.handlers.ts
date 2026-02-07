import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { Readable } from "stream";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { MediaProcessSchema } from "@/lib/validators/media";
import { getObjectStream, getPublicUrl } from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const runtime = "nodejs";

function inferMimeFromKey(key: string) {
  const ext = String(key.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return "";
}

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
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
  const parsed = MediaProcessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { key, mime, size, altText, folder } = parsed.data;
  const effectiveMime = mime || inferMimeFromKey(key);
  if (!ALLOWED_MIME.includes(effectiveMime)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  try {
    const object = await getObjectStream(key);
    const stream = object.Body as Readable;
    const buffer = await streamToBuffer(stream);

    const image = sharp(buffer, { failOn: "none" });
    const metadata = await image.metadata();
    const resized = await image.resize(12).blur().jpeg({ quality: 60 }).toBuffer();
    const blurDataUrl = `data:image/jpeg;base64,${resized.toString("base64")}`;
    const url = getPublicUrl(key);
    const variants: Record<string, string> = { original: url };
    const webpSuffix = process.env.MEDIA_WEBP_SUFFIX || "";
    const avifSuffix = process.env.MEDIA_AVIF_SUFFIX || "";
    if (webpSuffix) variants.webp = `${url}${webpSuffix}`;
    if (avifSuffix) variants.avif = `${url}${avifSuffix}`;

    const existing = await prisma.mediaAsset.findUnique({ where: { key } });

    const asset = await prisma.mediaAsset.upsert({
      where: { key },
      update: {
        mime: effectiveMime,
        size,
        width: metadata.width || null,
        height: metadata.height || null,
        altText,
        folder: folder || null,
        blurDataUrl,
        url,
        variants,
      },
      create: {
        key,
        url,
        mime: effectiveMime,
        size,
        width: metadata.width || null,
        height: metadata.height || null,
        altText,
        folder: folder || null,
        blurDataUrl,
        variants,
      },
    });

    await logAdminAction({
      actorId: auth.user.id,
      action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: "MediaAsset",
      entityId: asset.id,
      before: existing || undefined,
      after: asset,
      request,
    });

    return NextResponse.json(asset);
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "Failed to process image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

