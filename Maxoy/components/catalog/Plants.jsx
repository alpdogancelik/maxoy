import React, { useMemo, useState, useEffect } from "react";
import styles from "./Plants.module.scss";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { MAIN_CATEGORIES, SUBCATEGORIES, getMainCategoryTitleByLang, getSubcategoryTitleByLang } from "@/constants/categories";
import { FILTER_GROUPS, CATEGORY_FILTER_PRESETS } from "@/constants/filters";
import BestSellerCard from "@/components/card/BestSellerCard";
import CardPlantList from "@/components/card/CardPlantList";
import EmptyState from "@/components/feedback/EmptyState";
import { t } from "@/constants/i18n";
import { useStateContext } from "@/context/StateContext";
import { buildSearchText, getLocalizedArrayField, getLocalizedField, getPriceForMode, normalizeArray } from "@/lib/productUtils";
import { getQueryValue, parseBool, parseList, normalizeQuery } from "@/lib/queryUtils";
import { analytics } from "@/lib/analytics";

const DEFAULT_FILTERS = {
  colorTone: [],
  sizeMeasure: [],
  material: [],
  usage: [],
  brand: [],
  packageContents: [],
  tags: [],
  inStock: false,
  outOfStock: false,
  isNew: false,
  isDiscounted: false,
};

const SORT_VALUES = new Set(["price-asc", "price-desc", "newest", "popularity"]);

