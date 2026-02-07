"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  DbStatusBanner,
  Drawer,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StickySaveBar,
  Textarea,
  useConfirm,
} from "@/features/admin/ui-kit";

type MediaAsset = {
  id: string;
  url: string;
  key: string;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  altText: string;
  folder?: string | null;
  deletedAt?: string | null;
  createdAt: string;
};

type UploadItem = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error" | "canceled";
  error?: string;
  xhr?: XMLHttpRequest;
};

export default function MediaLibrary({ role }: { role: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safePathname = pathname || "/admin/media";

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [mime, setMime] = useState("");
  const [folder, setFolder] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [total, setTotal] = useState(0);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [detailAlt, setDetailAlt] = useState("");
  const [detailFolder, setDetailFolder] = useState("");
  const [detailFileName, setDetailFileName] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);
  const [selectedSet, setSelectedSet] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { confirm } = useConfirm();

  // Init state from URL (once)
  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get("q") || "";
    const t = searchParams.get("type") || "";
    const m = searchParams.get("mime") || "";
    const f = searchParams.get("folder") || "";
    const from = searchParams.get("from") || "";
    const inc = searchParams.get("includeDeleted") === "1";
    const p = Number(searchParams.get("page") || 1);
    const ps = Number(searchParams.get("pageSize") || 24);

    setSearch(q);
    setType(t);
    setMime(m);
    setFolder(f);
    setDateFrom(from);
    setShowDeleted(inc);
    setPage(Number.isFinite(p) && p > 0 ? Math.floor(p) : 1);
    setPageSize(Number.isFinite(ps) && ps > 0 ? Math.min(100, Math.floor(ps)) : 24);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (type) params.set("type", type);
    if (mime) params.set("mime", mime);
    if (folder) params.set("folder", folder);
    if (dateFrom) params.set("from", dateFrom);
    if (showDeleted) params.set("includeDeleted", "1");
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 24) params.set("pageSize", String(pageSize));
    const next = params.toString();
    router.replace(next ? `${safePathname}?${next}` : safePathname);
  }, [search, type, mime, folder, dateFrom, showDeleted, page, pageSize, safePathname, router]);

  // Reset pagination when filters change (not page/pageSize)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, mime, folder, dateFrom, showDeleted]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (type) params.set("type", type);
    if (mime) params.set("mime", mime);
    if (folder) params.set("folder", folder);
    if (dateFrom) params.set("from", dateFrom);
    if (showDeleted) params.set("includeDeleted", "1");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const response = await fetch(`/api/admin/media?${params.toString()}`);
    const data = await response.json().catch(() => null);
    if (!data) {
      setAssets([]);
      setTotal(0);
      setDbOffline(false);
      setLoading(false);
      toast.error("Failed to load media");
      return;
    }
    if (!response.ok && response.status !== 503) {
      setAssets([]);
      setTotal(0);
      setDbOffline(false);
      setLoading(false);
      toast.error("Failed to load media");
      return;
    }
    setAssets(data.items || []);
    setTotal(Number(data.total || 0));
    setDbOffline(Boolean(data.dbOffline));
    setLoading(false);
  }, [search, type, mime, folder, dateFrom, showDeleted, page, pageSize]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => startUpload(file));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const startUpload = async (file: File) => {
    const id = `${file.name}-${Date.now()}`;
    const uploadItem: UploadItem = { id, name: file.name, progress: 0, status: "uploading" };
    setUploads((prev) => [uploadItem, ...prev]);

    try {
      const res = await fetch("/api/admin/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mime: file.type, size: file.size, folder }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : res.status === 403
              ? "Forbidden: missing media:upload permission"
              : res.status === 503
                ? "Storage/database unavailable"
                : "Failed to get upload URL";
        throw new Error(message);
      }

      const { url, key, publicUrl } = await res.json();
      await uploadWithProgress({ id, file, url, key, publicUrl });
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", error: error.message } : item))
      );
    }
  };

  const uploadWithProgress = ({
    id,
    file,
    url,
    key,
  }: {
    id: string;
    file: File;
    url: string;
    key: string;
    publicUrl: string;
  }) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, progress } : item)));
      };

      xhr.onload = async () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            await finalizeUpload({ key, file });
            setUploads((prev) =>
              prev.map((item) => (item.id === id ? { ...item, status: "done", progress: 100 } : item))
            );
            await fetchAssets();
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        } catch (error: any) {
          reject(error);
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.onabort = () => reject(new Error("Upload canceled"));

      xhr.send(file);
      setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, xhr } : item)));
    }).catch((error) => {
      setUploads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", error: error.message } : item))
      );
    });
  };

  const finalizeUpload = async ({ key, file }: { key: string; file: File }) => {
    const altText = file.name.replace(/\.[^/.]+$/, "");
    const mime = file.type || "image/jpeg";
    const response = await fetch("/api/admin/media/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, mime, size: file.size, altText, folder }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || "Failed to process image");
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const handleDelete = async (assetId: string, hard = false) => {
    const ok = await confirm({
      title: hard ? "Permanently delete asset?" : "Delete asset?",
      description: hard
        ? "This will remove the file from storage and cannot be undone."
        : "This will move the asset to deleted. You can restore it later.",
      confirmText: hard ? "Delete permanently" : "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    const response = await fetch(`/api/admin/media/${assetId}${hard ? "?hard=1" : ""}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast.success(hard ? "Deleted permanently" : "Deleted");
      fetchAssets();
    }
  };

  const handleRestore = async (assetId: string) => {
    const response = await fetch(`/api/admin/media/${assetId}/restore`, { method: "POST" });
    if (response.ok) {
      toast.success("Restored");
      fetchAssets();
    }
  };

  const openDetail = (asset: MediaAsset) => {
    setSelectedId(asset.id);
    setSelected(asset);
    setDetailAlt(asset.altText || "");
    setDetailFolder(asset.folder || "");
    setDetailFileName("");
  };

  const saveDetail = async () => {
    if (!selectedId) return;
    setDetailSaving(true);
    const response = await fetch(`/api/admin/media/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        altText: detailAlt,
        folder: detailFolder || null,
        ...(detailFileName.trim() ? { fileName: detailFileName.trim() } : {}),
      }),
    });
    if (response.ok) {
      toast.success("Saved");
      setDetailSaving(false);
      setSelectedId(null);
      setSelected(null);
      setSelectedSet({});
      fetchAssets();
      return;
    }
    setDetailSaving(false);
    toast.error("Failed to save");
  };

  const folders = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((asset) => {
      if (asset.folder) set.add(asset.folder);
    });
    return Array.from(set).sort();
  }, [assets]);

  const selectionCount = useMemo(
    () => Object.values(selectedSet).filter(Boolean).length,
    [selectedSet]
  );

  const formatBytes = (bytes: number) => {
    if (!bytes && bytes !== 0) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const filenameFromKey = (key: string) => key.split("/").pop() || key;

  const bulkDelete = async () => {
    const ids = Object.entries(selectedSet)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) return;
    const ok = await confirm({
      title: "Delete selected assets?",
      description: `This will soft-delete ${ids.length} asset(s).`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await Promise.all(ids.map((id) => fetch(`/api/admin/media/${id}`, { method: "DELETE" })));
    toast.success("Deleted selected");
    setSelectedSet({});
    fetchAssets();
  };

  const bulkRestore = async () => {
    const ids = Object.entries(selectedSet)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) return;
    await Promise.all(ids.map((id) => fetch(`/api/admin/media/${id}/restore`, { method: "POST" })));
    toast.success("Restored selected");
    setSelectedSet({});
    fetchAssets();
  };

  const bulkMove = async (nextFolder: string) => {
    const ids = Object.entries(selectedSet)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) return;
    const ok = await confirm({
      title: "Move selected assets?",
      description: `Move ${ids.length} asset(s) to folder "${nextFolder || "—"}"?`,
      confirmText: "Move",
    });
    if (!ok) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/media/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: nextFolder || null }),
        })
      )
    );
    toast.success("Moved selected");
    setSelectedSet({});
    fetchAssets();
  };

  const selectedForDrawer = selectedId ? assets.find((a) => a.id === selectedId) || selected : null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminContainer>
      <PageHeader
        title="Media Library"
        description="Upload, organize, and reuse assets across the store."
        actions={
          <>
            <Button variant="secondary" onClick={fetchAssets} disabled={loading}>
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload files"
            >
              Upload
            </Button>
          </>
        }
      />

      <DbStatusBanner
        status={dbOffline ? "offline" : "online"}
        message={dbOffline ? "Database is unavailable. You can still upload, but listing may be incomplete." : "Manage uploads, folders and metadata."}
        onRetry={fetchAssets}
        retryDisabled={loading}
      />

      <Card>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <FormField label="Search">
              <Input placeholder="Search filename, alt text, key…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </FormField>
            <FormField label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="MIME (optional)">
              <Select value={mime} onChange={(e) => setMime(e.target.value)}>
                <option value="">All</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
                <option value="image/avif">AVIF</option>
                <option value="video/">Video (any)</option>
              </Select>
            </FormField>
            <FormField label="Folder">
              <Select value={folder} onChange={(e) => setFolder(e.target.value)}>
                <option value="">All</option>
                <option value="uploads">uploads/</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="From date">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </FormField>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
              <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
              Show deleted
            </label>
            <FormField label="Page size">
              <Select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[12, 24, 48, 96].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </FormField>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
                Prev
              </Button>
              <div style={{ fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
                Page <strong>{page}</strong> / {totalPages} • <strong>{total}</strong> total
              </div>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: "2px dashed rgba(0,0,0,0.15)",
              borderRadius: 18,
              padding: 24,
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontWeight: 700 }}>Upload assets</div>
              <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 13 }}>
                Drag & drop files here, or use the upload button. Current folder: <strong>{folder || "uploads/"}</strong>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Choose files
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
              aria-label="File picker"
            />
          </div>

          {uploads.length > 0 ? (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {uploads.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name}
                    </div>
                    <div style={{ marginTop: 6, height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${u.progress}%`, height: "100%", background: "#1b1c1f" }} />
                    </div>
                    {u.status === "error" ? (
                      <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 12 }}>{u.error}</div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {u.status === "uploading" ? (
                      <Button variant="ghost" onClick={() => u.xhr?.abort()}>
                        Cancel
                      </Button>
                    ) : null}
                    {u.status === "done" ? <Badge tone="success">Done</Badge> : null}
                    {u.status === "uploading" ? <Badge tone="warn">{u.progress}%</Badge> : null}
                    {u.status === "error" ? <Badge tone="danger">Error</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} height={220} />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState title="No assets yet" description="Upload some images to see them here." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {assets.map((asset) => {
                const checked = Boolean(selectedSet[asset.id]);
                return (
                  <div
                    key={asset.id}
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 16,
                      background: "#fff",
                      padding: 10,
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setSelectedSet((prev) => ({ ...prev, [asset.id]: e.target.checked }))}
                        aria-label="Select asset"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => openDetail(asset)}
                      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", width: "100%" }}
                      aria-label="Open asset details"
                    >
                      <img
                        src={asset.url}
                        alt={asset.altText}
                        style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 12, background: "rgba(0,0,0,0.03)" }}
                        loading="lazy"
                      />
                    </button>
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {filenameFromKey(asset.key)}
                      </div>
                      <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {asset.folder ? `${asset.folder} • ` : ""}
                        {formatBytes(asset.size)} • {asset.mime}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                        <Badge tone={asset.deletedAt ? "danger" : "neutral"}>{asset.deletedAt ? "Deleted" : "Active"}</Badge>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(asset.id);
                            toast.success("Copied assetId");
                          }}
                        >
                          Copy ID
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(asset.url);
                            toast.success("Copied URL");
                          }}
                        >
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <StickySaveBar
        show={selectionCount > 0}
        left={
          <>
            <strong>{selectionCount}</strong> selected
          </>
        }
        right={
          <>
            <Select
              value=""
              onChange={(e) => {
                const next = e.target.value;
                if (!next) return;
                bulkMove(next === "__clear__" ? "" : next);
                e.currentTarget.value = "";
              }}
              aria-label="Bulk move folder"
            >
              <option value="">Move to folder…</option>
              <option value="__clear__">(No folder)</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            {showDeleted ? (
              <Button variant="secondary" onClick={bulkRestore}>
                Restore
              </Button>
            ) : null}
            <Button variant="danger" onClick={bulkDelete}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setSelectedSet({})}>
              Clear
            </Button>
          </>
        }
      />

      <Drawer
        open={Boolean(selectedId)}
        title={selectedForDrawer ? filenameFromKey(selectedForDrawer.key) : "Asset"}
        onClose={() => {
          setSelectedId(null);
          setSelected(null);
        }}
      >
        {selectedForDrawer ? (
          <>
            <img
              src={selectedForDrawer.url}
              alt={selectedForDrawer.altText}
              style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 14, background: "rgba(0,0,0,0.03)" }}
            />

            <Card>
              <CardBody>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>assetId</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedForDrawer.id}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Uploaded</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{new Date(selectedForDrawer.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Type</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedForDrawer.mime}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Size</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{formatBytes(selectedForDrawer.size)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedForDrawer.url);
                      toast.success("Copied URL");
                    }}
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedForDrawer.id);
                      toast.success("Copied assetId");
                    }}
                  >
                    Copy assetId
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <FormField label="Alt text" required>
                  <Textarea value={detailAlt} onChange={(e) => setDetailAlt(e.target.value)} rows={2} />
                </FormField>
                <div style={{ height: 10 }} />
                <FormField label="Folder">
                  <Input value={detailFolder} onChange={(e) => setDetailFolder(e.target.value)} placeholder="e.g. home/hero" />
                </FormField>
                <div style={{ height: 10 }} />
                <FormField label="Rename file (optional)" helperText="Renames storage key + URL. Asset ID stays the same.">
                  <Input value={detailFileName} onChange={(e) => setDetailFileName(e.target.value)} placeholder="e.g. new-filename" />
                </FormField>
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="primary" onClick={saveDetail} disabled={detailSaving || !detailAlt.trim()}>
                    {detailSaving ? "Saving…" : "Save"}
                  </Button>
                  {!selectedForDrawer.deletedAt ? (
                    <Button variant="danger" onClick={() => handleDelete(selectedForDrawer.id)}>
                      Delete
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => handleRestore(selectedForDrawer.id)}>
                      Restore
                    </Button>
                  )}
                  {role === "ADMIN" && selectedForDrawer.deletedAt ? (
                    <Button variant="danger" onClick={() => handleDelete(selectedForDrawer.id, true)}>
                      Hard delete
                    </Button>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          <EmptyState title="Asset not found" description="Try reloading the list." />
        )}
      </Drawer>
    </AdminContainer>
  );
}
