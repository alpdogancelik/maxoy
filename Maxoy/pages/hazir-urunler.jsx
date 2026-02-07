import React from "react";
import CatalogCollectionPage from "../components/catalog/CatalogCollectionPage";
import { CATALOG_PAGES } from "../constants/catalogPages";
import { getCatalogPageStaticProps } from "../lib/storefront/catalog-pages";

const pageConfig = CATALOG_PAGES.readyProducts;

const ReadyProductsPage = ({ catalogPage, ...props }) => (
  <CatalogCollectionPage {...props} config={catalogPage || pageConfig} />
);

export const getStaticProps = async ({ locale }) => getCatalogPageStaticProps(pageConfig.slug, locale);

export default ReadyProductsPage;
