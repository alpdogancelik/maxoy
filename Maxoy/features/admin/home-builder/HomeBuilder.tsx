"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import MediaPickerModal from "@/features/admin/media/MediaPickerModal";
import styles from "./home-builder.module.scss";
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
  StickySaveBar,
  Textarea,
  useConfirm,
  useUnsavedChanges,
} from "@/features/admin/ui-kit";

type Announcement = { id?: string; messageTR: string; messageEN: string; sortOrder?: number; isActive?: boolean };
type HeroSlide = {
  id?: string;
  titleTR: string;
  titleEN: string;
  subtitleTR?: string | null;
  subtitleEN?: string | null;
  ctaTextTR?: string | null;
  ctaTextEN?: string | null;
  ctaLink?: string | null;
  imageAssetId: string;
  sortOrder?: number;
  isActive?: boolean;
};
type CategoryCard = {
  id?: string;
  titleTR: string;
  titleEN: string;
  descriptionTR?: string | null;
  descriptionEN?: string | null;
  link?: string | null;
  themeColor?: string | null;
  imageAssetId: string;
  sortOrder?: number;
};
type FeaturedProduct = { id?: string; productId: string; sortOrder?: number };
type TrustBadge = { id?: string; icon: string; textTR: string; textEN: string; sortOrder?: number };

type HomeConfig = {
  announcements: Announcement[];
  heroSlides: HeroSlide[];
  categoryCards: CategoryCard[];
  featuredProducts: FeaturedProduct[];
  trustBadges: TrustBadge[];
};

const emptyState: HomeConfig = {
  announcements: [],
  heroSlides: [],
  categoryCards: [],
  featuredProducts: [],
  trustBadges: [],
};

