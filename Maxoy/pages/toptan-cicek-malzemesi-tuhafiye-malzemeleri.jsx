import React from "react";
import CatalogCollectionPage from "../components/catalog/CatalogCollectionPage";
import { getCatalogPageStaticProps } from "../lib/storefront/catalog-pages";

const fallbackConfig = {
  path: "/toptan-cicek-malzemesi-tuhafiye-malzemeleri",
  titleTR: "Malzeme Çeşitleri",
  titleEN: "Supplies",
  initialMainCategory: "E",
  initialSubcategory: "",
  allowedMainCategories: ["E"],
  allowedSubcategories: [],
};

const SuppliesPage = ({ catalogPage, ...props }) => (
  <CatalogCollectionPage {...props} config={catalogPage || fallbackConfig} />
);

export const getStaticProps = async ({ locale }) =>
  getCatalogPageStaticProps("/toptan-cicek-malzemesi-tuhafiye-malzemeleri", locale);

export default SuppliesPage;
