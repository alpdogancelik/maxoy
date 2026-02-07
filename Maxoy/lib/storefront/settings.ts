import { prisma } from "@/lib/db";

export type StorefrontSettings = {
  brand: { siteName: string; logoUrl: string | null; faviconUrl: string | null };
  contact: { phone: string; whatsapp: string; email: string; address: string };
  shipping: { freeShippingThreshold?: number; estimatedDaysTextTR?: string; estimatedDaysTextEN?: string };
  social: { instagram?: string; facebook?: string; tiktok?: string };
  legal: { companyName?: string; taxOffice?: string; taxNo?: string };
};

async function resolveAssetUrl(assetId: string | null | undefined): Promise<string | null> {
  if (!assetId) return null;
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  return asset?.url || null;
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  let settings: any = null;
  try {
    settings = await prisma.settings.findFirst();
  } catch {
    settings = null;
  }
  const data = (settings?.data || {}) as any;

  const logoUrl = await resolveAssetUrl(data?.brand?.logoAssetId).catch(() => null);
  const faviconUrl = await resolveAssetUrl(data?.brand?.faviconAssetId).catch(() => null);

  return {
    brand: {
      siteName: String(data?.brand?.siteName || "Maxoy"),
      logoUrl,
      faviconUrl,
    },
    contact: {
      phone: String(data?.contact?.phone || ""),
      whatsapp: String(data?.contact?.whatsapp || ""),
      email: String(data?.contact?.email || ""),
      address: String(data?.contact?.address || ""),
    },
    shipping: {
      freeShippingThreshold: data?.shipping?.freeShippingThreshold,
      estimatedDaysTextTR: data?.shipping?.estimatedDaysTextTR || "",
      estimatedDaysTextEN: data?.shipping?.estimatedDaysTextEN || "",
    },
    social: {
      instagram: data?.social?.instagram || "",
      facebook: data?.social?.facebook || "",
      tiktok: data?.social?.tiktok || "",
    },
    legal: {
      companyName: data?.legal?.companyName || "",
      taxOffice: data?.legal?.taxOffice || "",
      taxNo: data?.legal?.taxNo || "",
    },
  };
}
