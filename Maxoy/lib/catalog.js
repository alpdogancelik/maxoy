import fs from "fs";
import path from "path";
import { enrichProducts, groupVariants } from "./productTransforms";
import { getGlobalSettings } from "./cms/store";

export const loadProducts = () => {
  const productsPath = path.join(process.cwd(), "data", "products.json");
  if (!fs.existsSync(productsPath)) return [];
  try {
    const data = fs.readFileSync(productsPath, "utf-8");
    const jsonProducts = JSON.parse(data);
    const enriched = enrichProducts(jsonProducts);
    return groupVariants(enriched);
  } catch (error) {
    return [];
  }
};

export const filterProductsByCategory = (
  products = [],
  { allowedMainCategories, allowedSubcategories } = {}
) => {
  const mainSet = Array.isArray(allowedMainCategories) && allowedMainCategories.length
    ? new Set(allowedMainCategories.map((code) => String(code).toUpperCase()))
    : null;
  const subSet = Array.isArray(allowedSubcategories) && allowedSubcategories.length
    ? new Set(allowedSubcategories.map((code) => String(code).toUpperCase()))
    : null;

  if (!mainSet && !subSet) return products;

  return products.filter((product) => {
    const mainCode = String(product.mainCode || "").toUpperCase();
    const subCode = String(product.category || "").toUpperCase();
    if (mainSet && (!mainCode || !mainSet.has(mainCode))) return false;
    if (subSet && (!subCode || !subSet.has(subCode))) return false;
    return true;
  });
};

export const getCatalogStaticProps = (config, locale) => {
  const products = filterProductsByCategory(loadProducts(), config);
  return {
    props: {
      products,
      globalSettings: getGlobalSettings(locale || "tr"),
    },
    revalidate: 60,
  };
};
