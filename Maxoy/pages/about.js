import styles from "../styles/about.module.scss";
import React from "react";
import { motion } from "framer-motion";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import PageRenderer from "../components/cms/PageRenderer";
import cmsStyles from "../styles/cmsPage.module.scss";
import { getGlobalSettings, getPageBySlug, getPages } from "../lib/cms/store";

const About = ({ cmsPage, preview, globalSettings }) => {
  const { language } = useStateContext();
  const title = language === "en" ? "About Maxoy" : "Maxoy Hakkında";
  const body =
    language === "en"
      ? "Maxoy is a modern e-commerce demo focused on floral and decorative products. It showcases a complete storefront flow with catalog structure, product discovery, cart experience, and admin management screens in a single end-to-end presentation."
      : "Maxoy, çiçekçilik ve dekorasyon odaklı ürünlerin sergilendiği modern bir e-ticaret demo projesidir. Katalog yapısı, ürün listeleme deneyimi, sepet akışı ve yönetim panelleriyle birlikte uçtan uca bir vitrin altyapısı sunar.";

  if (cmsPage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {preview && <div className={cmsStyles.previewBanner}>Preview Mode</div>}
        <PageRenderer
          sections={cmsPage.sections}
          seo={cmsPage.seo}
          globalSettings={globalSettings?.data}
        />
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className={styles["about-container"]}
    >
      <h3>{title}</h3>
      <p>{body}</p>
    </motion.div>
  );
};

export default About;

export const getServerSideProps = async ({ query, res, locale: routeLocale }) => {
  const locale = routeLocale || query?.locale || "tr";
  const preview = query?.preview === "1" || query?.preview === "true";
  const cmsPage = getPageBySlug(getPages(), "/about", locale, { preview });
  if (!cmsPage) {
    return { props: {} };
  }
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  return {
    props: {
      cmsPage,
      preview,
      globalSettings: getGlobalSettings(),
    },
  };
};