const Plants = ({
  products = [],
  bestsellers = [],
  initialMainCategory = "All",
  initialSubcategory = "",
  searchPage = false,
  highlightQuery = "",
  pageTitle = "",
  allowedMainCategories = null,
  allowedSubcategories = null,
}) => {
  const router = useRouter();
  const { language, pricingMode } = useStateContext();
  const [activeMain, setActiveMain] = useState(initialMainCategory || "All");
  const [activeSub, setActiveSub] = useState(initialSubcategory || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [urlSearchQuery, setUrlSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(DEFAULT_FILTERS);
  const [copySuccess, setCopySuccess] = useState(false);
  const allowedMainSet = useMemo(() => {
    if (!Array.isArray(allowedMainCategories) || allowedMainCategories.length === 0) {
      return null;
    }
    return new Set(allowedMainCategories.map((code) => String(code).toUpperCase()));
  }, [allowedMainCategories]);
  const allowedSubSet = useMemo(() => {
    if (!Array.isArray(allowedSubcategories) || allowedSubcategories.length === 0) {
      return null;
    }
    return new Set(allowedSubcategories.map((code) => String(code).toUpperCase()));
  }, [allowedSubcategories]);

  useEffect(() => {
    if (!router.isReady) return;
    const query = router.query || {};
    const queryCategory = getQueryValue(query.category);
    const querySub = getQueryValue(query.subcategory);
    const querySearch = getQueryValue(query.q);
    const querySort = getQueryValue(query.sort);

    const normalizeMain = (value) => {
      if (!value || value === "All") return "All";
      const code = String(value).trim().charAt(0).toUpperCase();
      if (allowedMainSet && !allowedMainSet.has(code)) return "All";
      return code;
    };

    const normalizeSub = (value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return "";
      const code = trimmed.toUpperCase();
      if (allowedSubSet && !allowedSubSet.has(code)) return "";
      const main = code.charAt(0);
      if (allowedMainSet && !allowedMainSet.has(main)) return "";
      return code;
    };

    let nextMain = normalizeMain(initialMainCategory || "All");
    let nextSub = normalizeSub(initialSubcategory || "");

    if (typeof queryCategory === "string" && queryCategory) {
      if (queryCategory.length > 1) {
        const normalized = normalizeSub(queryCategory);
        if (normalized) {
          nextSub = normalized;
          nextMain = normalized.charAt(0);
        }
      } else {
        nextMain = normalizeMain(queryCategory);
        if (nextMain === "All") {
          nextSub = "";
        }
      }
    }

    if (typeof querySub === "string" && querySub) {
      const normalized = normalizeSub(querySub);
      if (normalized) {
        nextSub = normalized;
        nextMain = normalized.charAt(0);
      }
    }

    setActiveMain(nextMain || "All");
    setActiveSub(nextSub || "");
    setSearchQuery(typeof querySearch === "string" ? querySearch : "");
    setUrlSearchQuery(typeof querySearch === "string" ? querySearch : "");
    setSortBy(SORT_VALUES.has(querySort) ? querySort : "newest");
    setSelectedFilters({
      ...DEFAULT_FILTERS,
      colorTone: parseList(query.colorTone),
      sizeMeasure: parseList(query.sizeMeasure),
      material: parseList(query.material),
      usage: parseList(query.usage),
      brand: parseList(query.brand),
      packageContents: parseList(query.packageContents),
      tags: parseList(query.tags),
      inStock: parseBool(query.inStock),
      outOfStock: parseBool(query.outOfStock),
      isNew: parseBool(query.isNew),
      isDiscounted: parseBool(query.isDiscounted),
    });
  }, [
    router.isReady,
    router.query,
    initialMainCategory,
    initialSubcategory,
    allowedMainSet,
    allowedSubSet,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUrlSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!router.isReady) return;
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 250);
    return () => clearTimeout(timer);
  }, [router.isReady, activeMain, activeSub, searchQuery, selectedFilters, sortBy]);

  useEffect(() => {
    if (!copySuccess) return;
    const timer = setTimeout(() => setCopySuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [copySuccess]);

  useEffect(() => {
    if (activeMain === "All") {
      setOpenGroups(FILTER_GROUPS.map((group) => group.key));
      return;
    }
    const defaults = CATEGORY_FILTER_PRESETS[activeMain] || FILTER_GROUPS.map((group) => group.key);
    setOpenGroups(defaults);
  }, [activeMain]);

  useEffect(() => {
    if (!router.isReady) return;
    const nextQuery = {};
    if (router.query.code) nextQuery.code = router.query.code;

	    if (activeMain && activeMain !== "All") nextQuery.category = activeMain;
	    if (activeSub) nextQuery.subcategory = activeSub;
	    if (urlSearchQuery.trim()) nextQuery.q = urlSearchQuery.trim();

    if (selectedFilters.colorTone.length) nextQuery.colorTone = selectedFilters.colorTone.join(",");
    if (selectedFilters.sizeMeasure.length) nextQuery.sizeMeasure = selectedFilters.sizeMeasure.join(",");
    if (selectedFilters.material.length) nextQuery.material = selectedFilters.material.join(",");
    if (selectedFilters.usage.length) nextQuery.usage = selectedFilters.usage.join(",");
    if (selectedFilters.brand.length) nextQuery.brand = selectedFilters.brand.join(",");
    if (selectedFilters.packageContents.length) nextQuery.packageContents = selectedFilters.packageContents.join(",");
    if (selectedFilters.tags.length) nextQuery.tags = selectedFilters.tags.join(",");
    if (selectedFilters.inStock) nextQuery.inStock = "1";
    if (selectedFilters.outOfStock) nextQuery.outOfStock = "1";
    if (selectedFilters.isNew) nextQuery.isNew = "1";
    if (selectedFilters.isDiscounted) nextQuery.isDiscounted = "1";
    if (sortBy && sortBy !== "newest") nextQuery.sort = sortBy;

	    if (normalizeQuery(router.query) !== normalizeQuery(nextQuery)) {
	      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true, scroll: false });
	    }
	  }, [
	    router,
	    activeMain,
	    activeSub,
	    urlSearchQuery,
	    selectedFilters,
	    sortBy,
	  ]);

  const categoryOptions = useMemo(() => {
    const visibleCategories = allowedMainSet
      ? MAIN_CATEGORIES.filter((c) => allowedMainSet.has(c.code))
      : MAIN_CATEGORIES;
    return [
      { value: "All", label: `${t(language, "filters.mainCategory")}: ${t(language, "filters.all")}` },
      ...visibleCategories.map((c) => ({
        value: c.code,
        label: `${c.code} - ${getMainCategoryTitleByLang(c.code, language)}`,
      })),
    ];
  }, [language, allowedMainSet]);

  const subcategoryOptions = useMemo(
    () =>
      SUBCATEGORIES.filter((sub) => {
        if (allowedMainSet && !allowedMainSet.has(sub.main)) return false;
        if (allowedSubSet && !allowedSubSet.has(sub.code)) return false;
        if (activeMain === "All") return true;
        return sub.main === activeMain;
      }),
    [activeMain, allowedMainSet, allowedSubSet]
  );

  const facetSource = useMemo(() => {
    return products.filter((product) => {
      const mainCode = String(product.mainCode || "").toUpperCase();
      const subCode = String(product.category || "").toUpperCase();
      if (allowedMainSet && (!mainCode || !allowedMainSet.has(mainCode))) return false;
      if (allowedSubSet && (!subCode || !allowedSubSet.has(subCode))) return false;
      if (activeMain !== "All" && product.mainCode && product.mainCode !== activeMain) return false;
      if (activeSub && product.category !== activeSub) return false;
      return true;
    });
  }, [products, activeMain, activeSub, allowedMainSet, allowedSubSet]);

  const facetOptions = useMemo(() => {
    const buildSet = () => new Set();
    const options = {
      colorTone: buildSet(),
      sizeMeasure: buildSet(),
      material: buildSet(),
      usage: buildSet(),
      brand: buildSet(),
      packageContents: buildSet(),
      tags: buildSet(),
    };

    facetSource.forEach((product) => {
      normalizeArray(getLocalizedField(product, "colorTone", language)).forEach((val) => val && options.colorTone.add(val));
      normalizeArray(getLocalizedField(product, "sizeInfo", language)).forEach((val) => val && options.sizeMeasure.add(val));
      getLocalizedArrayField(product, "material", language).forEach((val) => val && options.material.add(val));
      getLocalizedArrayField(product, "usage", language).forEach((val) => val && options.usage.add(val));
      normalizeArray(product.brand).forEach((val) => val && options.brand.add(val));
      getLocalizedArrayField(product, "packageContents", language).forEach((val) => val && options.packageContents.add(val));
      getLocalizedArrayField(product, "tags", language).forEach((val) => val && options.tags.add(val));
    });

    return Object.fromEntries(
      Object.entries(options).map(([key, set]) => [key, Array.from(set).sort()])
    );
  }, [facetSource, language]);

  const toggleFilterValue = (key, value) => {
    setSelectedFilters((prev) => {
      const current = prev[key] || [];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const toggleBooleanFilter = (key) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      ...DEFAULT_FILTERS,
      colorTone: [],
      sizeMeasure: [],
      material: [],
      usage: [],
      brand: [],
      packageContents: [],
      tags: [],
    });
    setSearchQuery("");
  };

  const chipItems = useMemo(() => {
    const chips = [];
    if (searchQuery.trim()) {
      chips.push({
        key: "q",
        value: searchQuery,
        label: `${t(language, "search.queryLabel")}: ${searchQuery}`,
        onRemove: () => setSearchQuery(""),
      });
    }
    if (activeMain && activeMain !== "All") {
      chips.push({
        key: "category",
        value: activeMain,
        label: `${t(language, "filters.mainCategory")}: ${getMainCategoryTitleByLang(activeMain, language)}`,
        onRemove: () => {
          setActiveMain("All");
          setActiveSub("");
        },
      });
    }
    if (activeSub) {
      chips.push({
        key: "subcategory",
        value: activeSub,
        label: `${t(language, "filters.subcategory")}: ${getSubcategoryTitleByLang(activeSub, language)}`,
        onRemove: () => setActiveSub(""),
      });
    }

    const listConfig = [
      { key: "colorTone", label: t(language, "filters.colorTone") },
      { key: "sizeMeasure", label: t(language, "filters.sizeMeasure") },
      { key: "material", label: t(language, "filters.material") },
      { key: "usage", label: t(language, "filters.usage") },
      { key: "brand", label: t(language, "filters.brand") },
      { key: "packageContents", label: t(language, "filters.packageContents") },
      { key: "tags", label: t(language, "filters.tags") },
    ];

    listConfig.forEach(({ key, label }) => {
      (selectedFilters[key] || []).forEach((value) => {
        chips.push({
          key,
          value,
          label: `${label}: ${value}`,
          onRemove: () => toggleFilterValue(key, value),
        });
      });
    });

    if (selectedFilters.inStock) {
      chips.push({
        key: "inStock",
        value: "1",
        label: t(language, "filters.inStock"),
        onRemove: () => toggleBooleanFilter("inStock"),
      });
    }
    if (selectedFilters.outOfStock) {
      chips.push({
        key: "outOfStock",
        value: "1",
        label: t(language, "filters.outOfStock"),
        onRemove: () => toggleBooleanFilter("outOfStock"),
      });
    }
    if (selectedFilters.isNew) {
      chips.push({
        key: "isNew",
        value: "1",
        label: t(language, "filters.newArrivals"),
        onRemove: () => toggleBooleanFilter("isNew"),
      });
    }
    if (selectedFilters.isDiscounted) {
      chips.push({
        key: "isDiscounted",
        value: "1",
        label: t(language, "filters.isDiscounted"),
        onRemove: () => toggleBooleanFilter("isDiscounted"),
      });
    }

    return chips;
  }, [activeMain, activeSub, language, searchQuery, selectedFilters]);

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${router.asPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
    } catch (e) {
      setCopySuccess(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const mainCode = String(product.mainCode || "").toUpperCase();
      const subCode = String(product.category || "").toUpperCase();
      if (allowedMainSet && (!mainCode || !allowedMainSet.has(mainCode))) return false;
      if (allowedSubSet && (!subCode || !allowedSubSet.has(subCode))) return false;
      if (activeMain !== "All") {
        if (product.mainCode && product.mainCode !== activeMain) return false;
      }
      if (activeSub && product.category !== activeSub) return false;
      if (query) {
        const haystack = product.searchText || buildSearchText(product, language);
        if (!haystack.includes(query)) return false;
      }

      const matchListFilter = (key, getter) => {
        const selected = selectedFilters[key] || [];
        if (selected.length === 0) return true;
        const values = getter(product).map((item) => item.toLowerCase());
        return selected.some((value) => values.includes(value.toLowerCase()));
      };

      if (!matchListFilter("colorTone", (p) => normalizeArray(getLocalizedField(p, "colorTone", language)))) return false;
      if (!matchListFilter("sizeMeasure", (p) => normalizeArray(getLocalizedField(p, "sizeInfo", language)))) return false;
      if (!matchListFilter("material", (p) => getLocalizedArrayField(p, "material", language))) return false;
      if (!matchListFilter("usage", (p) => getLocalizedArrayField(p, "usage", language))) return false;
      if (!matchListFilter("brand", (p) => normalizeArray(p.brand))) return false;
      if (!matchListFilter("packageContents", (p) => getLocalizedArrayField(p, "packageContents", language))) return false;
      if (!matchListFilter("tags", (p) => getLocalizedArrayField(p, "tags", language))) return false;

      const stockValue = Number(product.stock || 0);
      if (selectedFilters.inStock && !selectedFilters.outOfStock && stockValue <= 0) return false;
      if (selectedFilters.outOfStock && !selectedFilters.inStock && stockValue > 0) return false;
      if (selectedFilters.isNew && !product.isNew) return false;
      if (selectedFilters.isDiscounted && !(product.isOnSale || Number(product.salePrice) > 0 || Number(product.discountPercent) > 0)) return false;

      return true;
    });
  }, [
    products,
    activeMain,
    activeSub,
    searchQuery,
    selectedFilters,
    language,
    allowedMainSet,
    allowedSubSet,
  ]);

  const sortedProducts = useMemo(() => {
    const getTimestamp = (product) => {
      const raw =
        product.createdAt ||
        product._createdAt ||
        product.updatedAt ||
        product._updatedAt ||
        product.id ||
        0;
      const numeric = Number(raw);
      if (!Number.isNaN(numeric) && numeric > 0) return numeric;
      const parsed = Date.parse(raw);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const getPopularity = (product) => {
      const score =
        (Number(product.popularity) || 0) +
        (Number(product.salesCount) || 0) +
        (Number(product.orderCount) || 0) +
        (Number(product.rating) || 0) +
        (Number(product.views) || 0);
      return score;
    };

    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      if (sortBy === "price-asc") {
        return getPriceForMode(a, pricingMode) - getPriceForMode(b, pricingMode);
      }
      if (sortBy === "price-desc") {
        return getPriceForMode(b, pricingMode) - getPriceForMode(a, pricingMode);
      }
      if (sortBy === "popularity") {
        return getPopularity(b) - getPopularity(a);
      }
      return getTimestamp(b) - getTimestamp(a);
    });
    return sorted;
  }, [filteredProducts, pricingMode, sortBy]);

  const listAnalyticsKey = useMemo(() => {
    if (!sortedProducts.length) return "";
    const ids = sortedProducts
      .slice(0, 20)
      .map((item) => String(item?.id || item?.code || item?.slug?.current || ""))
      .filter(Boolean)
      .join("|");
    return `${activeSub || ""}/${activeMain || ""}/${ids}`;
  }, [sortedProducts, activeMain, activeSub]);

  useEffect(() => {
    if (!sortedProducts.length) return;
    if (!listAnalyticsKey) return;
    analytics.viewItemList({
      items: sortedProducts.slice(0, 20).map((item) => ({
        id: item.id || item.code,
        name: item.name,
        category: item.category,
      })),
      list_id: activeSub || activeMain || "all",
      list_name: activeSub || activeMain || "all",
    });
  }, [listAnalyticsKey]);

  const suggestionSource = useMemo(() => {
    if (!allowedMainSet && !allowedSubSet) return products;
    return products.filter((product) => {
      const mainCode = String(product.mainCode || "").toUpperCase();
      const subCode = String(product.category || "").toUpperCase();
      if (allowedMainSet && (!mainCode || !allowedMainSet.has(mainCode))) return false;
      if (allowedSubSet && (!subCode || !allowedSubSet.has(subCode))) return false;
      return true;
    });
  }, [products, allowedMainSet, allowedSubSet]);

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const items = [];

    MAIN_CATEGORIES.filter((cat) => !allowedMainSet || allowedMainSet.has(cat.code)).forEach((cat) => {
      const label = `${cat.code} - ${getMainCategoryTitleByLang(cat.code, language)}`;
      if (label.toLowerCase().includes(query)) {
        items.push({ type: "main", label, value: cat.code });
      }
    });

    SUBCATEGORIES.filter((sub) => {
      if (allowedMainSet && !allowedMainSet.has(sub.main)) return false;
      if (allowedSubSet && !allowedSubSet.has(sub.code)) return false;
      return true;
    }).forEach((sub) => {
      const label = `${sub.code} - ${getSubcategoryTitleByLang(sub.code, language)}`;
      if (label.toLowerCase().includes(query)) {
        items.push({ type: "sub", label, value: sub.code });
      }
    });

    const tagSet = new Set();
    suggestionSource.forEach((product) => {
      getLocalizedArrayField(product, "tags", language).forEach((tag) => tagSet.add(tag));
    });
    Array.from(tagSet).forEach((tag) => {
      if (tag.toLowerCase().includes(query)) {
        items.push({ type: "tag", label: tag, value: tag });
      }
    });

    suggestionSource.forEach((product) => {
      const name = getLocalizedField(product, "name", language) || product.name;
      if (name && name.toLowerCase().includes(query)) {
        items.push({ type: "product", label: name, value: name });
      }
    });

    return items.slice(0, 8);
  }, [searchQuery, suggestionSource, language, allowedMainSet, allowedSubSet]);

  const suggestionLabels = useMemo(
    () => ({
      main: t(language, "filters.suggestionMain"),
      sub: t(language, "filters.suggestionSub"),
      tag: t(language, "filters.suggestionTag"),
      product: t(language, "filters.suggestionProduct"),
    }),
    [language]
  );

  const headingText = searchPage
    ? (searchQuery
        ? t(language, "search.resultsTitleWithQuery", { query: searchQuery })
        : t(language, "search.resultsTitle"))
    : (pageTitle || t(language, "plants.title"));

  const highlightValue = searchPage ? (highlightQuery || searchQuery) : "";

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "main") {
      setActiveMain(suggestion.value);
      setActiveSub("");
    } else if (suggestion.type === "sub") {
      setActiveSub(suggestion.value);
      setActiveMain(suggestion.value.charAt(0));
    } else if (suggestion.type === "tag") {
      toggleFilterValue("tags", suggestion.value);
    }
    setSearchQuery(suggestion.value);
  };

  return (
    <section className={`${styles["section-plants"]}container padding-top margin-top`}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className={`container margin-top`}
      >
        <h3 id="plants" className="margin-bottom">
          {headingText}
        </h3>

        <div className={styles.discoveryHeader}>
          <div className={styles.searchBox}>
            <input
              type="text"
              value={searchQuery}
              placeholder={t(language, "filters.searchPlaceholder")}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchHint}>{t(language, "filters.searchHint")}</span>
            {searchQuery && suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((item, index) => (
                  <button
                    key={`${item.type}-${item.value}-${index}`}
                    type="button"
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <span className={styles.suggestionType}>
                      {suggestionLabels[item.type] || item.type}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.sortBox}>
            <label htmlFor="sort">{t(language, "plants.sortLabel")}</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">{t(language, "plants.sortNewest")}</option>
              <option value="price-asc">{t(language, "plants.sortPriceAsc")}</option>
              <option value="price-desc">{t(language, "plants.sortPriceDesc")}</option>
              <option value="popularity">{t(language, "plants.sortPopularity")}</option>
            </select>
          </div>
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            {t(language, "filters.title")}
          </button>
        </div>

        {filtersOpen && (
          <button
            type="button"
            className={styles.filterBackdrop}
            onClick={() => setFiltersOpen(false)}
            aria-label={t(language, "filters.close")}
          />
        )}

        <div className={`${styles.filtersPanel} ${filtersOpen ? styles.filtersOpen : ""}`}>
          <div className={styles.filterRow}>
            <label>{t(language, "filters.mainCategory")}</label>
            <select
              value={activeMain}
              onChange={(e) => {
                setActiveMain(e.target.value);
                setActiveSub("");
              }}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterRow}>
            <label>{t(language, "filters.subcategory")}</label>
            <select
              value={activeSub}
              onChange={(e) => {
                const value = e.target.value;
                setActiveSub(value);
                if (value) setActiveMain(value.charAt(0));
              }}
            >
              <option value="">{t(language, "filters.all")}</option>
              {subcategoryOptions.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} - {getSubcategoryTitleByLang(sub.code, language)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterRow}>
            <label>{t(language, "filters.stock")}</label>
            <div className={styles.inlineChecks}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFilters.inStock}
                  onChange={() => toggleBooleanFilter("inStock")}
                />
                {t(language, "filters.inStock")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFilters.outOfStock}
                  onChange={() => toggleBooleanFilter("outOfStock")}
                />
                {t(language, "filters.outOfStock")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFilters.isNew}
                  onChange={() => toggleBooleanFilter("isNew")}
                />
                {t(language, "filters.newArrivals")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFilters.isDiscounted}
                  onChange={() => toggleBooleanFilter("isDiscounted")}
                />
                {t(language, "filters.isDiscounted")}
              </label>
            </div>
          </div>

          {FILTER_GROUPS.map((group) => (
            <div key={group.key} className={styles.filterGroup}>
              <button
                type="button"
                className={styles.filterGroupToggle}
                onClick={() =>
                  setOpenGroups((prev) =>
                    prev.includes(group.key)
                      ? prev.filter((item) => item !== group.key)
                      : [...prev, group.key]
                  )
                }
              >
                {t(language, group.labelKey)}
              </button>
              {openGroups.includes(group.key) && (
                <div className={styles.filterOptions}>
                  {(facetOptions[group.key] || []).map((value) => (
                    <label key={`${group.key}-${value}`}>
                      <input
                        type="checkbox"
                        checked={selectedFilters[group.key].includes(value)}
                        onChange={() => toggleFilterValue(group.key, value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className={styles.filterActions}>
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              {t(language, "filters.clear")}
            </button>
            <button
              type="button"
              className={styles.applyFilters}
              onClick={() => setFiltersOpen(false)}
            >
              {t(language, "filters.apply")}
            </button>
          </div>
        </div>

        <div className={styles.chipsRow}>
          <div className={styles.chips}>
            {chipItems.length === 0 && (
              <span className={styles.noChips}>{t(language, "filters.noSelection")}</span>
            )}
            {chipItems.map((chip, index) => (
              <button
                key={`${chip.key}-${chip.value}-${index}`}
                type="button"
                className={styles.chip}
                onClick={chip.onRemove}
              >
                {chip.label}
                <span aria-hidden>&times;</span>
              </button>
            ))}
          </div>
          <div className={styles.chipActions}>
            <button type="button" onClick={clearFilters}>
              {t(language, "filters.clear")}
            </button>
            <button type="button" onClick={handleCopyLink}>
              {copySuccess ? t(language, "filters.linkCopied") : t(language, "filters.copyLink")}
            </button>
          </div>
        </div>

        <div className={styles.resultsMeta}>
          {t(language, "filters.results")}: {sortedProducts.length}
        </div>

        {sortedProducts.length === 0 && !isFiltering ? (
          <EmptyState
            title={t(language, searchPage ? "states.noSearchTitle" : "states.noProductsTitle")}
            description={t(language, searchPage ? "states.noSearchBody" : "states.noProductsBody")}
            actionLabel={t(language, "filters.clear")}
            onAction={clearFilters}
          />
        ) : (
          <motion.div
            transition={{ duration: 0.4, delayChildren: 0.4 }}
            className={`${styles["card__container"]}`}
          >
            {isFiltering
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className={styles.skeletonCard}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonBody}>
                      <span className={styles.skeletonLine} />
                      <span className={styles.skeletonLineShort} />
                      <span className={styles.skeletonLine} />
                    </div>
                  </div>
                ))
              : sortedProducts?.map((product) => (
                  <CardPlantList
                    product={product}
                    key={product.id || product._id}
                    highlightQuery={highlightValue}
                  />
                ))}
          </motion.div>
        )}
      </motion.div>
      {bestsellers?.length > 0 && (
        <>
          <h3 className="margin-bottom margin-top">{t(language, "misc.bestSellers")}</h3>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${styles["card__container"]} container`}
          >
            {bestsellers?.map((bestseller) => (
              <BestSellerCard bestseller={bestseller} key={bestseller._id} />
            ))}
          </motion.div>
        </>
      )}
    </section>
  );
};

export default Plants;
