import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Plants from "../components/catalog/Plants";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import { getGlobalSettings } from "../lib/cms/store";
import { getStorefrontProducts } from "../lib/storefront/products";
import { buildSeoTitle } from "../lib/seo";

const SearchPage = ({ products, globalSettings }) => {
  const { language } = useStateContext();
  const router = useRouter();
  const query = typeof router.query?.q === "string" ? router.query.q : "";
  const brandLabel = globalSettings?.data?.siteName || t(language, "home.brand");
  const pageTitle = query
    ? t(language, "search.titleWithQuery", { query })
    : t(language, "search.title");
  const seoTitle = buildSeoTitle({ title: pageTitle, brand: brandLabel });

  return (
    <>
      <Head>
        {seoTitle && <title>{seoTitle}</title>}
      </Head>
      <Plants products={products} bestsellers={[]} searchPage highlightQuery={query} />
    </>
  );
};

export const getServerSideProps = async ({ locale }) => {
  const products = await getStorefrontProducts();

  return {
    props: {
      products,
      globalSettings: getGlobalSettings(locale || "tr"),
    },
  };
};

export default SearchPage;
