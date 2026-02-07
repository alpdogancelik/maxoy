import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs";
import path from "node:path";

const region = process.env.S3_REGION || "auto";
const endpoint = process.env.S3_ENDPOINT || undefined;
const bucket = process.env.S3_BUCKET || "";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";
const mediaStorageMode = String(process.env.MEDIA_STORAGE || "").toLowerCase();

const hasS3Credentials = Boolean(bucket && accessKeyId && secretAccessKey);
const shouldUseLocalMedia =
  mediaStorageMode === "local" ||
  (!hasS3Credentials && mediaStorageMode !== "s3");

if (!hasS3Credentials) {
  console.warn(
    "S3 credentials are incomplete. Falling back to local media storage (public/)."
  );
}

export const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: Boolean(endpoint),
  credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

function assertSafeKey(key: string) {
  if (!key || typeof key !== "string") throw new Error("Invalid key");
  const normalized = key.replace(/\\/g, "/");
  if (normalized.includes("..")) throw new Error("Invalid key path");
  if (normalized.startsWith("/")) throw new Error("Key must be relative");
  return normalized;
}

function localPublicPathForKey(key: string) {
  const safeKey = assertSafeKey(key);
  return path.join(process.cwd(), "public", safeKey);
}

export function getPublicUrl(key: string) {
  if (shouldUseLocalMedia) {
    const safeKey = assertSafeKey(key);
    return safeKey.startsWith("/") ? safeKey : `/${safeKey}`;
  }
  const base = process.env.MEDIA_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "";
  if (!base) return key;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function getPresignedUploadUrl({
  key,
  contentType,
  contentLength,
}: {
  key: string;
  contentType: string;
  contentLength?: number;
}) {
  if (shouldUseLocalMedia) {
    const safeKey = assertSafeKey(key);
    const url = `/api/admin/media/upload?key=${encodeURIComponent(safeKey)}`;
    return { url, key: safeKey, publicUrl: getPublicUrl(safeKey) };
  }
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
  return { url, key, publicUrl: getPublicUrl(key) };
}

export async function getObjectStream(key: string) {
  if (shouldUseLocalMedia) {
    const filePath = localPublicPathForKey(key);
    return { Body: fs.createReadStream(filePath) };
  }
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return s3Client.send(command);
}

export async function deleteObject(key: string) {
  if (shouldUseLocalMedia) {
    const filePath = localPublicPathForKey(key);
    await fs.promises.unlink(filePath);
    return { ok: true };
  }
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  return s3Client.send(command);
}

function encodeS3KeyForCopySource(key: string) {
  return key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export async function moveObject(oldKey: string, newKey: string) {
  if (shouldUseLocalMedia) {
    const oldPath = localPublicPathForKey(oldKey);
    const newPath = localPublicPathForKey(newKey);
    await fs.promises.mkdir(path.dirname(newPath), { recursive: true });
    await fs.promises.rename(oldPath, newPath);
    return { ok: true };
  }
  if (!bucket) throw new Error("S3 bucket not configured");
  const copySource = `${bucket}/${encodeS3KeyForCopySource(oldKey)}`;
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: newKey,
      CopySource: copySource,
    })
  );
  await deleteObject(oldKey).catch(() => null);
}
