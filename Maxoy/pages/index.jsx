import React from "react";
import Hero from "../components/home/Hero";
import FeaturedBrands from "../components/home/FeaturedBrands";
import Plants from "../components/catalog/Plants";
import HomeMaxoy from "../components/home/HomeMaxoy";
import PageRenderer from "../components/cms/PageRenderer";
import cmsStyles from "../styles/cmsPage.module.scss";
import { getGlobalSettings, getPageBySlug, getPages } from "../lib/cms/store";
import { getStorefrontProducts } from "../lib/storefront/products";
import { getStoreHome } from "../lib/storefront/home";

const HomePage = ({ cmsPage, preview, globalSettings, products, stats, home, featuredProducts }) => {
    if (cmsPage) {
        return (
            <div>
                {preview && <div className={cmsStyles.previewBanner}>Preview Mode</div>}
                <PageRenderer
                    sections={cmsPage.sections}
                    seo={cmsPage.seo}
                    globalSettings={globalSettings?.data}
                />
            </div>
        );
    }

    if (home) {
        return (
            <div>
                <HomeMaxoy home={home} featuredProducts={featuredProducts || []} />
            </div>
        );
    }

    return (
        <div>
            <Hero stats={stats} />
            <FeaturedBrands stats={stats} />
            <Plants products={products} pageTitle="" />
        </div>
    );
};

export default HomePage;

export const getStaticProps = async ({ query }) => {
    const preview = query?.preview === "1" || query?.preview === "true";

    // Optional CMS-driven home page (slug "/")
    const cmsPage = getPageBySlug(getPages(), "/", "tr", { preview });
    const globalSettings = getGlobalSettings();

    const home = (await getStoreHome({ preview })) || (await getStoreHome({ preview: true }));

    const products = await getStorefrontProducts();
    const inStock = products.filter((p) => Number(p.stock || 0) > 0).length;
    const mainCodes = new Set(
        products
            .map((p) => String(p.mainCode || "").trim().toUpperCase())
            .filter(Boolean)
    );

    const stats = {
        products: products.length,
        inStock,
        categories: mainCodes.size,
    };

    const byKey = new Map();
    products.forEach((p) => {
        const keys = [
            p?.id,
            p?._id,
            p?.code,
            p?.sku,
            p?.slug?.current,
            p?.slug,
        ].filter(Boolean);
        keys.forEach((k) => {
            if (!byKey.has(String(k))) byKey.set(String(k), p);
        });
    });

    const featuredProducts = (home?.featuredProducts || [])
        .map((ref) => byKey.get(String(ref.productId)))
        .filter(Boolean);

    return {
        props: {
            cmsPage: cmsPage || null,
            preview,
            globalSettings,
            products: products.slice(0, 48),
            stats,
            home: home || null,
            featuredProducts,
        },
        revalidate: 60,
    };
};

