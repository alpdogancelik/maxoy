import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertSafeKey(key: string) {
  const normalized = key.replace(/\\/g, "/");
  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error("Invalid key");
  }
  return normalized;
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "media:upload");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const keyParam = request.nextUrl.searchParams.get("key");
  if (!keyParam) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  let key = "";
  try {
    key = assertSafeKey(keyParam);
  } catch {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  const outPath = path.join(process.cwd(), "public", key);
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, buffer);

  return NextResponse.json({ ok: true });
}
