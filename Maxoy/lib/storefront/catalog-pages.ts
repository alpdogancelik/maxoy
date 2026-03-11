import { prisma } from "@/lib/db";
import { getStorefrontProducts, toListingProduct } from "@/lib/storefront/products";
import { getStorefrontCategories } from "@/lib/storefront/categories";
import { getStorefrontSettings } from "@/lib/storefront/settings";
import { CATALOG_PAGE_LIST } from "@/constants/catalogPages";
import { withStorefrontDbTimeout } from "./db-utils";

export type StoreCatalogPage = {
  id?: string;
  key: string;
  path: string;
  status?: string;
  publishedAt?: string | null;
  sortOrder?: number;
  navVisible?: boolean;
  titleTR: string;
  titleEN: string;
  seoTitleTR?: string | null;
  seoTitleEN?: string | null;
  seoDescTR?: string | null;
  seoDescEN?: string | null;
  initialMainCategory?: string | null;
  initialSubcategory?: string | null;
  allowedMainCategories?: string[];
  allowedSubcategories?: string[];
  sidebarItems?: Array<{ labelTR: string; labelEN?: string | null; category?: string | null }> | null;
};

function fallbackByPath(path: string): Partial<StoreCatalogPage> | null {
  const match = CATALOG_PAGE_LIST.find((p: any) => p.slug === path);
  if (!match) return null;
  return {
    key: match.slug,
    path: match.slug,
    titleTR: match.titleTR || match.titleKey,
    titleEN: match.titleEN || match.titleKey,
    initialMainCategory: match.initialMainCategory || null,
    initialSubcategory: match.initialSubcategory || null,
    allowedMainCategories: match.allowedMainCategories || [],
    allowedSubcategories: match.allowedSubcategories || [],
  };
}

