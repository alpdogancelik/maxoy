import React from "react";
import CatalogCollectionPage from "../components/catalog/CatalogCollectionPage";
import { getCatalogPageStaticProps } from "../lib/storefront/catalog-pages";

const fallbackConfig = {
  path: "/kurdele-cesitleri",
  titleTR: "Kurdele Çeşitleri",
  titleEN: "Ribbon Types",
  initialMainCategory: "G",
  initialSubcategory: "",
  allowedMainCategories: ["G"],
  allowedSubcategories: [],
};

const RibbonsPage = ({ catalogPage, ...props }) => (
  <CatalogCollectionPage {...props} config={catalogPage || fallbackConfig} />
);

export const getStaticProps = async ({ locale }) => getCatalogPageStaticProps("/kurdele-cesitleri", locale);

export default RibbonsPage;
