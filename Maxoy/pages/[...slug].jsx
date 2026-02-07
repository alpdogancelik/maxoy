import React from "react";
import PageRenderer from "../components/cms/PageRenderer";
import styles from "../styles/cmsPage.module.scss";
import { getGlobalSettings, getPageBySlug, getPages } from "../lib/cms/store";

const CmsPage = ({ page, preview, globalSettings }) => {
  if (!page) return null;
  return (
    <div>
      {preview && <div className={styles.previewBanner}>Preview Mode</div>}
      <PageRenderer
        sections={page.sections}
        seo={page.seo}
        globalSettings={globalSettings?.data}
      />
    </div>
  );
};

export const getServerSideProps = async ({ params, query, res, locale: routeLocale }) => {
  const slug = `/${(params?.slug || []).join("/")}`;
  const locale = routeLocale || query?.locale || "tr";
  const preview = query?.preview === "1" || query?.preview === "true";
  const pages = getPages();
  const page = getPageBySlug(pages, slug, locale, { preview });

  if (!page) {
    return { notFound: true };
  }

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  const globalSettings = getGlobalSettings();

  return {
    props: {
      page,
      preview,
      globalSettings,
    },
  };
};

export default CmsPage;
