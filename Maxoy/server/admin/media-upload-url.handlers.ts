import { NextRequest, NextResponse } from "next/server";
import { MediaUploadRequestSchema } from "@/lib/validators/media";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { getPresignedUploadUrl } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { toSlug } from "@/lib/slug";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = Number(process.env.MEDIA_MAX_SIZE || 8 * 1024 * 1024);

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "media:upload");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const limiter = rateLimit({
    key: `media:${auth.user.id}`,
    limit: 40,
    windowMs: 60 * 1000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = MediaUploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { fileName, mime, size, folder } = parsed.data;
  if (!ALLOWED_MIME.includes(mime)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const ext = fileName.split(".").pop() || "bin";
  const baseName = toSlug(fileName.replace(new RegExp(`\\.${ext}$`), "")) || "asset";
  const key = folder ? `${folder}/${Date.now()}-${baseName}.${ext}` : `uploads/${Date.now()}-${baseName}.${ext}`;

  const presigned = await getPresignedUploadUrl({ key, contentType: mime, contentLength: size });
  return NextResponse.json(presigned);
}

