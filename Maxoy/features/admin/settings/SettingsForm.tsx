"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import MediaPickerModal from "@/features/admin/media/MediaPickerModal";
import {
  AdminContainer,
  Button,
  Card,
  CardBody,
  Drawer,
  FormField,
  Input,
  PageHeader,
  StickySaveBar,
  Textarea,
  useUnsavedChanges,
} from "@/features/admin/ui-kit";

type SettingsData = {
  brand: { siteName?: string; logoAssetId?: string | null; faviconAssetId?: string | null };
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string };
  shipping: { freeShippingThreshold?: number; estimatedDaysTextTR?: string; estimatedDaysTextEN?: string };
  social: { instagram?: string; facebook?: string; tiktok?: string };
  legal: { companyName?: string; taxOffice?: string; taxNo?: string };
};

export default function SettingsForm() {
  const [data, setData] = useState<SettingsData>({
    brand: {},
    contact: {},
    shipping: {},
    social: {},
    legal: {},
  });
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jsonOpen, setJsonOpen] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [faviconPickerOpen, setFaviconPickerOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    if (!res.ok) {
      setLoading(false);
      toast.error("Failed to load settings");
      return;
    }
    const payload = await res.json();
    const next = (payload.data || {}) as SettingsData;
    setData(next);
    setInitialJson(JSON.stringify(next));
    setErrors({});
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (section: keyof SettingsData, key: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  const validate = (d: SettingsData) => {
    const next: Record<string, string> = {};
    const email = d.contact?.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next["contact.email"] = "Enter a valid email address";

    const phone = d.contact?.phone?.trim();
    if (phone && phone.replace(/\D/g, "").length < 10) next["contact.phone"] = "Enter a valid phone number";

    const whatsapp = d.contact?.whatsapp?.trim();
    if (whatsapp && whatsapp.replace(/\D/g, "").length < 10) next["contact.whatsapp"] = "Enter a valid WhatsApp number";

    const urlFields: Array<[string, string | undefined]> = [
      ["social.instagram", d.social?.instagram],
      ["social.facebook", d.social?.facebook],
      ["social.tiktok", d.social?.tiktok],
    ];
    urlFields.forEach(([path, value]) => {
      const v = value?.trim();
      if (!v) return;
      try {
        // allow full URL only for these fields
        new URL(v);
      } catch {
        next[path] = "Enter a valid URL (include https://)";
      }
    });

    const t = d.shipping?.freeShippingThreshold;
    if (t !== undefined && (Number.isNaN(t) || t < 0)) next["shipping.freeShippingThreshold"] = "Must be a non-negative number";

    return next;
  };

  const dirty = useMemo(() => {
    if (!initialJson) return false;
    return JSON.stringify(data) !== initialJson;
  }, [data, initialJson]);

  useUnsavedChanges(dirty, "You have unsaved Settings changes. Leave this page?");

  const save = async () => {
    const nextErrors = validate(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Fix validation errors");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error ? "Save failed (invalid data)" : "Save failed");
      setSaving(false);
      return;
    }
    const payload = await res.json();
    setData(payload.data || data);
    setInitialJson(JSON.stringify(payload.data || data));
    setSaving(false);
    toast.success("Settings saved");
  };

  const fetchAssetUrl = async (assetId: string | null | undefined, setter: (url: string | null) => void) => {
    if (!assetId) {
      setter(null);
      return;
    }
    const res = await fetch(`/api/admin/media/${assetId}`);
    if (!res.ok) {
      setter(null);
      return;
    }
    const asset = await res.json();
    setter(asset?.url || null);
  };

  useEffect(() => {
    fetchAssetUrl(data.brand?.logoAssetId || null, setLogoUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.brand?.logoAssetId]);

  useEffect(() => {
    fetchAssetUrl(data.brand?.faviconAssetId || null, setFaviconUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.brand?.faviconAssetId]);

  const reset = () => {
    if (!initialJson) return;
    const parsed = JSON.parse(initialJson);
    setData(parsed);
    setErrors({});
    toast.success("Reset to last saved");
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Settings"
        description="Brand, contact, shipping, social links, and legal info."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading || saving}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => setJsonOpen(true)} disabled={loading}>
              View JSON
            </Button>
          </>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <CardBody>
            <details open>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Brand</summary>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <FormField label="Site name">
                  <Input value={data.brand?.siteName || ""} onChange={(e) => updateField("brand", "siteName", e.target.value)} />
                </FormField>

                <Card>
                  <CardBody>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Logo</div>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" style={{ width: "100%", maxHeight: 140, objectFit: "contain", background: "rgba(0,0,0,0.03)", borderRadius: 12 }} />
                    ) : (
                      <div style={{ padding: 18, borderRadius: 12, background: "rgba(0,0,0,0.03)", color: "rgba(17,24,39,0.6)", fontSize: 13 }}>
                        No logo selected
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button variant="secondary" onClick={() => setLogoPickerOpen(true)}>
                        {data.brand?.logoAssetId ? "Change" : "Select"}
                      </Button>
                      {data.brand?.logoAssetId ? (
                        <Button variant="ghost" onClick={() => updateField("brand", "logoAssetId", null)}>
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 8, color: "rgba(17,24,39,0.6)", fontSize: 12 }}>
                      assetId: {data.brand?.logoAssetId || "—"}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Favicon</div>
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="Favicon preview" style={{ width: "100%", maxHeight: 140, objectFit: "contain", background: "rgba(0,0,0,0.03)", borderRadius: 12 }} />
                    ) : (
                      <div style={{ padding: 18, borderRadius: 12, background: "rgba(0,0,0,0.03)", color: "rgba(17,24,39,0.6)", fontSize: 13 }}>
                        No favicon selected
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button variant="secondary" onClick={() => setFaviconPickerOpen(true)}>
                        {data.brand?.faviconAssetId ? "Change" : "Select"}
                      </Button>
                      {data.brand?.faviconAssetId ? (
                        <Button variant="ghost" onClick={() => updateField("brand", "faviconAssetId", null)}>
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 8, color: "rgba(17,24,39,0.6)", fontSize: 12 }}>
                      assetId: {data.brand?.faviconAssetId || "—"}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </details>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Contact</summary>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <FormField label="Phone" error={errors["contact.phone"]}>
                  <Input value={data.contact?.phone || ""} onChange={(e) => updateField("contact", "phone", e.target.value)} placeholder="+90…" />
                </FormField>
                <FormField label="WhatsApp" error={errors["contact.whatsapp"]}>
                  <Input value={data.contact?.whatsapp || ""} onChange={(e) => updateField("contact", "whatsapp", e.target.value)} placeholder="+90…" />
                </FormField>
                <FormField label="Email" error={errors["contact.email"]}>
                  <Input value={data.contact?.email || ""} onChange={(e) => updateField("contact", "email", e.target.value)} placeholder="shop@example.com" />
                </FormField>
                <FormField label="Address">
                  <Textarea value={data.contact?.address || ""} onChange={(e) => updateField("contact", "address", e.target.value)} rows={3} />
                </FormField>
              </div>
            </details>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Shipping</summary>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <FormField label="Free shipping threshold (₺)" error={errors["shipping.freeShippingThreshold"]}>
                  <Input
                    type="number"
                    value={data.shipping?.freeShippingThreshold ?? ""}
                    onChange={(e) =>
                      updateField("shipping", "freeShippingThreshold", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    min={0}
                    step="0.01"
                  />
                </FormField>
                <FormField label="Estimated days text (TR)">
                  <Input value={data.shipping?.estimatedDaysTextTR || ""} onChange={(e) => updateField("shipping", "estimatedDaysTextTR", e.target.value)} />
                </FormField>
                <FormField label="Estimated days text (EN)">
                  <Input value={data.shipping?.estimatedDaysTextEN || ""} onChange={(e) => updateField("shipping", "estimatedDaysTextEN", e.target.value)} />
                </FormField>
              </div>
            </details>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Social</summary>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <FormField label="Instagram URL" error={errors["social.instagram"]}>
                  <Input value={data.social?.instagram || ""} onChange={(e) => updateField("social", "instagram", e.target.value)} placeholder="https://instagram.com/…" />
                </FormField>
                <FormField label="Facebook URL" error={errors["social.facebook"]}>
                  <Input value={data.social?.facebook || ""} onChange={(e) => updateField("social", "facebook", e.target.value)} placeholder="https://facebook.com/…" />
                </FormField>
                <FormField label="TikTok URL" error={errors["social.tiktok"]}>
                  <Input value={data.social?.tiktok || ""} onChange={(e) => updateField("social", "tiktok", e.target.value)} placeholder="https://tiktok.com/@…" />
                </FormField>
              </div>
            </details>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Legal</summary>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <FormField label="Company name">
                  <Input value={data.legal?.companyName || ""} onChange={(e) => updateField("legal", "companyName", e.target.value)} />
                </FormField>
                <FormField label="Tax office">
                  <Input value={data.legal?.taxOffice || ""} onChange={(e) => updateField("legal", "taxOffice", e.target.value)} />
                </FormField>
                <FormField label="Tax number">
                  <Input value={data.legal?.taxNo || ""} onChange={(e) => updateField("legal", "taxNo", e.target.value)} />
                </FormField>
              </div>
            </details>
          </CardBody>
        </Card>
      </div>

      <StickySaveBar
        show={dirty}
        left="You have unsaved changes"
        right={
          <>
            <Button variant="secondary" onClick={reset} disabled={saving}>
              Reset
            </Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />

      <Drawer open={jsonOpen} title="Settings JSON" onClose={() => setJsonOpen(false)}>
        <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", margin: 0 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Drawer>

      <MediaPickerModal
        open={logoPickerOpen}
        title="Select logo"
        onClose={() => setLogoPickerOpen(false)}
        onSelect={({ assetId }) => updateField("brand", "logoAssetId", assetId)}
      />
      <MediaPickerModal
        open={faviconPickerOpen}
        title="Select favicon"
        onClose={() => setFaviconPickerOpen(false)}
        onSelect={({ assetId }) => updateField("brand", "faviconAssetId", assetId)}
      />
    </AdminContainer>
  );
}