export async function getCatalogPageByPath(path: string): Promise<StoreCatalogPage | null> {
  const found = await withStorefrontDbTimeout(
    prisma.catalogPage.findUnique({ where: { path } }),
    () => null
  );
  if (found) {
    return {
      id: found.id,
      key: (found as any).key,
      path: (found as any).path,
      status: (found as any).status,
      publishedAt: (found as any).publishedAt ? new Date((found as any).publishedAt).toISOString() : null,
      sortOrder: (found as any).sortOrder ?? 0,
      navVisible: Boolean((found as any).navVisible),
      titleTR: (found as any).titleTR,
      titleEN: (found as any).titleEN,
      seoTitleTR: (found as any).seoTitleTR ?? null,
      seoTitleEN: (found as any).seoTitleEN ?? null,
      seoDescTR: (found as any).seoDescTR ?? null,
      seoDescEN: (found as any).seoDescEN ?? null,
      initialMainCategory: (found as any).initialMainCategory ?? null,
      initialSubcategory: (found as any).initialSubcategory ?? null,
      allowedMainCategories: (found as any).allowedMainCategories || [],
      allowedSubcategories: (found as any).allowedSubcategories || [],
      sidebarItems: (found as any).sidebarItems ?? null,
    };
  }

  const fb = fallbackByPath(path);
  const fb2 = fb
    ? fb
    : (() => {
        return null;
      })();
  if (!fb2) {
    try {
      const { MOCK_CATALOG_PAGES } = await import("@/lib/mock-data");
      const fromMock = (MOCK_CATALOG_PAGES || []).find((p: any) => p.path === path);
      if (fromMock) {
        return {
          key: String((fromMock as any).key),
          path: String((fromMock as any).path),
          titleTR: String((fromMock as any).titleTR),
          titleEN: String((fromMock as any).titleEN),
          seoTitleTR: null,
          seoTitleEN: null,
          seoDescTR: null,
          seoDescEN: null,
          initialMainCategory: (fromMock as any).initialMainCategory || null,
          initialSubcategory: (fromMock as any).initialSubcategory || null,
          allowedMainCategories: (fromMock as any).allowedMainCategories || [],
          allowedSubcategories: (fromMock as any).allowedSubcategories || [],
          navVisible: Boolean((fromMock as any).navVisible),
          sidebarItems: (fromMock as any).sidebarItems || null,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }
  return {
    key: String((fb2 as any).key),
    path: String((fb2 as any).path),
    titleTR: String((fb2 as any).titleTR),
    titleEN: String((fb2 as any).titleEN),
    seoTitleTR: null,
    seoTitleEN: null,
    seoDescTR: null,
    seoDescEN: null,
    initialMainCategory: (fb2 as any).initialMainCategory || null,
    initialSubcategory: (fb2 as any).initialSubcategory || null,
    allowedMainCategories: (fb2 as any).allowedMainCategories || [],
    allowedSubcategories: (fb2 as any).allowedSubcategories || [],
    navVisible: Boolean((fb2 as any).navVisible),
    sidebarItems: (fb2 as any).sidebarItems || null,
  };
}

export async function getNavbarCatalogPages(): Promise<StoreCatalogPage[]> {
  return withStorefrontDbTimeout(
    prisma.catalogPage.findMany({
      where: { status: "PUBLISHED", navVisible: true },
      orderBy: { sortOrder: "asc" },
    }).then((items) =>
      items.map((p: any) => ({
        id: p.id,
        key: p.key,
        path: p.path,
        status: p.status,
        publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
        sortOrder: p.sortOrder ?? 0,
        navVisible: Boolean(p.navVisible),
        titleTR: p.titleTR,
        titleEN: p.titleEN,
        seoTitleTR: p.seoTitleTR ?? null,
        seoTitleEN: p.seoTitleEN ?? null,
        seoDescTR: p.seoDescTR ?? null,
        seoDescEN: p.seoDescEN ?? null,
        initialMainCategory: p.initialMainCategory ?? null,
        initialSubcategory: p.initialSubcategory ?? null,
        allowedMainCategories: p.allowedMainCategories || [],
        allowedSubcategories: p.allowedSubcategories || [],
        sidebarItems: p.sidebarItems ?? null,
      }))
    ),
    async () => {
      try {
        const { MOCK_CATALOG_PAGES } = await import("@/lib/mock-data");
        return (MOCK_CATALOG_PAGES || [])
          .filter((p: any) => p.status === "PUBLISHED" && p.navVisible)
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((p: any) => ({
            key: p.key,
            path: p.path,
            status: p.status,
            publishedAt: p.publishedAt || null,
            sortOrder: p.sortOrder ?? 0,
            navVisible: Boolean(p.navVisible),
            titleTR: p.titleTR,
            titleEN: p.titleEN,
            seoTitleTR: null,
            seoTitleEN: null,
            seoDescTR: null,
            seoDescEN: null,
            initialMainCategory: p.initialMainCategory || null,
            initialSubcategory: p.initialSubcategory || null,
            allowedMainCategories: p.allowedMainCategories || [],
            allowedSubcategories: p.allowedSubcategories || [],
            sidebarItems: p.sidebarItems || null,
          }));
      } catch {
        return [];
      }
    }
  );
}

export async function getCatalogPageStaticProps(path: string, locale?: string) {
  const catalogPage = await getCatalogPageByPath(path);

  const productsAll = await getStorefrontProducts();
  const categories = await getStorefrontCategories();

  const allowedSubs = Array.isArray(catalogPage?.allowedSubcategories)
    ? catalogPage?.allowedSubcategories
    : [];
  const categorySlugSet = new Set(categories.map((c) => String(c.slug).toLowerCase()));
  const allowedSlugSet = allowedSubs
    .map((v) => String(v || "").toLowerCase())
    .filter((v) => categorySlugSet.has(v));

  const filtered =
    allowedSlugSet.length > 0
      ? productsAll.filter((p: any) => allowedSlugSet.includes(String(p.categorySlug || "").toLowerCase()))
      : productsAll;

  const settings = await getStorefrontSettings().catch(() => null);
  const globalSettings = {
    id: "global",
    data: {
      siteName: settings?.brand?.siteName || "Maxoy",
      siteUrl: "",
    },
  };

  return {
    props: {
      products: filtered.map((product) => toListingProduct(product)),
      categories,
      catalogPage: catalogPage || null,
      globalSettings,
      locale: locale || "tr",
    },
    revalidate: 60,
  };
}
