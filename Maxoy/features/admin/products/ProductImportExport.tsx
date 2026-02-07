"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  AdminContainer,
  Button,
  Card,
  CardBody,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/features/admin/ui-kit";

export default function ProductImportExport() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [createMissingCategories, setCreateMissingCategories] = useState(true);

  const REQUIRED_FIELDS = ["sku", "nameTR", "nameEN", "priceRetail", "stockQty", "categoryId"];

  const normalizeHeaderKey = (key: string) =>
    String(key || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

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

  const normalizeInputRow = (row: Record<string, any>) => {
    const out: Record<string, any> = {};
    Object.keys(row || {}).forEach((rawKey) => {
      const normalized = normalizeHeaderKey(rawKey);
      const mapped = HEADER_ALIAS[normalized];
      if (!mapped) return;
      out[mapped] = row[rawKey];
    });
    return out;
  };

  const toNumber = (value: unknown) => Number(String(value ?? "").trim().replace(",", "."));

  const template = useMemo(() => {
    const header = [
      "sku",
      "nameTR",
      "nameEN",
      "priceRetail",
      "stockQty",
      "categoryId",
      "slug",
      "isActive",
    ];
    const example = [
      "YC-001",
      "Kırmızı Gül Demeti",
      "Red Rose Bouquet",
      "299",
      "50",
      "yapay-cicek",
      "kirmizi-gul-demeti",
      "true",
    ];
    const csv = [header, example]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return { header, csv };
  }, []);

  const downloadText = (name: string, content: string, type = "text/csv;charset=utf-8") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseFile = async (f: File) => {
    setImportResult(null);
    setErrors([]);
    setRows([]);
    if (!f) return;

    try {
      const buf = await f.arrayBuffer();
      let parsedRows: Array<Record<string, any>> = [];

      if (f.name.toLowerCase().endsWith(".csv")) {
        const parsed = Papa.parse(new TextDecoder("utf-8").decode(buf), { header: true, skipEmptyLines: true });
        parsedRows = (parsed.data as any[]) || [];
      } else if (f.name.toLowerCase().endsWith(".xlsx")) {
        const workbook = XLSX.read(buf, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedRows = XLSX.utils.sheet_to_json(sheet) as any[];
      } else {
        toast.error("Unsupported file type (use .csv or .xlsx)");
        return;
      }

      parsedRows = parsedRows.map((r) => normalizeInputRow(r));

      const nextErrors: Array<{ row: number; message: string }> = [];

      parsedRows.forEach((r, idx) => {
        const missing = REQUIRED_FIELDS.filter((f) => !String(r[f] ?? "").trim());
        if (missing.length) {
          nextErrors.push({ row: idx + 2, message: `Missing required fields: ${missing.join(", ")}` });
        }
        const pr = toNumber(r.priceRetail);
        const sq = toNumber(r.stockQty);
        if (Number.isNaN(pr) || pr < 0) nextErrors.push({ row: idx + 2, message: "priceRetail must be a non-negative number" });
        if (!Number.isInteger(sq) || sq < 0) nextErrors.push({ row: idx + 2, message: "stockQty must be a non-negative integer" });
      });

      setRows(parsedRows);
      setErrors(nextErrors);
    } catch (e: any) {
      toast.error(e?.message || "Failed to parse file");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    if (errors.length) {
      toast.error("Fix validation errors first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("updateExisting", updateExisting ? "1" : "0");
    formData.append("createMissingCategories", createMissingCategories ? "1" : "0");
    setImporting(true);
    const res = await fetch("/api/admin/products/import", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    setImporting(false);
    if (!res.ok) {
      toast.error(data.error || "Import failed");
      setImportResult(null);
      return;
    }
    setImportResult(data);
    toast.success("Import finished");
  };

  const handleExport = async () => {
    const res = await fetch("/api/admin/products/export");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Import / Export"
        description="Import products from CSV/XLSX with preview and validation, or export current products."
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              Export products CSV
            </Button>
            <Button variant="secondary" onClick={() => downloadText("products-template.csv", template.csv)}>
              Download template CSV
            </Button>
          </>
        }
      />

      <Card>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <FormField label="Import file" helperText="CSV or XLSX">
              <Input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  if (f) parseFile(f);
                }}
              />
            </FormField>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
                <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} />
                Update existing products (match by SKU)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
                <input
                  type="checkbox"
                  checked={createMissingCategories}
                  onChange={(e) => setCreateMissingCategories(e.target.checked)}
                />
                Create missing categories (by categoryId slug)
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={handleImport} disabled={!file || importing || errors.length > 0}>
                  {importing ? "Importing…" : "Import"}
                </Button>
                {errors.length ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const csv = [["row", "message"], ...errors.map((e) => [String(e.row), e.message])]
                        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
                        .join("\n");
                      downloadText("import-errors.csv", csv);
                    }}
                  >
                    Download error report
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {!file ? (
              <EmptyState title="Choose a file to preview" description="We’ll validate rows before importing." />
            ) : rows.length === 0 ? (
              <EmptyState title="No rows found" description="Check that your file has a header row and at least one data row." />
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: "rgba(17,24,39,0.7)" }}>
                    Rows: <strong>{rows.length}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: errors.length ? "#b91c1c" : "rgba(17,24,39,0.7)" }}>
                    Errors: <strong>{errors.length}</strong>
                  </div>
                </div>

                <TableWrap>
                  <Table>
                    <thead>
                      <Tr hover={false}>
                        <Th>sku</Th>
                        <Th>nameTR</Th>
                        <Th>nameEN</Th>
                        <Th>priceRetail</Th>
                        <Th>stockQty</Th>
                        <Th>categoryId</Th>
                        <Th>isActive</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 20).map((r, idx) => (
                        <Tr key={idx}>
                          <Td>{String(r.sku ?? "")}</Td>
                          <Td>{String(r.nameTR ?? "")}</Td>
                          <Td>{String(r.nameEN ?? "")}</Td>
                          <Td>{String(r.priceRetail ?? "")}</Td>
                          <Td>{String(r.stockQty ?? "")}</Td>
                          <Td>{String(r.categoryId ?? "")}</Td>
                          <Td>{String(r.isActive ?? "")}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>

                {errors.length ? (
                  <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 13 }}>
                    Fix errors before importing. (Tip: download the error report CSV.)
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {importResult ? (
        <Card>
          <CardBody>
            <div style={{ fontWeight: 900, fontSize: 14 }}>Import result</div>
            <div style={{ marginTop: 8, fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
              Imported: <strong>{importResult.imported ?? 0}</strong> • Updated: <strong>{importResult.updated ?? 0}</strong> • Skipped:{" "}
              <strong>{importResult.skipped ?? 0}</strong> • Errors: <strong>{(importResult.errors || []).length}</strong>
              {importResult.dbOffline ? (
                <span style={{ marginLeft: 10 }}>
                  • <strong style={{ color: "#b45309" }}>DB offline</strong>
                </span>
              ) : null}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </AdminContainer>
  );
}
