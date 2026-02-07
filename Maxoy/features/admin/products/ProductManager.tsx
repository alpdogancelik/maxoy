"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styles from "./product.module.scss";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useConfirm,
} from "@/features/admin/ui-kit";
import MediaPickerModal from "@/features/admin/media/MediaPickerModal";

export type ProductItem = {
  id: string;
  nameTR: string;
  nameEN: string;
  sku: string;
  slug: string;
  barcode?: string | null;
  categoryId?: string;
  priceRetail: number;
  priceWholesale?: number | null;
  priceVip?: number | null;
  stockQty: number;
  isActive: boolean;
  isFeatured: boolean;
  discount?: number | null;
  status?: string;
  publishedAt?: string | null;
  deletedAt?: string | null;
  shortDescTR?: string | null;
  shortDescEN?: string | null;
  longDescTR?: string | null;
  longDescEN?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  tags?: string[];
};

type Category = { id: string; nameTR: string };

const emptyForm = {
  nameTR: "",
  nameEN: "",
  slug: "",
  sku: "",
  barcode: "",
  categoryId: "",
  priceRetail: "0",
  priceWholesale: "",
  priceVip: "",
  discount: "",
  stockQty: "0",
  isActive: true,
  isFeatured: false,
  status: "DRAFT",
  tags: "",
  shortDescTR: "",
  shortDescEN: "",
  longDescTR: "",
  longDescEN: "",
  seoTitle: "",
  seoDesc: "",
};

function toErrorMessage(payload: any, fallback: string) {
  const err = payload?.error ?? payload;
  if (typeof err === "string" && err.trim()) return err;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (err && typeof err === "object") {
    const formErrors = Array.isArray((err as any).formErrors) ? (err as any).formErrors.filter(Boolean) : [];
    const fieldErrors = (err as any).fieldErrors && typeof (err as any).fieldErrors === "object"
      ? Object.values((err as any).fieldErrors).flat().filter(Boolean)
      : [];
    const merged = [...formErrors, ...fieldErrors].map((x) => String(x).trim()).filter(Boolean);
    if (merged.length > 0) return merged.join(" | ");
  }
  return fallback;
}

