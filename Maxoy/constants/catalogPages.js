export const CATALOG_PAGES = {
  allProducts: {
    slug: "/tum-urunler",
    titleKey: "catalog.allProducts",
    initialMainCategory: "All",
    initialSubcategory: "",
    allowedMainCategories: null,
    allowedSubcategories: null,
  },
  readyProducts: {
    slug: "/hazir-urunler",
    titleKey: "catalog.readyProducts",
    initialMainCategory: "C",
    initialSubcategory: "",
    allowedMainCategories: ["C"],
    allowedSubcategories: null,
  },
  artificialDry: {
    slug: "/cicek-cesitleri",
    titleKey: "catalog.artificialDry",
    initialMainCategory: "All",
    initialSubcategory: "",
    allowedMainCategories: ["A", "B"],
    allowedSubcategories: null,
  },
  packaging: {
    slug: "/toptan-cicek-malzemesi-ambalaj-cesitleri",
    titleKey: "catalog.packaging",
    initialMainCategory: "F",
    initialSubcategory: "",
    allowedMainCategories: ["F"],
    allowedSubcategories: null,
  },
  oasis: {
    slug: "/toptan-cicek-malzemesi-oasis-cesitleri",
    titleKey: "catalog.oasis",
    initialMainCategory: "E",
    initialSubcategory: "E1",
    allowedMainCategories: ["E"],
    allowedSubcategories: ["E1"],
  },
};

export const CATALOG_PAGE_LIST = Object.values(CATALOG_PAGES);
