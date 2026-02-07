import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import styles from "./MaxoyCatalogPage.module.scss";
import { useStateContext } from "@/context/StateContext";
import { MAIN_CATEGORIES, SUBCATEGORIES } from "@/constants/categories";
import { getQueryValue } from "@/lib/queryUtils";
import ProductCard from "./ProductCard";
import { getPriceForMode } from "@/lib/productUtils";
import { ProductGridSkeleton } from "@/components/feedback/Skeletons";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const SORT_OPTIONS = [
  { key: "featured", tr: "Öne çıkanlar", en: "Featured" },
  { key: "price-asc", tr: "Fiyat artan", en: "Price ↑" },
  { key: "price-desc", tr: "Fiyat azalan", en: "Price ↓" },
  { key: "discount-desc", tr: "İndirim oranı artan", en: "Discount ↑" },
  { key: "discount-asc", tr: "İndirim oranı azalan", en: "Discount ↓" },
  { key: "oldest", tr: "İlk eklenen", en: "Oldest" },
  { key: "newest", tr: "Son eklenen", en: "Newest" },
];

function clampStr(value) {
  return String(value || "").trim();
}

function normalizeCategoryQuery(raw, { allowedMainSet, allowedSubSet }) {
  const v = clampStr(raw);
  if (!v) return { main: "All", sub: "" };
  const upper = v.toUpperCase();
  if (upper === "ALL") return { main: "All", sub: "" };

  if (upper.length > 1) {
    const sub = upper;
    const main = sub.charAt(0);
    if (allowedSubSet && !allowedSubSet.has(sub)) return { main: "All", sub: "" };
    if (allowedMainSet && !allowedMainSet.has(main)) return { main: "All", sub: "" };
    return { main, sub };
  }

  const main = upper.charAt(0);
  if (allowedMainSet && !allowedMainSet.has(main)) return { main: "All", sub: "" };
  return { main, sub: "" };
}

function getProductSubCode(product) {
  const raw = product?.category;
  return clampStr(raw).toUpperCase();
}

function getProductMainCode(product) {
  const sub = getProductSubCode(product);
  return sub ? sub.charAt(0) : "";
}

function sortProducts(list, sortKey, { pricingMode }) {
  const items = [...(list || [])];
  const getPrice = (p) => Number(getPriceForMode(p, pricingMode) || 0);
  const getDiscount = (p) => Number(p?.discountPercent || 0);
  const getTs = (p) => {
    const id = Number(p?.id);
    if (Number.isFinite(id) && id > 0) return id;
    return 0;
  };

  switch (sortKey) {
    case "price-asc":
      return items.sort((a, b) => getPrice(a) - getPrice(b));
    case "price-desc":
      return items.sort((a, b) => getPrice(b) - getPrice(a));
    case "discount-asc":
      return items.sort((a, b) => getDiscount(a) - getDiscount(b));
    case "discount-desc":
      return items.sort((a, b) => getDiscount(b) - getDiscount(a));
    case "oldest":
      return items.sort((a, b) => getTs(a) - getTs(b));
    case "newest":
      return items.sort((a, b) => getTs(b) - getTs(a));
    case "featured":
    default:
      return items;
  }
}