export default function ProductManager() {
  const { confirm } = useConfirm();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ inStock: false, inactive: false, discounted: false });
  const [showDeleted, setShowDeleted] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const [pickerOpen, setPickerOpen] = useState(false);
  const [gallery, setGallery] = useState<Array<{ assetId: string; url: string }>>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkStockDelta, setBulkStockDelta] = useState("0");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.inStock) params.set("inStock", "1");
    if (showDeleted) params.set("includeDeleted", "1");
    const res = await fetch(`/api/admin/products?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setDbOffline(Boolean(data.dbOffline));
      let items = data.items || [];
      if (filters.inactive) items = items.filter((item: ProductItem) => !item.isActive);
      if (filters.discounted) items = items.filter((item: ProductItem) => Number(item.discount || 0) > 0);
      setProducts(items);
    } else {
      toast.error("Failed to load products");
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.items || []);
    }
  };

  useEffect(() => {
    load();
    loadCategories();
  }, [showDeleted]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      priceRetail: Number(form.priceRetail),
      priceWholesale: form.priceWholesale ? Number(form.priceWholesale) : undefined,
      priceVip: form.priceVip ? Number(form.priceVip) : undefined,
      discount: form.discount ? Number(form.discount) : undefined,
      stockQty: Number(form.stockQty),
      tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()) : [],
      mediaIds: gallery.map((g) => g.assetId),
    };

    const res = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm(emptyForm);
      setEditingId(null);
      setGallery([]);
      toast.success(editingId ? "Product updated" : "Product created");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(toErrorMessage(data, "Save failed"));
    }
  };

  const handleEdit = async (product: ProductItem) => {
    setEditingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`);
      if (res.ok) {
        const full = await res.json();
        setGallery(Array.isArray(full.media) ? full.media.map((m: any) => ({ assetId: m.id, url: m.url })) : []);
        setForm({
          ...emptyForm,
          nameTR: full.nameTR,
          nameEN: full.nameEN,
          slug: full.slug,
          sku: full.sku,
          barcode: full.barcode || "",
          categoryId: full.categoryId || "",
          priceRetail: String(full.priceRetail),
          priceWholesale: full.priceWholesale ? String(full.priceWholesale) : "",
          priceVip: full.priceVip ? String(full.priceVip) : "",
          discount: full.discount ? String(full.discount) : "",
          stockQty: String(full.stockQty),
          isActive: Boolean(full.isActive),
          isFeatured: Boolean(full.isFeatured),
          status: full.status || "DRAFT",
          shortDescTR: full.shortDescTR || "",
          shortDescEN: full.shortDescEN || "",
          longDescTR: full.longDescTR || "",
          longDescEN: full.longDescEN || "",
          tags: Array.isArray(full.tags) ? full.tags.join(", ") : "",
          seoTitle: full.seoTitle || "",
          seoDesc: full.seoDesc || "",
        });
        return;
      }
    } catch {
      // ignore
    }

    setForm({
      ...emptyForm,
      nameTR: product.nameTR,
      nameEN: product.nameEN,
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode || "",
      categoryId: product.categoryId || "",
      priceRetail: String(product.priceRetail),
      priceWholesale: product.priceWholesale ? String(product.priceWholesale) : "",
      priceVip: product.priceVip ? String(product.priceVip) : "",
      discount: product.discount ? String(product.discount) : "",
      stockQty: String(product.stockQty),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      status: product.status || "DRAFT",
      shortDescTR: product.shortDescTR || "",
      shortDescEN: product.shortDescEN || "",
      longDescTR: product.longDescTR || "",
      longDescEN: product.longDescEN || "",
      tags: product.tags ? product.tags.join(", ") : "",
      seoTitle: product.seoTitle || "",
      seoDesc: product.seoDesc || "",
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete product?",
      description: "This will soft-delete the product. You can restore it later.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      load();
    } else {
      toast.error("Delete failed");
    }
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}/restore`, { method: "POST" });
    if (res.ok) {
      toast.success("Restored");
      load();
    } else {
      toast.error("Restore failed");
    }
  };

  const publishProduct = async (id: string) => {
    const ok = await confirm({
      title: "Publish product?",
      description: "This will mark the product as PUBLISHED.",
      confirmText: "Publish",
      cancelText: "Cancel",
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    if (!res.ok) {
      toast.error("Publish failed");
      return;
    }
    toast.success("Published");
    load();
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const selectedList = Object.entries(selectedIds)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const bulkAction = async (body: any) => {
    if (selectedList.length === 0) return;
    const res = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedList, ...body }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(toErrorMessage(data, "Bulk action failed"));
      return;
    }
    toast.success("Bulk action completed");
    setSelectedIds({});
    load();
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Products"
        description="Create, edit, publish, and manage products."
        actions={
          <>
            <Button variant="secondary" onClick={() => (window.location.href = "/admin/products/import")}>
              Import/Export
            </Button>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      {dbOffline ? (
        <Card>
          <CardBody>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="warn">DB offline</Badge>
              <div style={{ color: "rgba(17,24,39,0.7)", fontSize: 13 }}>
                Database is unavailable. Start Postgres and run Prisma migrations/seed.
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>{editingId ? "Edit product" : "New product"}</div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <CardBody>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Basics</div>
                <div className={styles.sectionGrid}>
                  <FormField label="Name (TR)" required>
                    <Input value={form.nameTR} onChange={(e) => setForm({ ...form, nameTR: e.target.value })} />
                  </FormField>
                  <FormField label="Name (EN)" required>
                    <Input value={form.nameEN} onChange={(e) => setForm({ ...form, nameEN: e.target.value })} />
                  </FormField>
                  <FormField label="SKU" required>
                    <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </FormField>
                  <FormField label="Slug">
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                  </FormField>
                  <FormField label="Barcode">
                    <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                  </FormField>
                  <FormField label="Category" required>
                    <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameTR}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Retail price" required>
                    <Input type="number" value={form.priceRetail} onChange={(e) => setForm({ ...form, priceRetail: e.target.value })} />
                  </FormField>
                  <FormField label="Stock qty" required>
                    <Input type="number" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
                  </FormField>
                  <FormField label="Status">
                    <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </Select>
                  </FormField>
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Active
                  </label>
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                    Featured
                  </label>
                  <FormField label="Tags (comma)">
                    <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                  </FormField>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>Media</div>
                    <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 13 }}>Cover is the first image.</div>
                  </div>
                  <Button variant="secondary" type="button" onClick={() => setPickerOpen(true)}>
                    Add media
                  </Button>
                </div>

                {gallery.length === 0 ? (
                  <div style={{ marginTop: 10, color: "rgba(17,24,39,0.65)", fontSize: 13 }}>No media yet.</div>
                ) : (
                  <div className={styles.mediaGrid} style={{ marginTop: 12 }}>
                    {gallery.map((g, idx) => (
                      <div key={g.assetId} className={styles.mediaTile}>
                        <img src={g.url} alt="" />
                        <div className={styles.mediaTileMeta}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: 12 }}>{idx === 0 ? "Cover" : `#${idx + 1}`}</div>
                            <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>{g.assetId.slice(-6)}</div>
                          </div>
                          <div className={styles.mediaTileActions}>
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() =>
                                setGallery((cur) => {
                                  if (idx === 0) return cur;
                                  const copy = [...cur];
                                  const [m] = copy.splice(idx, 1);
                                  copy.unshift(m);
                                  return copy;
                                })
                              }
                              disabled={idx === 0}
                            >
                              Set cover
                            </Button>
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() =>
                                setGallery((cur) => {
                                  if (idx === 0) return cur;
                                  const copy = [...cur];
                                  [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                  return copy;
                                })
                              }
                              disabled={idx === 0}
                            >
                              Up
                            </Button>
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() =>
                                setGallery((cur) => {
                                  if (idx === cur.length - 1) return cur;
                                  const copy = [...cur];
                                  [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                  return copy;
                                })
                              }
                              disabled={idx === gallery.length - 1}
                            >
                              Down
                            </Button>
                            <Button variant="danger" type="button" onClick={() => setGallery((cur) => cur.filter((x) => x.assetId !== g.assetId))}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>SEO</div>
                <div className={styles.sectionGrid}>
                  <FormField label="SEO title">
                    <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
                  </FormField>
                  <FormField label="SEO description">
                    <Textarea value={form.seoDesc} onChange={(e) => setForm({ ...form, seoDesc: e.target.value })} />
                  </FormField>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Descriptions</div>
                <div className={styles.sectionGrid}>
                  <FormField label="Short Desc TR">
                    <Input value={form.shortDescTR} onChange={(e) => setForm({ ...form, shortDescTR: e.target.value })} />
                  </FormField>
                  <FormField label="Short Desc EN">
                    <Input value={form.shortDescEN} onChange={(e) => setForm({ ...form, shortDescEN: e.target.value })} />
                  </FormField>
                  <FormField label="Long Desc TR">
                    <textarea className={styles.textarea} value={form.longDescTR} onChange={(e) => setForm({ ...form, longDescTR: e.target.value })} />
                  </FormField>
                  <FormField label="Long Desc EN">
                    <textarea className={styles.textarea} value={form.longDescEN} onChange={(e) => setForm({ ...form, longDescEN: e.target.value })} />
                  </FormField>
                </div>
              </CardBody>
            </Card>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <Button variant="primary" type="submit">
                {editingId ? "Update" : "Add"} product
              </Button>
              {editingId ? (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setGallery([]);
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      {selectedCount > 0 ? (
        <Card>
          <CardBody>
            <div className={styles.bulkBar}>
              <Badge tone="neutral">{selectedCount} selected</Badge>
              <Button
                variant="secondary"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Bulk publish?",
                    description: `Publish ${selectedCount} product(s)?`,
                    confirmText: "Publish",
                    cancelText: "Cancel",
                  });
                  if (!ok) return;
                  bulkAction({ action: "publish" });
                }}
              >
                Publish
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Bulk unpublish?",
                    description: `Set ${selectedCount} product(s) to DRAFT?`,
                    confirmText: "Unpublish",
                    cancelText: "Cancel",
                  });
                  if (!ok) return;
                  bulkAction({ action: "unpublish" });
                }}
              >
                Unpublish
              </Button>

              <FormField label="Category">
                <Select value={bulkCategoryId} onChange={(e) => setBulkCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameTR}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button
                variant="secondary"
                disabled={!bulkCategoryId}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Bulk change category?",
                    description: `Move ${selectedCount} product(s) to the selected category?`,
                    confirmText: "Change",
                    cancelText: "Cancel",
                  });
                  if (!ok) return;
                  bulkAction({ action: "setCategory", categoryId: bulkCategoryId });
                }}
              >
                Apply category
              </Button>

              <FormField label="Stock delta">
                <Input type="number" value={bulkStockDelta} onChange={(e) => setBulkStockDelta(e.target.value)} />
              </FormField>
              <Button
                variant="secondary"
                onClick={async () => {
                  const delta = Number(bulkStockDelta);
                  if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
                    toast.error("Stock delta must be an integer");
                    return;
                  }
                  const ok = await confirm({
                    title: "Bulk stock adjustment?",
                    description: `Adjust stock by ${delta} for ${selectedCount} product(s)?`,
                    confirmText: "Apply",
                    cancelText: "Cancel",
                  });
                  if (!ok) return;
                  bulkAction({ action: "adjustStock", delta });
                }}
              >
                Apply stock
              </Button>

              <Button variant="ghost" onClick={() => setSelectedIds({})}>
                Clear selection
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <FormField label="Search">
              <Input placeholder="Name or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
            </FormField>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label>
                <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })} />{" "}
                In stock
              </label>
              <label>
                <input type="checkbox" checked={filters.inactive} onChange={(e) => setFilters({ ...filters, inactive: e.target.checked })} />{" "}
                Inactive
              </label>
              <label>
                <input type="checkbox" checked={filters.discounted} onChange={(e) => setFilters({ ...filters, discounted: e.target.checked })} />{" "}
                Discounted
              </label>
              <label>
                <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} /> Show deleted
              </label>
              <Button variant="secondary" onClick={load} disabled={loading}>
                Search
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="No products" description="Create one above, or adjust your filters." />
          ) : (
            <div className={styles.list}>
              {products.map((product) => (
                <div key={product.id} className={styles.card}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds[product.id])}
                      onChange={(e) => setSelectedIds((cur) => ({ ...cur, [product.id]: e.target.checked }))}
                      aria-label={`Select ${product.nameTR}`}
                    />
                  </label>
                  <div>
                    <strong>{product.nameTR}</strong> <span>({product.sku})</span>
                  </div>
                  <div>{product.priceRetail} ₺</div>
                  <div>
                    Stock:{" "}
                    <Badge tone={product.stockQty === 0 ? "danger" : product.stockQty <= 5 ? "warn" : "neutral"}>
                      {String(product.stockQty)}
                    </Badge>
                  </div>
                  <div>Status: {product.status || "DRAFT"}</div>
                  {product.publishedAt && <div>Published: {new Date(product.publishedAt).toLocaleDateString()}</div>}
                  <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                    <Button variant="secondary" onClick={() => publishProduct(product.id)}>
                      Publish
                    </Button>
                    <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
                      Preview
                    </a>
                    {product.deletedAt ? (
                      <Button variant="secondary" onClick={() => handleRestore(product.id)}>
                        Restore
                      </Button>
                    ) : (
                      <Button variant="danger" onClick={() => handleDelete(product.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <MediaPickerModal
        open={pickerOpen}
        title="Add product media"
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          setGallery((cur) => (cur.some((x) => x.assetId === asset.assetId) ? cur : [...cur, asset]));
        }}
      />
    </AdminContainer>
  );
}
