import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { getObjectStream } from "@/lib/storage";

function redactEnvValue(key: string, value: string | undefined) {
  if (!value) return null;
  const isSecret =
    key.includes("SECRET") ||
    key.includes("PASSWORD") ||
    key.includes("TOKEN") ||
    key.includes("KEY") ||
    key.includes("DATABASE_URL");
  if (!isSecret) return value;
  if (value.length <= 6) return "***";
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "dashboard:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const envKeys = [
    "DATABASE_URL",
    "S3_BUCKET",
    "S3_REGION",
    "S3_ENDPOINT",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "MEDIA_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_MEDIA_BASE_URL",
  ];

  const env = Object.fromEntries(
    envKeys.map((k) => [k, { present: Boolean(process.env[k]), value: redactEnvValue(k, process.env[k]) }])
  );

  const checks: any = {
    db: { ok: false as boolean, detail: "" as string },
    media: { ok: false as boolean, detail: "" as string },
    env: { ok: true as boolean, detail: "" as string, env },
  };

  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db.ok = true;
    checks.db.detail = "Connected";
  } catch (e: any) {
    checks.db.ok = false;
    checks.db.detail = "Database unreachable";
  }

  // Storage/media check (best effort)
  try {
    const asset = await prisma.mediaAsset.findFirst({ where: { deletedAt: null }, select: { id: true, key: true } });
    if (!asset) {
      checks.media.ok = true;
      checks.media.detail = "No media assets found (skipped object fetch)";
    } else {
      await getObjectStream(asset.key);
      checks.media.ok = true;
      checks.media.detail = `Fetched object stream for ${asset.id}`;
    }
  } catch {
    checks.media.ok = false;
    checks.media.detail = "Storage/media check failed (DB or S3)";
  }

  const ok = Boolean(checks.db.ok && checks.env.ok && checks.media.ok);
  return NextResponse.json({ ok, checks });
}