export default function MaxoyCatalogPage({ products = [], categories = [], config, globalSettings }) {
  const router = useRouter();
  const { language, currency, pricingMode } = useStateContext();
  const isEn = language === "en";

  const useDbCategories = Array.isArray(categories) && categories.length > 0;

  const brandName = globalSettings?.data?.siteName || "Maxoy";
  const pageTitle =
    config?.titleTR && config?.titleEN ? (isEn ? config.titleEN : config.titleTR) : "";

  const allowedMainSet = useMemo(() => {
    const raw = config?.allowedMainCategories;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return new Set(raw.map((x) => String(x).toUpperCase()));
  }, [config]);

  const allowedSubSet = useMemo(() => {
    const raw = config?.allowedSubcategories;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return new Set(raw.map((x) => String(x).toUpperCase()));
  }, [config]);

  const [view, setView] = useState("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const query = router.query || {};
  const qSearch = getQueryValue(query.q) || "";
  const qSort = getQueryValue(query.sort) || "featured";
  const qCategory = getQueryValue(query.category);

  const dbCategoryMap = useMemo(() => {
    const map = new Map();
    (categories || []).forEach((c) => {
      if (c?.id) map.set(String(c.id), c);
      if (c?.slug) map.set(String(c.slug).toLowerCase(), c);
    });
    return map;
  }, [categories]);

  const childIdsByParent = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => {
      if (!c?.parentId || !c?.id) return;
      const key = String(c.parentId);
      if (!map[key]) map[key] = [];
      map[key].push(String(c.id));
    });
    return map;
  }, [categories]);

  const { main: activeMain, sub: activeSub } = useMemo(() => {
    if (!useDbCategories) {
      return normalizeCategoryQuery(qCategory, { allowedMainSet, allowedSubSet });
    }
    const raw = clampStr(qCategory).toLowerCase();
    if (!raw) return { main: "all", sub: "" };
    const found = dbCategoryMap.get(raw) || dbCategoryMap.get(raw.toLowerCase());
    if (!found) return { main: "all", sub: "" };
    if (found.parentId) {
      return { main: String(found.parentId), sub: String(found.id) };
    }
    return { main: String(found.id), sub: "" };
  }, [qCategory, allowedMainSet, allowedSubSet, useDbCategories, dbCategoryMap]);

  const [search, setSearch] = useState(String(qSearch || ""));
  const debouncedSearch = useDebouncedValue(search, 260);
  useEffect(() => setSearch(String(qSearch || "")), [qSearch]);

  const configuredSidebarItems = useMemo(() => {
    const items = config?.sidebarItems;
    if (!Array.isArray(items) || items.length === 0) return null;
    return items
      .map((it) => ({
        labelTR: String(it?.labelTR || "").trim(),
        labelEN: String(it?.labelEN || "").trim(),
        category: String(it?.category || "").trim(),
      }))
      .filter((it) => it.labelTR);
  }, [config]);

  const availableSubcategories = useMemo(() => {
    if (useDbCategories) {
      const all = categories.filter((c) => c && c.id);
      const hasChildren = all.some((c) => c.parentId);
      if (activeMain !== "all") {
        return all.filter((c) => String(c.parentId || "") === String(activeMain));
      }
      return hasChildren ? all.filter((c) => c.parentId) : all;
    }
    const base = SUBCATEGORIES.map((s) => ({ ...s, code: String(s.code).toUpperCase() }));
    let list = base;
    if (allowedSubSet) list = list.filter((s) => allowedSubSet.has(s.code));
    if (allowedMainSet) list = list.filter((s) => allowedMainSet.has(String(s.main).toUpperCase()));
    if (activeMain !== "All") list = list.filter((s) => String(s.main).toUpperCase() === activeMain);
    return list;
  }, [activeMain, allowedMainSet, allowedSubSet, useDbCategories, categories]);

  const baseFilteredProducts = useMemo(() => {
    let list = [...products];
    if (useDbCategories) return list;
    if (allowedMainSet) list = list.filter((p) => allowedMainSet.has(getProductMainCode(p)));
    if (allowedSubSet) list = list.filter((p) => allowedSubSet.has(getProductSubCode(p)));
    return list;
  }, [products, allowedMainSet, allowedSubSet, useDbCategories]);

  const subCounts = useMemo(() => {
    const counts = {};
    baseFilteredProducts.forEach((p) => {
      const sub = getProductSubCode(p);
      if (!sub) return;
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [baseFilteredProducts]);

  const mainCounts = useMemo(() => {
    const counts = {};
    baseFilteredProducts.forEach((p) => {
      const main = getProductMainCode(p);
      if (!main) return;
      counts[main] = (counts[main] || 0) + 1;
    });
    return counts;
  }, [baseFilteredProducts]);

  const filteredProducts = useMemo(() => {
    let list = [...baseFilteredProducts];

    if (useDbCategories) {
      if (activeSub) list = list.filter((p) => String(p.categoryId) === String(activeSub));
      else if (activeMain !== "all") {
        const children = childIdsByParent[String(activeMain)] || [];
        list = list.filter(
          (p) => String(p.categoryId) === String(activeMain) || children.includes(String(p.categoryId))
        );
      }
    } else {
      if (activeSub) list = list.filter((p) => getProductSubCode(p) === activeSub);
      else if (activeMain !== "All") list = list.filter((p) => getProductMainCode(p) === activeMain);
    }

    const needle = clampStr(debouncedSearch).toLowerCase();
    if (needle) {
      list = list.filter((p) => {
        const name = String(isEn ? p?.nameEN : p?.nameTR || p?.name || "").toLowerCase();
        const code = String(p?.code || "").toLowerCase();
        const tags = Array.isArray(p?.tags) ? p.tags.join(" ").toLowerCase() : "";
        return name.includes(needle) || code.includes(needle) || tags.includes(needle);
      });
    }

    return sortProducts(list, qSort, { pricingMode });
  }, [activeMain, activeSub, baseFilteredProducts, debouncedSearch, isEn, pricingMode, qSort, useDbCategories, childIdsByParent]);

  const onSetQuery = (next) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, ...next },
      },
      undefined,
      { shallow: true }
    );
  };

  const onPickCategory = (code) => {
    const next = {};
    if (!code) next.category = undefined;
    else next.category = code;
    onSetQuery(next);
    setSidebarOpen(false);
  };

  const activeLabel = useMemo(() => {
    if (useDbCategories) {
      if (activeSub) {
        const found = categories.find((c) => String(c.id) === String(activeSub));
        if (found) return isEn ? found.nameEN || found.nameTR : found.nameTR;
      }
      if (activeMain && activeMain !== "all") {
        const found = categories.find((c) => String(c.id) === String(activeMain));
        if (found) return isEn ? found.nameEN || found.nameTR : found.nameTR;
      }
      return pageTitle || (isEn ? "All products" : "Tüm Ürünler");
    }
    if (activeSub) {
      const found = SUBCATEGORIES.find((s) => String(s.code).toUpperCase() === activeSub);
      if (!found) return activeSub;
      return isEn && found.titleEn ? found.titleEn : found.title;
    }
    if (activeMain !== "All") {
      const found = MAIN_CATEGORIES.find((c) => String(c.code).toUpperCase() === activeMain);
      if (!found) return activeMain;
      return isEn && found.titleEn ? found.titleEn : found.title;
    }
    return pageTitle || (isEn ? "All products" : "Tüm Ürünler");
  }, [activeMain, activeSub, isEn, pageTitle, useDbCategories, categories]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 240);
    return () => clearTimeout(timer);
  }, [activeMain, activeSub, qSort, debouncedSearch, baseFilteredProducts.length]);

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.breadcrumb}>{pageTitle || (isEn ? "Products" : "Ürünler")}</div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{activeLabel}</h1>
        <div className={styles.count}>
          {filteredProducts.length} {isEn ? "products" : "ürün"}
        </div>
      </div>

      <div className={styles.layout}>
        {sidebarOpen ? (
          <button
            type="button"
            className={styles.sidebarOverlay}
            aria-label={isEn ? "Close filters" : "Filtreleri kapat"}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHead}>
            <div className={styles.sidebarTitle}>{isEn ? "Filters" : "Filtreler"}</div>
            <button
              type="button"
              className={styles.sidebarClose}
              onClick={() => setSidebarOpen(false)}
              aria-label={isEn ? "Close" : "Kapat"}
            >
              ×
            </button>
          </div>

          <div className={styles.sidebarSearch}>
            <input
              className={styles.search}
              placeholder={isEn ? "Search products…" : "Ne aramıştınız?"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSetQuery({ q: search || undefined });
              }}
            />
            <button type="button" className={styles.searchBtn} onClick={() => onSetQuery({ q: search || undefined })}>
              {isEn ? "Search" : "Ara"}
            </button>
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>{isEn ? "Subcategories" : "Alt Kategoriler"}</div>
            <ul className={styles.sidebarList}>
              <li>
                <button
                  type="button"
                  className={`${styles.sidebarItem} ${
                    (useDbCategories ? activeMain === "all" : activeMain === "All") && !activeSub
                      ? styles.sidebarItemActive
                      : ""
                  }`}
                  onClick={() => onPickCategory("")}
                >
                  <span>{isEn ? "All" : "Tümü"}</span>
                  <span className={styles.sidebarCount}>({baseFilteredProducts.length})</span>
                </button>
              </li>
              {configuredSidebarItems
                ? configuredSidebarItems.map((it) => {
                    const code = String(it.category || "").toUpperCase();
                    const isMain = code.length === 1;
                    const count = !code
                      ? baseFilteredProducts.length
                      : isMain
                        ? mainCounts[code] || 0
                        : subCounts[code] || 0;
                    const isActive = !code
                      ? activeMain === "All" && !activeSub
                      : isMain
                        ? activeMain === code && !activeSub
                        : activeSub === code;
                    return (
                      <li key={`${it.labelTR}-${code}`}>
                        <button
                          type="button"
                          className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""}`}
                          onClick={() => onPickCategory(code)}
                        >
                          <span>{isEn && it.labelEN ? it.labelEN : it.labelTR}</span>
                          <span className={styles.sidebarCount}>({count})</span>
                        </button>
                      </li>
                    );
                  })
                : availableSubcategories.map((s) => {
                    if (useDbCategories) {
                      const count = baseFilteredProducts.filter((p) => String(p.categoryId) === String(s.id)).length;
                      const label = isEn ? s.nameEN || s.nameTR : s.nameTR;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            className={`${styles.sidebarItem} ${activeSub === String(s.id) ? styles.sidebarItemActive : ""}`}
                            onClick={() => onPickCategory(String(s.id))}
                          >
                            <span>{label}</span>
                            <span className={styles.sidebarCount}>({count})</span>
                          </button>
                        </li>
                      );
                    }
                    const count = subCounts[String(s.code).toUpperCase()] || 0;
                    return (
                      <li key={s.code}>
                        <button
                          type="button"
                          className={`${styles.sidebarItem} ${activeSub === String(s.code).toUpperCase() ? styles.sidebarItemActive : ""}`}
                          onClick={() => onPickCategory(String(s.code).toUpperCase())}
                        >
                          <span>{isEn ? s.titleEn : s.title}</span>
                          <span className={styles.sidebarCount}>({count})</span>
                        </button>
                      </li>
                    );
                  })}
            </ul>
          </div>
        </aside>

        <section className={styles.main}>
          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.filtersBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label={isEn ? "Open filters" : "Filtreleri aç"}
            >
              {isEn ? "Filters" : "Filtrele"}
            </button>

            <div className={styles.sort}>
              <span className={styles.sortLabel}>{isEn ? "Sort" : "Sırala"}</span>
              <select
                value={qSort}
                className={styles.sortSelect}
                onChange={(e) => onSetQuery({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {isEn ? opt.en : opt.tr}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.view}>
              <button
                type="button"
                className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`}
                onClick={() => setView("grid")}
                aria-label={isEn ? "Grid view" : "Izgara görünüm"}
              >
                ▦
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`}
                onClick={() => setView("list")}
                aria-label={isEn ? "List view" : "Liste görünüm"}
              >
                ▤
              </button>
            </div>
          </div>

          {isFiltering ? (
            <ProductGridSkeleton count={view === "list" ? 4 : 8} />
          ) : (
            <div className={view === "list" ? styles.cardsList : styles.cardsGrid}>
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id || p._id || p.code || p.slug?.current}
                  product={p}
                  brandName={brandName}
                  language={language}
                  currency={currency}
                  pricingMode={pricingMode}
                  view={view}
                />
              ))}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{isEn ? "No products found" : "Ürün bulunamadı"}</div>
              <div className={styles.emptyDesc}>
                {isEn ? "Try removing filters or changing your search." : "Filtreleri temizleyerek tekrar deneyin."}
              </div>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => onSetQuery({ q: undefined, category: undefined, sort: "featured" })}
              >
                {isEn ? "Reset filters" : "Filtreleri Sıfırla"}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