export default function HomeBuilder() {
  const { confirm } = useConfirm();
  const [config, setConfig] = useState<HomeConfig>(emptyState);
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<string>("DRAFT");
  const [dbOffline, setDbOffline] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [picker, setPicker] = useState<{ open: boolean; section: "hero" | "category"; index: number } | null>(null);
  const [assetCache, setAssetCache] = useState<Record<string, string>>({});
  const dragRef = useRef<{ section: keyof HomeConfig; from: number } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/home");
    if (!res.ok) {
      setLoading(false);
      toast.error("Failed to load home config");
      return;
    }
    const data = await res.json();
    const next: HomeConfig = {
      announcements: data.announcements || [],
      heroSlides: data.heroSlides || [],
      categoryCards: data.categoryCards || [],
      featuredProducts: data.featuredProducts || [],
      trustBadges: data.trustBadges || [],
    };
    setConfig(next);
    setInitialJson(JSON.stringify(next));
    setPublishedAt(data.publishedAt || null);
    setPageStatus(data.status || "DRAFT");
    setDbOffline(Boolean(data.dbOffline));
    setErrors({});
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!initialJson) return false;
    return JSON.stringify(config) !== initialJson;
  }, [config, initialJson]);

  useUnsavedChanges(dirty, "You have unsaved Home Builder changes. Leave this page?");

  const normalizeOrder = useCallback(<K extends keyof HomeConfig>(section: K, list: HomeConfig[K]) => {
    return list.map((item: any, i: number) => ({ ...item, sortOrder: i })) as any;
  }, []);

  const updateSection = <K extends keyof HomeConfig>(section: K, index: number, patch: Partial<HomeConfig[K][number]>) => {
    setConfig((prev) => {
      const next = { ...prev };
      const list = next[section].slice();
      list[index] = { ...(list[index] as any), ...(patch as any) };
      next[section] = list as any;
      return next;
    });
  };

  const addItem = <K extends keyof HomeConfig>(section: K, item: HomeConfig[K][number]) => {
    setConfig((prev) => {
      const next = { ...prev };
      next[section] = normalizeOrder(section, [...prev[section], item] as any);
      return next;
    });
  };

  const removeItem = async <K extends keyof HomeConfig>(section: K, index: number) => {
    const ok = await confirm({
      title: "Remove item?",
      description: "This will remove the item from the draft configuration.",
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setConfig((prev) => {
      const next = { ...prev };
      const list = prev[section].filter((_, i) => i !== index) as any;
      next[section] = normalizeOrder(section, list);
      return next;
    });
  };

  const moveItem = <K extends keyof HomeConfig>(section: K, from: number, to: number) => {
    setConfig((prev) => {
      const next = { ...prev };
      const list = prev[section].slice() as any[];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      next[section] = normalizeOrder(section, list as any);
      return next;
    });
  };

  const validate = (cfg: HomeConfig) => {
    const next: Record<string, string> = {};

    cfg.announcements.forEach((a, i) => {
      if (!a.messageTR?.trim()) next[`announcements.${i}.messageTR`] = "Message TR is required";
      if (!a.messageEN?.trim()) next[`announcements.${i}.messageEN`] = "Message EN is required";
    });

    cfg.heroSlides.forEach((s, i) => {
      if (!s.titleTR?.trim()) next[`heroSlides.${i}.titleTR`] = "Title TR is required";
      if (!s.titleEN?.trim()) next[`heroSlides.${i}.titleEN`] = "Title EN is required";
      if (!s.imageAssetId?.trim()) next[`heroSlides.${i}.imageAssetId`] = "Image is required";
      const link = s.ctaLink?.trim();
      if (link && !link.startsWith("/")) next[`heroSlides.${i}.ctaLink`] = "CTA link must start with /";
    });

    cfg.categoryCards.forEach((c, i) => {
      if (!c.titleTR?.trim()) next[`categoryCards.${i}.titleTR`] = "Title TR is required";
      if (!c.titleEN?.trim()) next[`categoryCards.${i}.titleEN`] = "Title EN is required";
      if (!c.imageAssetId?.trim()) next[`categoryCards.${i}.imageAssetId`] = "Image is required";
      const link = c.link?.trim();
      if (link && !link.startsWith("/")) next[`categoryCards.${i}.link`] = "Link must start with /";
    });

    cfg.featuredProducts.forEach((p, i) => {
      if (!p.productId?.trim()) next[`featuredProducts.${i}.productId`] = "Product ID is required";
    });

    cfg.trustBadges.forEach((b, i) => {
      if (!b.icon?.trim()) next[`trustBadges.${i}.icon`] = "Icon is required";
      if (!b.textTR?.trim()) next[`trustBadges.${i}.textTR`] = "Text TR is required";
      if (!b.textEN?.trim()) next[`trustBadges.${i}.textEN`] = "Text EN is required";
    });

    return next;
  };

  const save = async () => {
    const nextErrors = validate(config);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Fix validation errors");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      toast.error("Save failed");
      setSaving(false);
      return;
    }
    setInitialJson(JSON.stringify(config));
    setPageStatus("DRAFT");
    toast.success("Draft saved");
    setSaving(false);
  };

  const publish = async () => {
    const nextErrors = validate(config);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Fix validation errors before publishing");
      return;
    }

    const ok = await confirm({
      title: "Publish home page?",
      description: "This will make the current configuration live.",
      confirmText: "Publish",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    setPublishing(true);
    const saveRes = await fetch("/api/admin/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!saveRes.ok) {
      toast.error("Publish failed (save draft failed)");
      setPublishing(false);
      return;
    }

    const res = await fetch("/api/admin/home/publish", { method: "POST" });
    if (!res.ok) {
      toast.error("Publish failed");
      setPublishing(false);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setPublishedAt(data.publishedAt || new Date().toISOString());
    setPageStatus("PUBLISHED");
    setInitialJson(JSON.stringify(config));
    toast.success("Published");
    setPublishing(false);
  };

  const resolveAssetUrl = useCallback(
    async (assetId: string) => {
      if (!assetId || assetCache[assetId]) return;
      const res = await fetch(`/api/admin/media/${assetId}`);
      if (!res.ok) return;
      const asset = await res.json();
      if (asset?.url) {
        setAssetCache((prev) => ({ ...prev, [assetId]: asset.url }));
      }
    },
    [assetCache]
  );

  useEffect(() => {
    config.heroSlides.forEach((s) => s.imageAssetId && resolveAssetUrl(s.imageAssetId));
    config.categoryCards.forEach((c) => c.imageAssetId && resolveAssetUrl(c.imageAssetId));
  }, [config.heroSlides, config.categoryCards, resolveAssetUrl]);

  const reset = () => {
    if (!initialJson) return;
    setConfig(JSON.parse(initialJson));
    setErrors({});
    toast.success("Reset to last saved");
  };

  const firstHero = useMemo(() => {
    const list = [...config.heroSlides].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return list.find((s) => s.isActive !== false) || list[0];
  }, [config.heroSlides]);

  const previewCards = useMemo(() => {
    return [...config.categoryCards].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).slice(0, 4);
  }, [config.categoryCards]);

  const onDragStart = (section: keyof HomeConfig, from: number) => (e: React.DragEvent) => {
    dragRef.current = { section, from };
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (section: keyof HomeConfig, to: number) => () => {
    const d = dragRef.current;
    if (!d || d.section !== section) return;
    if (d.from === to) return;
    moveItem(section as any, d.from, to);
    dragRef.current = null;
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const renderItemCard = (
    section: keyof HomeConfig,
    index: number,
    title: string,
    subtitle: string | undefined,
    body: JSX.Element,
    extraActions?: JSX.Element
  ) => {
    const item: any = (config as any)[section][index];
    const isActive = item?.isActive ?? true;

    return (
      <div className={styles.itemCard} onDragOver={onDragOver} onDrop={onDrop(section, index)}>
        <div className={styles.itemHeader}>
          <div className={styles.dragHandle} draggable onDragStart={onDragStart(section, index)} aria-label="Drag handle" title="Drag to reorder">
            ⋮⋮
          </div>
          <div className={styles.itemTitle}>
            <div className={styles.itemTitleMain}>{title}</div>
            {subtitle ? <div className={styles.itemTitleSub}>{subtitle}</div> : null}
          </div>
          <div className={styles.itemActions}>
            {"isActive" in item ? (
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => updateSection(section as any, index, { isActive: e.target.checked } as any)}
                />
                Active
              </label>
            ) : null}
            {extraActions ? extraActions : null}
            <Button variant="danger" onClick={() => removeItem(section as any, index)}>
              Remove
            </Button>
          </div>
        </div>
        <div className={styles.itemBody}>
          <details open>
            <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Edit fields</summary>
            {body}
          </details>
        </div>
      </div>
    );
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Home Builder"
        description="Edit home page sections with cards, reordering, and preview."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading || saving || publishing}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => window.open("/", "_blank")}>
              Preview site
            </Button>
            <Button variant="primary" onClick={save} disabled={loading || saving || publishing}>
              {saving ? "Saving…" : "Save draft"}
            </Button>
            <Button variant="danger" onClick={publish} disabled={loading || saving || publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </>
        }
      />

      {dbOffline ? (
        <Card>
          <CardBody>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="warn">DB offline</Badge>
              <div style={{ color: "rgba(17,24,39,0.75)", fontSize: 13 }}>
                You can edit the draft UI, but save/publish may not persist without a database.
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <CardBody>
            <EmptyState title="Loading…" description="Fetching home configuration." />
          </CardBody>
        </Card>
      ) : (
        <div className={styles.layout}>
          <div className={styles.sections}>
            <Card>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>Announcements</div>
                    <div className={styles.muted}>Top-bar messages (TR/EN)</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      addItem("announcements", { messageTR: "", messageEN: "", isActive: true, sortOrder: config.announcements.length })
                    }
                  >
                    Add
                  </Button>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {config.announcements.length === 0 ? (
                    <EmptyState title="No announcements" description="Add one to show a top-bar message." />
                  ) : (
                    config.announcements.map((item, index) =>
                      renderItemCard(
                        "announcements",
                        index,
                        item.messageTR || "Announcement",
                        item.isActive === false ? "Inactive" : "Active",
                        <div className={styles.grid2}>
                          <FormField label="Message TR" required error={errors[`announcements.${index}.messageTR`]}>
                            <Input value={item.messageTR || ""} onChange={(e) => updateSection("announcements", index, { messageTR: e.target.value })} />
                          </FormField>
                          <FormField label="Message EN" required error={errors[`announcements.${index}.messageEN`]}>
                            <Input value={item.messageEN || ""} onChange={(e) => updateSection("announcements", index, { messageEN: e.target.value })} />
                          </FormField>
                        </div>,
                        <Badge tone={item.isActive === false ? "danger" : "success"}>{item.isActive === false ? "Off" : "On"}</Badge>
                      )
                    )
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>Hero Slides</div>
                    <div className={styles.muted}>Main homepage carousel</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      addItem("heroSlides", {
                        titleTR: "",
                        titleEN: "",
                        subtitleTR: "",
                        subtitleEN: "",
                        ctaTextTR: "",
                        ctaTextEN: "",
                        ctaLink: "",
                        imageAssetId: "",
                        isActive: true,
                        sortOrder: config.heroSlides.length,
                      })
                    }
                  >
                    Add
                  </Button>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {config.heroSlides.length === 0 ? (
                    <EmptyState title="No hero slides" description="Add a slide to populate the hero area." />
                  ) : (
                    config.heroSlides.map((item, index) =>
                      renderItemCard(
                        "heroSlides",
                        index,
                        item.titleTR || "Hero slide",
                        item.imageAssetId ? `Image: ${item.imageAssetId.slice(-6)}` : "No image",
                        <>
                          <div className={styles.grid2}>
                            <FormField label="Title TR" required error={errors[`heroSlides.${index}.titleTR`]}>
                              <Input value={item.titleTR || ""} onChange={(e) => updateSection("heroSlides", index, { titleTR: e.target.value })} />
                            </FormField>
                            <FormField label="Title EN" required error={errors[`heroSlides.${index}.titleEN`]}>
                              <Input value={item.titleEN || ""} onChange={(e) => updateSection("heroSlides", index, { titleEN: e.target.value })} />
                            </FormField>
                            <FormField label="Subtitle TR">
                              <Input value={item.subtitleTR || ""} onChange={(e) => updateSection("heroSlides", index, { subtitleTR: e.target.value })} />
                            </FormField>
                            <FormField label="Subtitle EN">
                              <Input value={item.subtitleEN || ""} onChange={(e) => updateSection("heroSlides", index, { subtitleEN: e.target.value })} />
                            </FormField>
                            <FormField label="CTA text TR">
                              <Input value={item.ctaTextTR || ""} onChange={(e) => updateSection("heroSlides", index, { ctaTextTR: e.target.value })} />
                            </FormField>
                            <FormField label="CTA text EN">
                              <Input value={item.ctaTextEN || ""} onChange={(e) => updateSection("heroSlides", index, { ctaTextEN: e.target.value })} />
                            </FormField>
                            <FormField label="CTA link" helperText="Must start with /" error={errors[`heroSlides.${index}.ctaLink`]}>
                              <Input value={item.ctaLink || ""} onChange={(e) => updateSection("heroSlides", index, { ctaLink: e.target.value })} placeholder="/tum-urunler" />
                            </FormField>
                          </div>

                          <div style={{ height: 12 }} />

                          <div className={styles.imageRow}>
                            {item.imageAssetId && assetCache[item.imageAssetId] ? (
                              <img className={styles.thumb} src={assetCache[item.imageAssetId]} alt="Hero preview" />
                            ) : (
                              <div className={styles.thumbPlaceholder}>No image</div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <FormField label="Image asset" required error={errors[`heroSlides.${index}.imageAssetId`]}>
                                <Input
                                  value={item.imageAssetId || ""}
                                  onChange={(e) => updateSection("heroSlides", index, { imageAssetId: e.target.value })}
                                  placeholder="assetId"
                                />
                              </FormField>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Button variant="secondary" onClick={() => setPicker({ open: true, section: "hero", index })}>
                                  Pick image
                                </Button>
                                {item.imageAssetId ? (
                                  <Button variant="ghost" onClick={() => updateSection("heroSlides", index, { imageAssetId: "" })}>
                                    Clear
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    )
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>Category Cards</div>
                    <div className={styles.muted}>Homepage category/promotional tiles</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      addItem("categoryCards", {
                        titleTR: "",
                        titleEN: "",
                        descriptionTR: "",
                        descriptionEN: "",
                        link: "",
                        themeColor: "",
                        imageAssetId: "",
                        sortOrder: config.categoryCards.length,
                      })
                    }
                  >
                    Add
                  </Button>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {config.categoryCards.length === 0 ? (
                    <EmptyState title="No category cards" description="Add a card to show a tile on the home page." />
                  ) : (
                    config.categoryCards.map((item, index) =>
                      renderItemCard(
                        "categoryCards",
                        index,
                        item.titleTR || "Category card",
                        item.link || "No link",
                        <>
                          <div className={styles.grid2}>
                            <FormField label="Title TR" required error={errors[`categoryCards.${index}.titleTR`]}>
                              <Input value={item.titleTR || ""} onChange={(e) => updateSection("categoryCards", index, { titleTR: e.target.value })} />
                            </FormField>
                            <FormField label="Title EN" required error={errors[`categoryCards.${index}.titleEN`]}>
                              <Input value={item.titleEN || ""} onChange={(e) => updateSection("categoryCards", index, { titleEN: e.target.value })} />
                            </FormField>
                            <FormField label="Description TR">
                              <Textarea value={item.descriptionTR || ""} onChange={(e) => updateSection("categoryCards", index, { descriptionTR: e.target.value })} rows={2} />
                            </FormField>
                            <FormField label="Description EN">
                              <Textarea value={item.descriptionEN || ""} onChange={(e) => updateSection("categoryCards", index, { descriptionEN: e.target.value })} rows={2} />
                            </FormField>
                            <FormField label="Link" helperText="Must start with /" error={errors[`categoryCards.${index}.link`]}>
                              <Input value={item.link || ""} onChange={(e) => updateSection("categoryCards", index, { link: e.target.value })} placeholder="/category/yapay-cicek" />
                            </FormField>
                            <FormField label="Theme color (optional)">
                              <Input value={item.themeColor || ""} onChange={(e) => updateSection("categoryCards", index, { themeColor: e.target.value })} placeholder="#22c55e" />
                            </FormField>
                          </div>

                          <div style={{ height: 12 }} />

                          <div className={styles.imageRow}>
                            {item.imageAssetId && assetCache[item.imageAssetId] ? (
                              <img className={styles.thumb} src={assetCache[item.imageAssetId]} alt="Card preview" />
                            ) : (
                              <div className={styles.thumbPlaceholder}>No image</div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <FormField label="Image asset" required error={errors[`categoryCards.${index}.imageAssetId`]}>
                                <Input
                                  value={item.imageAssetId || ""}
                                  onChange={(e) => updateSection("categoryCards", index, { imageAssetId: e.target.value })}
                                  placeholder="assetId"
                                />
                              </FormField>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Button variant="secondary" onClick={() => setPicker({ open: true, section: "category", index })}>
                                  Pick image
                                </Button>
                                {item.imageAssetId ? (
                                  <Button variant="ghost" onClick={() => updateSection("categoryCards", index, { imageAssetId: "" })}>
                                    Clear
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    )
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>Featured Products</div>
                    <div className={styles.muted}>Product IDs pinned to home</div>
                  </div>
                  <Button variant="secondary" onClick={() => addItem("featuredProducts", { productId: "", sortOrder: config.featuredProducts.length })}>
                    Add
                  </Button>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {config.featuredProducts.length === 0 ? (
                    <EmptyState title="No featured products" description="Add a productId to feature it on the home page." />
                  ) : (
                    config.featuredProducts.map((item, index) =>
                      renderItemCard(
                        "featuredProducts",
                        index,
                        item.productId ? `Product ${item.productId.slice(-6)}` : "Featured product",
                        "Reorder to control display order",
                        <div className={styles.grid2}>
                          <FormField label="Product ID" required error={errors[`featuredProducts.${index}.productId`]}>
                            <Input value={item.productId || ""} onChange={(e) => updateSection("featuredProducts", index, { productId: e.target.value })} />
                          </FormField>
                        </div>
                      )
                    )
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>Trust Badges</div>
                    <div className={styles.muted}>Small icon + text badges</div>
                  </div>
                  <Button variant="secondary" onClick={() => addItem("trustBadges", { icon: "", textTR: "", textEN: "", sortOrder: config.trustBadges.length })}>
                    Add
                  </Button>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {config.trustBadges.length === 0 ? (
                    <EmptyState title="No trust badges" description="Add badges to show benefits (shipping, security, etc)." />
                  ) : (
                    config.trustBadges.map((item, index) =>
                      renderItemCard(
                        "trustBadges",
                        index,
                        item.textTR || "Trust badge",
                        item.icon || "—",
                        <div className={styles.grid2}>
                          <FormField label="Icon" required error={errors[`trustBadges.${index}.icon`]} helperText="Emoji or short text icon">
                            <Input value={item.icon || ""} onChange={(e) => updateSection("trustBadges", index, { icon: e.target.value })} placeholder="🔒" />
                          </FormField>
                          <FormField label="Text TR" required error={errors[`trustBadges.${index}.textTR`]}>
                            <Input value={item.textTR || ""} onChange={(e) => updateSection("trustBadges", index, { textTR: e.target.value })} />
                          </FormField>
                          <FormField label="Text EN" required error={errors[`trustBadges.${index}.textEN`]}>
                            <Input value={item.textEN || ""} onChange={(e) => updateSection("trustBadges", index, { textEN: e.target.value })} />
                          </FormField>
                        </div>
                      )
                    )
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className={styles.preview}>
            <div className={styles.previewCard}>
              <div className={styles.previewTitle}>Live Preview (draft)</div>
              <div className={styles.previewHero}>
                <div style={{ fontWeight: 900, fontSize: 14 }}>{firstHero?.titleTR || "Hero title"}</div>
                <div className={styles.muted}>{firstHero?.subtitleTR || "Hero subtitle"}</div>
                <div className={styles.muted}>
                  CTA: <strong>{firstHero?.ctaTextTR || "—"}</strong> {firstHero?.ctaLink ? `(${firstHero.ctaLink})` : ""}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Category cards</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {previewCards.length ? (
                    previewCards.map((c, i) => (
                      <div key={i} style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: 12 }}>{c.titleTR || "Card title"}</div>
                        <div className={styles.muted} style={{ marginTop: 2 }}>
                          {c.link || "—"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.muted}>No cards</div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 12 }} className={styles.muted}>
                This preview is lightweight (admin-side) and reflects your current form state.
              </div>
            </div>
          </div>
        </div>
      )}

      <StickySaveBar
        show={dirty}
        left={
          <>
            You have unsaved changes. Status: <strong>{pageStatus}</strong>{" "}
            {publishedAt ? (
              <span style={{ marginLeft: 8, color: "rgba(17,24,39,0.6)", fontSize: 12 }}>
                Last published: {new Date(publishedAt).toLocaleString()}
              </span>
            ) : null}
          </>
        }
        right={
          <>
            <Button variant="secondary" onClick={reset} disabled={saving || publishing}>
              Reset
            </Button>
            <Button variant="primary" onClick={save} disabled={saving || publishing}>
              {saving ? "Saving…" : "Save draft"}
            </Button>
            <Button variant="danger" onClick={publish} disabled={saving || publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </>
        }
      />

      <MediaPickerModal
        open={Boolean(picker?.open)}
        title="Select image"
        onClose={() => setPicker(null)}
        onSelect={({ assetId, url }) => {
          if (!picker) return;
          if (picker.section === "hero") {
            updateSection("heroSlides", picker.index, { imageAssetId: assetId });
          } else {
            updateSection("categoryCards", picker.index, { imageAssetId: assetId });
          }
          setAssetCache((prev) => ({ ...prev, [assetId]: url }));
          setPicker(null);
        }}
      />
    </AdminContainer>
  );
}

