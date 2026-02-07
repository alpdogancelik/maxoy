"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  Drawer,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  useConfirm,
  useUnsavedChanges,
} from "@/features/admin/ui-kit";

type CatalogPage = {
  id: string;
  key: string;
  path: string;
  status: string;
  publishedAt?: string | null;
  sortOrder: number;
  navVisible?: boolean;
  titleTR: string;
  titleEN: string;
  seoTitleTR?: string | null;
  seoTitleEN?: string | null;
  seoDescTR?: string | null;
  seoDescEN?: string | null;
  initialMainCategory?: string | null;
  initialSubcategory?: string | null;
  allowedMainCategories: string[];
  allowedSubcategories: string[];
  sidebarItems?: Array<{ labelTR: string; labelEN?: string | null; category?: string | null }> | null;
};

function parseCsv(input: string) {
  return input
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function csv(value: string[] | null | undefined) {
  return (value || []).join(", ");
}

export default function CatalogPagesManager() {
  const { confirm } = useConfirm();
  const [items, setItems] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const current = useMemo(() => items.find((x) => x.id === openId) || null, [items, openId]);

  const [draft, setDraft] = useState<Partial<CatalogPage> | null>(null);
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [sidebarJsonText, setSidebarJsonText] = useState("");
  const [sidebarJsonError, setSidebarJsonError] = useState<string | null>(null);

  const dirty = useMemo(() => {
    if (!draft || !initialJson) return false;
    return JSON.stringify(draft) !== initialJson;
  }, [draft, initialJson]);

  useUnsavedChanges(dirty, "You have unsaved Catalog Page changes. Leave this page?");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/catalog-pages");
    const data = await res.json().catch(() => null);
    if (data) {
      setItems((data.items || []) as CatalogPage[]);
      setDbOffline(Boolean(data.dbOffline) || res.status === 503);
    } else {
      toast.error("Failed to load catalog pages");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const open = async (id: string) => {
    if (dirty) {
      const ok = await confirm({
        title: "Unsaved changes",
        description: "Discard changes and open another page?",
        confirmText: "Discard",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
    }
    setOpenId(id);
    const page = items.find((x) => x.id === id) || null;
    if (!page) return;
    const next: Partial<CatalogPage> = { ...page };
    setDraft(next);
    setInitialJson(JSON.stringify(next));
    setSidebarJsonText(JSON.stringify(next.sidebarItems || [], null, 2));
    setSidebarJsonError(null);
  };

  const close = async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Unsaved changes",
        description: "Discard changes and close?",
        confirmText: "Discard",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
    }
    setOpenId(null);
    setDraft(null);
    setInitialJson(null);
    setSidebarJsonText("");
    setSidebarJsonError(null);
  };

  const update = (patch: Partial<CatalogPage>) => {
    setDraft((prev) => ({ ...(prev || {}), ...patch }));
  };

  const save = async () => {
    if (!draft?.id) return;
    if (sidebarJsonError) {
      toast.error("Sidebar JSON invalid");
      return;
    }
    const res = await fetch(`/api/admin/catalog-pages/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: draft.key,
        path: draft.path,
        titleTR: draft.titleTR,
        titleEN: draft.titleEN,
        seoTitleTR: draft.seoTitleTR ?? null,
        seoTitleEN: draft.seoTitleEN ?? null,
        seoDescTR: draft.seoDescTR ?? null,
        seoDescEN: draft.seoDescEN ?? null,
        initialMainCategory: draft.initialMainCategory ?? null,
        initialSubcategory: draft.initialSubcategory ?? null,
        allowedMainCategories: draft.allowedMainCategories || [],
        allowedSubcategories: draft.allowedSubcategories || [],
        sortOrder: Number(draft.sortOrder || 0),
        navVisible: Boolean(draft.navVisible),
        sidebarItems: draft.sidebarItems ?? null,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const errorText =
        typeof payload?.error === "string"
          ? payload.error
          : res.status === 403
            ? "Forbidden: missing catalog-pages:update permission"
            : res.status === 503
              ? "Database unavailable"
              : "Save failed";
      toast.error(errorText);
      return;
    }

    const updated = (await res.json()) as CatalogPage;
    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setDraft({ ...updated });
    setInitialJson(JSON.stringify(updated));
    setSidebarJsonText(JSON.stringify(updated.sidebarItems || [], null, 2));
    setSidebarJsonError(null);
    toast.success("Saved");
  };

  const publish = async () => {
    if (!draft?.id) return;
    const res = await fetch(`/api/admin/catalog-pages/${draft.id}/publish`, { method: "POST" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const errorText =
        typeof payload?.error === "string"
          ? payload.error
          : res.status === 403
            ? "Forbidden: missing catalog-pages:publish permission"
            : res.status === 503
              ? "Database unavailable"
              : "Publish failed";
      toast.error(errorText);
      return;
    }
    toast.success("Published");
    load();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Delete page?",
      description: "This will permanently remove the catalog page definition.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/catalog-pages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    if (openId === id) await close();
    load();
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Catalog Pages"
        description="Manage product listing pages (titles, included categories, SEO)."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Card>
        <CardBody>
          {items.length === 0 ? (
            <EmptyState title="No catalog pages" description={dbOffline ? "Database offline." : "Create pages to render listing routes."} />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Key</Th>
                    <Th>Path</Th>
                    <Th>Title (TR)</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </thead>
                <tbody>
                  {items
                    .slice()
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((it) => (
                      <Tr key={it.id}>
                        <Td>
                          <code>{it.key}</code>
                        </Td>
                        <Td>{it.path}</Td>
                        <Td>{it.titleTR}</Td>
                        <Td>
                          <Badge tone={it.status === "PUBLISHED" ? "success" : "neutral"}>{it.status}</Badge>
                        </Td>
                        <Td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Button variant="secondary" onClick={() => open(it.id)}>
                              Edit
                            </Button>
                            <Button variant="danger" onClick={() => remove(it.id)}>
                              Delete
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardBody>
      </Card>

      <Drawer
        open={Boolean(openId)}
        title={current ? `Edit: ${current.path}` : "Edit"}
        onClose={close}
      >
        {!draft ? null : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Badge tone={draft.status === "PUBLISHED" ? "success" : "neutral"}>{draft.status || "DRAFT"}</Badge>
              {draft.publishedAt ? (
                <span style={{ fontSize: 12, color: "rgba(17,24,39,0.7)" }}>Published: {new Date(draft.publishedAt).toLocaleString()}</span>
              ) : null}
            </div>

            <FormField label="Key" required>
              <Input value={draft.key || ""} onChange={(e) => update({ key: e.target.value })} />
            </FormField>
            <FormField label="Path" required helperText="This should match your Next.js route (e.g. /tum-urunler)">
              <Input value={draft.path || ""} onChange={(e) => update({ path: e.target.value })} />
            </FormField>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(draft.navVisible)}
                onChange={(e) => update({ navVisible: e.target.checked })}
              />
              Show in Navbar dropdown
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <FormField label="Title (TR)" required>
                <Input value={draft.titleTR || ""} onChange={(e) => update({ titleTR: e.target.value })} />
              </FormField>
              <FormField label="Title (EN)" required>
                <Input value={draft.titleEN || ""} onChange={(e) => update({ titleEN: e.target.value })} />
              </FormField>
            </div>

            <details>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>SEO (optional)</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  <FormField label="SEO Title (TR)">
                    <Input value={draft.seoTitleTR || ""} onChange={(e) => update({ seoTitleTR: e.target.value })} />
                  </FormField>
                  <FormField label="SEO Title (EN)">
                    <Input value={draft.seoTitleEN || ""} onChange={(e) => update({ seoTitleEN: e.target.value })} />
                  </FormField>
                </div>
                <FormField label="SEO Description (TR)">
                  <Input value={draft.seoDescTR || ""} onChange={(e) => update({ seoDescTR: e.target.value })} />
                </FormField>
                <FormField label="SEO Description (EN)">
                  <Input value={draft.seoDescEN || ""} onChange={(e) => update({ seoDescEN: e.target.value })} />
                </FormField>
              </div>
            </details>

            <details open>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Filtering</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  <FormField label="Initial main category" helperText='Use "All" or a main code (A..I)'>
                    <Input value={(draft.initialMainCategory as any) || ""} onChange={(e) => update({ initialMainCategory: e.target.value })} />
                  </FormField>
                  <FormField label="Initial subcategory" helperText="Use a sub code (e.g. F4)">
                    <Input value={(draft.initialSubcategory as any) || ""} onChange={(e) => update({ initialSubcategory: e.target.value })} />
                  </FormField>
                </div>
                <FormField label="Allowed main categories (CSV)" helperText="Leave empty = all">
                  <Input
                    value={csv(draft.allowedMainCategories as any)}
                    onChange={(e) => update({ allowedMainCategories: parseCsv(e.target.value) })}
                    placeholder="F, G, E"
                  />
                </FormField>
                <FormField label="Allowed subcategories (CSV)" helperText="Leave empty = all (within main filter)">
                  <Input
                    value={csv(draft.allowedSubcategories as any)}
                    onChange={(e) => update({ allowedSubcategories: parseCsv(e.target.value) })}
                    placeholder="F4, D2, F3"
                  />
                </FormField>
                <FormField label="Sort order" helperText="Admin list ordering only">
                  <Input
                    value={String(draft.sortOrder ?? 0)}
                    onChange={(e) => update({ sortOrder: e.target.value === "" ? 0 : Number(e.target.value) } as any)}
                    type="number"
                    step="1"
                    min="0"
                  />
                </FormField>
              </div>
            </details>

            <details>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Sidebar (optional)</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <FormField
                  label="Sidebar items JSON"
                  helperText='Example: [{"labelTR":"Aksesuarlar","labelEN":"Accessories","category":"E4"}]'
                >
	                  <textarea
                    style={{
                      width: "100%",
                      minHeight: 140,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: 12,
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.12)",
                    }}
	                    value={sidebarJsonText}
	                    onChange={(e) => {
	                      const next = e.target.value;
	                      setSidebarJsonText(next);
	                      if (!next.trim()) {
	                        setSidebarJsonError(null);
	                        update({ sidebarItems: null });
	                        return;
	                      }
	                      try {
	                        const parsed = JSON.parse(next);
	                        setSidebarJsonError(null);
	                        update({ sidebarItems: parsed });
	                      } catch {
	                        setSidebarJsonError("Invalid JSON");
	                      }
	                    }}
	                  />
	                  {sidebarJsonError ? (
	                    <div style={{ color: "#b42318", fontSize: 12, marginTop: 6 }}>
	                      {sidebarJsonError}
	                    </div>
	                  ) : null}
	                </FormField>
	              </div>
	            </details>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              <Button variant="primary" onClick={save} disabled={!dirty}>
                Save
              </Button>
              <Button variant="danger" onClick={publish}>
                Publish
              </Button>
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </AdminContainer>
  );
}
