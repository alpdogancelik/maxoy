"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  FormField,
  Input,
  Select,
} from "@/features/admin/ui-kit";
import styles from "./media-picker.module.scss";

type MediaAsset = {
  id: string;
  url: string;
  key: string;
  mime: string;
  size: number;
  altText: string;
  folder?: string | null;
  createdAt: string;
  deletedAt?: string | null;
};

export default function MediaPickerModal({
  open,
  title = "Select media",
  initialFolder,
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  initialFolder?: string;
  onClose: () => void;
  onSelect: (asset: { assetId: string; url: string }) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [mime, setMime] = useState("");
  const [folder, setFolder] = useState(initialFolder || "");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (mime) params.set("mime", mime);
    if (folder) params.set("folder", folder);
    const res = await fetch(`/api/admin/media?${params.toString()}`);
    if (!res.ok) {
      setLoading(false);
      toast.error("Failed to load media");
      return;
    }
    const data = await res.json();
    setAssets(data.items || []);
    setLoading(false);
  }, [q, mime, folder]);

  useEffect(() => {
    if (!open) return;
    fetchAssets();
  }, [open, fetchAssets]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => fetchAssets(), 250);
    return () => window.clearTimeout(t);
  }, [q, mime, folder, open, fetchAssets]);

  const folders = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.folder && set.add(a.folder));
    return Array.from(set).sort();
  }, [assets]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <Button variant="ghost" onClick={onClose} aria-label="Close media picker">
            Close
          </Button>
        </div>

        <div className={styles.body}>
          <Card>
            <CardBody>
              <div className={styles.filters}>
                <FormField label="Search">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filename / alt / key" />
                </FormField>
                <FormField label="Type">
                  <Select value={mime} onChange={(e) => setMime(e.target.value)}>
                    <option value="">All</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WEBP</option>
                    <option value="image/avif">AVIF</option>
                  </Select>
                </FormField>
                <FormField label="Folder">
                  <Select value={folder} onChange={(e) => setFolder(e.target.value)}>
                    <option value="">All</option>
                    {folders.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </CardBody>
          </Card>

          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={styles.skel} />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState title="No media found" description="Try changing your search or filters." />
              </CardBody>
            </Card>
          ) : (
            <div className={styles.grid}>
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={styles.asset}
                  onClick={() => {
                    onSelect({ assetId: a.id, url: a.url });
                    onClose();
                  }}
                >
                  <img src={a.url} alt={a.altText} loading="lazy" />
                  <div className={styles.assetMeta}>
                    <div className={styles.assetAlt}>{a.altText}</div>
                    <div className={styles.assetSub}>{a.folder ? `${a.folder} • ` : ""}{a.id.slice(-6)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

