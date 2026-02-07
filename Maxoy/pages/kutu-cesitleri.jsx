import React from "react";
import CatalogCollectionPage from "../components/catalog/CatalogCollectionPage";
import { getCatalogPageStaticProps } from "../lib/storefront/catalog-pages";

const fallbackConfig = {
  path: "/kutu-cesitleri",
  titleTR: "Kutu Çeşitleri",
  titleEN: "Box Types",
  initialMainCategory: "F",
  initialSubcategory: "F4",
  allowedMainCategories: ["F"],
  allowedSubcategories: ["F4"],
};

const BoxesPage = ({ catalogPage, ...props }) => (
  <CatalogCollectionPage {...props} config={catalogPage || fallbackConfig} />
);

export const getStaticProps = async ({ locale }) => getCatalogPageStaticProps("/kutu-cesitleri", locale);

export default BoxesPage;
