import React from "react";
import Head from "next/head";
import MaxoyCatalogPage from "./MaxoyCatalogPage";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";
import {
  buildBreadcrumbSchema,
  buildSeoDescription,
  buildSeoTitle,
  getSiteUrl,
  toAbsoluteUrl,
} from "@/lib/seo";

const CatalogCollectionPage = ({ products, categories, config, globalSettings }) => {
  const { language } = useStateContext();
  const brandLabel = globalSettings?.data?.siteName || t(language, "home.brand");
  const pageTitle =
    config?.titleTR && config?.titleEN
      ? language === "en"
        ? config.titleEN
        : config.titleTR
      : t(language, config.titleKey);
  const siteUrl = getSiteUrl(globalSettings);
  const canonicalUrl = toAbsoluteUrl(siteUrl, config.path || config.slug);
  const seoTitleRaw =
    config?.seoTitleTR && config?.seoTitleEN
      ? language === "en"
        ? config.seoTitleEN
        : config.seoTitleTR
      : null;
  const seoDescRaw =
    config?.seoDescTR && config?.seoDescEN
      ? language === "en"
        ? config.seoDescEN
        : config.seoDescTR
      : null;
  const seoTitle = buildSeoTitle({ title: seoTitleRaw || pageTitle, brand: brandLabel });
  const seoDescription = buildSeoDescription({
    description:
      seoDescRaw ||
      t(language, "seo.categoryDescription", { category: pageTitle, brand: brandLabel }),
    fallback: t(language, "misc.metaDescription"),
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (products || []).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url:
          toAbsoluteUrl(siteUrl, `/product/${product.slug?.current || product.code}`) ||
          `/product/${product.slug?.current || product.code}`,
      })),
    },
  };

  const breadcrumbSchema = buildBreadcrumbSchema({
    baseUrl: siteUrl,
    items: [
      { name: t(language, "nav.home"), href: "/" },
      { name: pageTitle, href: config.slug },
    ],
  });

  return (
    <>
      <Head>
        {seoTitle && <title>{seoTitle}</title>}
        {seoDescription && <meta name="description" content={seoDescription} />}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        {breadcrumbSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          />
        )}
      </Head>
      <MaxoyCatalogPage products={products} categories={categories} config={config} globalSettings={globalSettings} />
    </>
  );
};

export default CatalogCollectionPage;
