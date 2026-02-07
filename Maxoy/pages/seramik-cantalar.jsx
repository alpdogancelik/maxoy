import React from "react";
import CatalogCollectionPage from "../components/catalog/CatalogCollectionPage";
import { getCatalogPageStaticProps } from "../lib/storefront/catalog-pages";

const fallbackConfig = {
  path: "/seramik-cantalar",
  titleTR: "Seramik & Çantalar",
  titleEN: "Ceramics & Bags",
  initialMainCategory: "All",
  initialSubcategory: "",
  allowedMainCategories: ["D", "F", "H"],
  allowedSubcategories: ["D2", "F3", "H1"],
};

const CeramicBagsPage = ({ catalogPage, ...props }) => (
  <CatalogCollectionPage {...props} config={catalogPage || fallbackConfig} />
);

export const getStaticProps = async ({ locale }) => getCatalogPageStaticProps("/seramik-cantalar", locale);

export default CeramicBagsPage;
