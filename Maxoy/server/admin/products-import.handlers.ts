import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { toSlug } from "@/lib/slug";

const REQUIRED_FIELDS = ["sku", "nameTR", "nameEN", "priceRetail", "stockQty", "categoryId"];
export const runtime = "nodejs";

function normalizeHeaderKey(key: string) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const HEADER_ALIAS: Record<string, string> = {
  sku: "sku",
  urunkodu: "sku",
  productcode: "sku",
  nametr: "nameTR",
  urunadi: "nameTR",
  urunaditr: "nameTR",
  titletr: "nameTR",
  nameen: "nameEN",
  productnameen: "nameEN",
  titleen: "nameEN",
  priceretail: "priceRetail",
  retailprice: "priceRetail",
  fiyat: "priceRetail",
  fiyatretail: "priceRetail",
  stockqty: "stockQty",
  stock: "stockQty",
  quantity: "stockQty",
  stok: "stockQty",
  categoryid: "categoryId",
  category: "categoryId",
  categoryslug: "categoryId",
  slug: "slug",
  isactive: "isActive",
  active: "isActive",
};

function normalizeInputRow(row: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.keys(row || {}).forEach((rawKey) => {
    const normalized = normalizeHeaderKey(rawKey);
    const mapped = HEADER_ALIAS[normalized];
    if (!mapped) return;
    out[mapped] = row[rawKey];
  });
  return out;
}

function toNumber(value: unknown) {
  const raw = String(value ?? "").trim().replace(",", ".");
  const num = Number(raw);
  return num;
}

function normalizeRow(row: Record<string, any>) {
  return {
    sku: String(row.sku || "").trim(),
    nameTR: String(row.nameTR || "").trim(),
    nameEN: String(row.nameEN || "").trim(),
    priceRetail: toNumber(row.priceRetail),
    stockQty: toNumber(row.stockQty),
    categoryId: String(row.categoryId || "").trim(),
    slug: row.slug ? String(row.slug).trim() : "",
    isActive: row.isActive !== undefined ? String(row.isActive).toLowerCase() === "true" : true,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "products:import-export");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const updateExisting = String(formData.get("updateExisting") ?? "1") !== "0";
  const createMissingCategories = String(formData.get("createMissingCategories") ?? "0") === "1";
  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, any>[] = [];

  if (file.name.endsWith(".csv")) {
    const parsed = Papa.parse(buffer.toString("utf-8"), { header: true });
    rows = (parsed.data as Record<string, any>[]).map(normalizeInputRow);
  } else if (file.name.endsWith(".xlsx")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = (XLSX.utils.sheet_to_json(sheet) as Record<string, any>[]).map(normalizeInputRow);
  } else {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ row: number; sku?: string; message: string }> = [];

  try {
    for (const [index, raw] of rows.entries()) {
      const rowNo = index + 2; // header is row 1
      const row = normalizeRow(raw);
      const missing = REQUIRED_FIELDS.filter((field) => !row[field as keyof typeof row]);
      if (missing.length) {
        errors.push({ row: rowNo, sku: row.sku, message: `Missing ${missing.join(", ")}` });
        skipped += 1;
        continue;
      }
      if (Number.isNaN(row.priceRetail) || row.priceRetail < 0) {
        errors.push({ row: rowNo, sku: row.sku, message: "priceRetail must be a non-negative number" });
        skipped += 1;
        continue;
      }
      if (!Number.isInteger(row.stockQty) || row.stockQty < 0) {
        errors.push({ row: rowNo, sku: row.sku, message: "stockQty must be a non-negative integer" });
        skipped += 1;
        continue;
      }

      // categoryId can be a real ID or a slug; allow creating missing categories for convenience
      let categoryId = row.categoryId;
      const categoryById = await prisma.category.findUnique({ where: { id: categoryId } }).catch(() => null);
      if (!categoryById) {
        const categoryBySlug = await prisma.category.findUnique({ where: { slug: categoryId } }).catch(() => null);
        if (categoryBySlug) {
          categoryId = categoryBySlug.id;
        } else if (createMissingCategories) {
          const slug = toSlug(categoryId) || `cat-${Date.now()}`;
          const created = await prisma.category.create({
            data: { slug, nameTR: categoryId, nameEN: categoryId, sortOrder: 0, isActive: true },
          });
          categoryId = created.id;
        } else {
          errors.push({ row: rowNo, sku: row.sku, message: `Category not found: ${row.categoryId}` });
          skipped += 1;
          continue;
        }
      }

      const slug = row.slug ? toSlug(row.slug) : toSlug(row.nameTR);

      const existing = await prisma.product.findUnique({ where: { sku: row.sku } });
      if (existing) {
        if (!updateExisting) {
          skipped += 1;
          continue;
        }
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            nameTR: row.nameTR,
            nameEN: row.nameEN,
            priceRetail: row.priceRetail,
            stockQty: row.stockQty,
            categoryId,
            slug,
            isActive: row.isActive,
          },
        });
        updated += 1;
      } else {
        await prisma.product.create({
          data: {
            sku: row.sku,
            nameTR: row.nameTR,
            nameEN: row.nameEN,
            priceRetail: row.priceRetail,
            stockQty: row.stockQty,
            categoryId,
            slug,
            isActive: row.isActive,
          },
        });
        imported += 1;
      }
    }

    return NextResponse.json({ imported, updated, skipped, errors });
  } catch {
    return NextResponse.json({ imported: 0, updated: 0, skipped: rows.length, errors, dbOffline: true });
  }
}

