import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiChevronDown } from "react-icons/fi";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import styles from "./MobileNav.module.scss";
import { useStateContext } from "@/context/StateContext";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { LANGUAGES, t } from "@/constants/i18n";
import {
  MAIN_CATEGORIES,
  SUBCATEGORIES_BY_MAIN,
  getMainCategoryTitleByLang,
  getSubcategoryTitleByLang,
} from "@/constants/categories";
import { WHATSAPP_NUMBER } from "@/constants/contact";

const MobileNav = ({ isOpen, onClose }) => {
  const { language, changeLanguage, isAuthenticated, setShowCart } = useStateContext();
  const router = useRouter();
  const [openMain, setOpenMain] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [storeCategories, setStoreCategories] = useState([]);
  const drawerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useBodyScrollLock(isOpen);

  const accountLink = useMemo(
    () =>
      isAuthenticated
        ? "/account"
        : { pathname: "/login", query: { next: router.asPath } },
    [isAuthenticated, router.asPath]
  );

  const quickLinks = useMemo(
    () => [
      { label: t(language, "nav.home"), href: "/" },
      { label: t(language, "nav.products"), href: "/tum-urunler" },
      { label: t(language, "nav.quickOrder"), href: "/quick-order" },
      { label: t(language, "nav.quote"), href: "/wholesale" },
      { label: t(language, "footer.about"), href: "/about" },
      {
        label: t(language, "nav.account"),
        href: accountLink,
      },
    ],
    [language, accountLink]
  );

  useEffect(() => {
    if (!isOpen) return;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll(focusableSelector);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusable = drawerRef.current?.querySelectorAll(focusableSelector);
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setOpenMain(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/store/categories");
        const payload = await res.json().catch(() => null);
        if (!isMounted) return;
        setStoreCategories(payload?.categories || []);
      } catch {
        if (isMounted) setStoreCategories([]);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    router.push({ pathname: "/search", query: { q: query } }, undefined, {
      shallow: true,
      scroll: true,
    });
    setSearchValue("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          onClick={onClose}
          aria-hidden={!isOpen}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label={t(language, "nav.menu")}
            ref={drawerRef}
            onClick={(event) => event.stopPropagation()}
            initial={shouldReduceMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={shouldReduceMotion ? { x: 0 } : { x: "-100%" }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className={styles.header}>
              <span>{t(language, "nav.menu")}</span>
              <button type="button" onClick={onClose} aria-label={t(language, "nav.close")}>
                &times;
              </button>
            </div>

        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t(language, "nav.searchPlaceholder")}
          />
          <button type="submit">{t(language, "nav.searchSubmit")}</button>
        </form>

        <div className={styles.actionRow}>
          <button
            type="button"
            onClick={() => {
              setShowCart(true);
              onClose();
            }}
          >
            {t(language, "cart.title")}
          </button>
          <Link href={accountLink} onClick={onClose}>{t(language, "nav.account")}</Link>
        </div>

        <div className={styles.section}>
          <h4>{t(language, "nav.categories")}</h4>
          <div className={styles.accordion}>
            {(storeCategories && storeCategories.length
              ? storeCategories.filter((c) => !c.parentId).map((main) => ({
                  code: String(main.id),
                  slug: String(main.slug),
                  label: language === "en" ? main.nameEN || main.nameTR : main.nameTR,
                  children: storeCategories.filter((c) => String(c.parentId) === String(main.id)),
                }))
              : MAIN_CATEGORIES.map((main) => ({
                  code: main.code,
                  slug: main.code,
                  label: getMainCategoryTitleByLang(main.code, language),
                  children: SUBCATEGORIES_BY_MAIN[main.code] || [],
                }))
            ).map((main) => {
              const isOpenMain = openMain === main.code;
              const panelId = `mobile-cat-${main.code}`;
              return (
                <div key={main.code} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionTrigger}
                    aria-expanded={isOpenMain}
                    aria-controls={panelId}
                    onClick={() => setOpenMain((prev) => (prev === main.code ? null : main.code))}
                  >
                    <span>{main.label}</span>
                    <FiChevronDown />
                  </button>
                  <div
                    id={panelId}
                    className={isOpenMain ? styles.accordionPanelOpen : styles.accordionPanel}
                  >
                    <Link
                      href={`/tum-urunler?category=${main.slug}`}
                      onClick={onClose}
                      className={styles.mainLink}
                    >
                      {main.label}
                    </Link>
                    <ul>
                      {(main.children || []).map((sub) => (
                        <li key={sub.id || sub.code}>
                          <Link
                            href={`/tum-urunler?category=${sub.slug || sub.code}`}
                            onClick={onClose}
                          >
                            {"nameTR" in sub
                              ? (language === "en" ? sub.nameEN || sub.nameTR : sub.nameTR)
                              : getSubcategoryTitleByLang(sub.code, language)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <h4>{t(language, "nav.quickLinks")}</h4>
          <ul className={styles.quickLinks}>
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} onClick={onClose}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h4>{t(language, "nav.language")}</h4>
          <div className={styles.langSwitch}>
            {Object.values(LANGUAGES).map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={
                  language === lang.code
                    ? `${styles.langButton} ${styles.langButtonActive}`
                    : styles.langButton
                }
                onClick={() => changeLanguage(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <a
          className={styles.whatsappCta}
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t(language, "nav.whatsappCta")}
        </a>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNav;
