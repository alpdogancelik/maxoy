"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import styles from "./category.module.scss";
import { toSlug } from "@/lib/slug";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  DbStatusBanner,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Skeleton,
  useConfirm,
} from "@/features/admin/ui-kit";

export type CategoryNode = {
  id: string;
  nameTR: string;
  nameEN: string;
  slug: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  deletedAt?: string | null;
  children?: CategoryNode[];
};

export default function CategoryManager() {
  const { confirm } = useConfirm();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [items, setItems] = useState<CategoryNode[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nameTR: "", nameEN: "", slug: "", parentId: "" });
  const [dragged, setDragged] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/categories${showDeleted ? "?includeDeleted=1" : ""}`);
    const data = await res.json().catch(() => null);
    if (data) {
      setItems((data.items || []) as CategoryNode[]);
      setTree(data.tree || []);
      setProductCounts((data.productCounts || {}) as Record<string, number>);
      setDbOffline(Boolean(data.dbOffline) || res.status === 503);
    } else {
      toast.error("Failed to load categories");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [showDeleted]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameTR: form.nameTR,
        nameEN: form.nameEN,
        slug: form.slug || undefined,
        parentId: form.parentId || null,
      }),
    });
    if (res.ok) {
      setForm({ nameTR: "", nameEN: "", slug: "", parentId: "" });
      toast.success("Category created");
      load();
    } else {
      if (res.status === 409) toast.error("Slug already exists");
      else toast.error("Create failed");
    }
  };

  const handleQuickEdit = async (id: string, patch: Partial<CategoryNode>) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Updated");
      load();
    } else {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete category?",
      description: "This will soft-delete the category. You can restore it later.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      load();
    } else {
      toast.error("Delete failed");
    }
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}/restore`, { method: "POST" });
    if (res.ok) {
      toast.success("Restored");
      load();
    } else {
      toast.error("Restore failed");
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!dragged || dragged === targetId) return;
    const prev = tree;

    const removeNode = (nodes: CategoryNode[], id: string): { next: CategoryNode[]; removed: CategoryNode | null } => {
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        if (n.id === id) {
          const next = [...nodes.slice(0, i), ...nodes.slice(i + 1)];
          return { next, removed: { ...n, children: n.children ? [...n.children] : undefined } };
        }
        if (n.children?.length) {
          const childRes = removeNode(n.children, id);
          if (childRes.removed) {
            const next = nodes.map((x) => (x.id === n.id ? { ...n, children: childRes.next } : x));
            return { next, removed: childRes.removed };
          }
        }
      }
      return { next: nodes, removed: null };
    };

    const insertBefore = (nodes: CategoryNode[], target: string, node: CategoryNode): { next: CategoryNode[]; inserted: boolean } => {
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        if (n.id === target) {
          const next = [...nodes.slice(0, i), node, ...nodes.slice(i)];
          return { next, inserted: true };
        }
        if (n.children?.length) {
          const childRes = insertBefore(n.children, target, node);
          if (childRes.inserted) {
            const next = nodes.map((x) => (x.id === n.id ? { ...n, children: childRes.next } : x));
            return { next, inserted: true };
          }
        }
      }
      return { next: nodes, inserted: false };
    };

    const removedRes = removeNode(prev, dragged);
    const movedNode = removedRes.removed;
    if (movedNode) {
      const insertedRes = insertBefore(removedRes.next, targetId, movedNode);
      if (insertedRes.inserted) setTree(insertedRes.next);
    }

    const res = await fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: dragged, targetId }),
    });
    setDragged(null);
    if (res.ok) {
      toast.success("Reordered");
      load();
    } else {
      setTree(prev);
      toast.error("Reorder failed");
    }
  };

  const filteredTree = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tree;
    const filter = (nodes: CategoryNode[]): CategoryNode[] => {
      const out: CategoryNode[] = [];
      nodes.forEach((n) => {
        const hit = `${n.nameTR} ${n.nameEN} ${n.slug}`.toLowerCase().includes(term);
        const kids = n.children?.length ? filter(n.children) : [];
        if (hit || kids.length) out.push({ ...n, children: kids.length ? kids : n.children ? [] : undefined });
      });
      return out;
    };
    return filter(tree);
  }, [search, tree]);

  const existingSlugs = useMemo(() => new Set(items.map((c) => c.slug)), [items]);
  const slugCandidate = useMemo(() => {
    const raw = form.slug.trim() || form.nameTR.trim();
    return raw ? toSlug(raw) : "";
  }, [form.nameTR, form.slug]);
  const slugTaken = Boolean(slugCandidate && existingSlugs.has(slugCandidate));

  const renderTree = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map((node) => (
      <div
        key={node.id}
        className={styles.row}
        style={{ marginLeft: depth * 16 }}
        draggable
        onDragStart={() => setDragged(node.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(node.id)}
      >
        <div>
          <strong>{node.nameTR}</strong>{" "}
          <span>
            ({node.slug}){" "}
            {productCounts[node.id] !== undefined ? <Badge tone="neutral">{String(productCounts[node.id])}</Badge> : null}
          </span>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => handleQuickEdit(node.id, { isActive: !node.isActive })}>
            {node.isActive ? "Deactivate" : "Activate"}
          </Button>
          {node.deletedAt ? (
            <Button variant="secondary" onClick={() => handleRestore(node.id)}>
              Restore
            </Button>
          ) : (
            <Button variant="danger" onClick={() => handleDelete(node.id)}>
              Delete
            </Button>
          )}
        </div>
        {node.children?.length ? renderTree(node.children, depth + 1) : null}
      </div>
    ));
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Categories"
        description="Manage category structure and ordering."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <DbStatusBanner
        status={dbOffline ? "offline" : "online"}
        message={dbOffline ? "Database is unavailable. Start Postgres and run Prisma migrations/seed." : "Manage category structure and ordering."}
        onRetry={load}
        retryDisabled={loading}
      />

      <Card>
        <CardBody>
          <form className={styles.form} onSubmit={handleCreate}>
            <FormField label="Name (TR)" required>
              <Input
                value={form.nameTR}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm((prev) => ({ ...prev, nameTR: next, slug: prev.slug ? prev.slug : toSlug(next) }));
                }}
              />
            </FormField>
            <FormField label="Name (EN)" required>
              <Input value={form.nameEN} onChange={(e) => setForm({ ...form, nameEN: e.target.value })} />
            </FormField>
            <FormField
              label="Slug (optional)"
              error={slugTaken ? "Slug already exists" : undefined}
              helperText={slugCandidate ? `Normalized: ${slugCandidate}` : undefined}
            >
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                onBlur={() => {
                  if (form.slug.trim()) setForm((prev) => ({ ...prev, slug: toSlug(prev.slug) }));
                }}
                placeholder="yapay-cicek"
              />
            </FormField>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="primary" type="submit" disabled={loading || !form.nameTR || !form.nameEN || slugTaken}>
                Add category
              </Button>
            </div>
          </form>

          <label className={styles.toggle}>
            <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
            Show deleted
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <FormField label="Search">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or slug…" />
            </FormField>
          </div>
          <div className={styles.tree}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton height={18} />
                <Skeleton height={18} />
                <Skeleton height={18} />
              </div>
            ) : filteredTree.length === 0 ? (
              <EmptyState title="No categories" description="Create your first category above." />
            ) : (
              renderTree(filteredTree)
            )}
          </div>
        </CardBody>
      </Card>
    </AdminContainer>
  );
}
