import { prisma } from "@/lib/db";
import { withStorefrontDbTimeout } from "./db-utils";

export type StoreHomeAnnouncement = {
  id: string;
  messageTR: string;
  messageEN: string;
  sortOrder: number;
  isActive: boolean;
};

export type StoreHeroSlide = {
  id: string;
  titleTR: string;
  titleEN: string;
  subtitleTR?: string | null;
  subtitleEN?: string | null;
  ctaTextTR?: string | null;
  ctaTextEN?: string | null;
  ctaLink?: string | null;
  imageAssetId: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type StoreCategoryCard = {
  id: string;
  titleTR: string;
  titleEN: string;
  descriptionTR?: string | null;
  descriptionEN?: string | null;
  link?: string | null;
  themeColor?: string | null;
  imageAssetId: string;
  imageUrl: string | null;
  sortOrder: number;
};

export type StoreTrustBadge = {
  id: string;
  icon: string;
  textTR: string;
  textEN: string;
  sortOrder: number;
};

export type StoreFeaturedRef = {
  id: string;
  productId: string;
  sortOrder: number;
};

export type StoreHome = {
  id: string;
  status: "DRAFT" | "PUBLISHED" | string;
  publishedAt: string | null;
  announcements: StoreHomeAnnouncement[];
  heroSlides: StoreHeroSlide[];
  categoryCards: StoreCategoryCard[];
  featuredProducts: StoreFeaturedRef[];
  trustBadges: StoreTrustBadge[];
};

async function resolveAssetUrl(assetId: string): Promise<string | null> {
  return withStorefrontDbTimeout(
    prisma.mediaAsset.findUnique({ where: { id: assetId } }).then((asset) => asset?.url || null),
    () => null
  );
}

export async function getStoreHome(options?: { preview?: boolean }): Promise<StoreHome | null> {
  const preview = Boolean(options?.preview);
  const home = await withStorefrontDbTimeout(
    prisma.homePage.findFirst({
      include: {
        announcements: true,
        heroSlides: true,
        categoryCards: true,
        featured: true,
        trustBadges: true,
      },
    }),
    () => null
  );

  if (!home) return null;
  if (!preview && home.status !== "PUBLISHED") return null;

  const announcements = [...(home.announcements || [])]
    .filter((a: any) => a?.isActive !== false)
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const heroSlidesBase = [...(home.heroSlides || [])]
    .filter((s: any) => s?.isActive !== false)
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const categoryCardsBase = [...(home.categoryCards || [])].sort(
    (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  const featuredProducts = [...(home.featured || [])].sort(
    (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  const trustBadges = [...(home.trustBadges || [])].sort(
    (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  const heroSlides: StoreHeroSlide[] = await Promise.all(
    heroSlidesBase.map(async (s: any) => ({
      id: String(s.id),
      titleTR: String(s.titleTR || ""),
      titleEN: String(s.titleEN || ""),
      subtitleTR: s.subtitleTR ?? null,
      subtitleEN: s.subtitleEN ?? null,
      ctaTextTR: s.ctaTextTR ?? null,
      ctaTextEN: s.ctaTextEN ?? null,
      ctaLink: s.ctaLink ?? null,
      imageAssetId: String(s.imageAssetId),
      imageUrl: await resolveAssetUrl(String(s.imageAssetId)).catch(() => null),
      sortOrder: Number(s.sortOrder ?? 0),
      isActive: Boolean(s.isActive ?? true),
    }))
  );

  const categoryCards: StoreCategoryCard[] = await Promise.all(
    categoryCardsBase.map(async (c: any) => ({
      id: String(c.id),
      titleTR: String(c.titleTR || ""),
      titleEN: String(c.titleEN || ""),
      descriptionTR: c.descriptionTR ?? null,
      descriptionEN: c.descriptionEN ?? null,
      link: c.link ?? null,
      themeColor: c.themeColor ?? null,
      imageAssetId: String(c.imageAssetId),
      imageUrl: await resolveAssetUrl(String(c.imageAssetId)).catch(() => null),
      sortOrder: Number(c.sortOrder ?? 0),
    }))
  );

  return {
    id: String((home as any).id),
    status: String((home as any).status),
    publishedAt: (home as any).publishedAt ? new Date((home as any).publishedAt).toISOString() : null,
    announcements: announcements.map((a: any) => ({
      id: String(a.id),
      messageTR: String(a.messageTR || ""),
      messageEN: String(a.messageEN || ""),
      sortOrder: Number(a.sortOrder ?? 0),
      isActive: Boolean(a.isActive ?? true),
    })),
    heroSlides,
    categoryCards,
    featuredProducts: featuredProducts.map((f: any) => ({
      id: String(f.id),
      productId: String(f.productId),
      sortOrder: Number(f.sortOrder ?? 0),
    })),
    trustBadges: trustBadges.map((t: any) => ({
      id: String(t.id),
      icon: String(t.icon || ""),
      textTR: String(t.textTR || ""),
      textEN: String(t.textEN || ""),
      sortOrder: Number(t.sortOrder ?? 0),
    })),
  };
}
