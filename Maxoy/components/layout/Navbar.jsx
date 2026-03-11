import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AiOutlineSearch, AiOutlineShopping, AiOutlineUser } from "react-icons/ai";
import { FiChevronDown } from "react-icons/fi";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";

import styles from "./Navbar.module.scss";
import MiniCart from "../cart/MiniCart";
import SearchModal from "./SearchModal";
import MobileNav from "./MobileNav";
import TopBar from "./TopBar";
import { useStateContext } from "@/context/StateContext";
import { useTheme } from "@/context/ThemeContext";
import { LANGUAGES, t } from "@/constants/i18n";
import { MAIN_CATEGORIES, getMainCategoryTitleByLang } from "@/constants/categories";

const Navbar = () => {
  const {
    showCart,
    setShowCart,
    totalQuantities,
    active,
    setActive,
    language,
    changeLanguage,
    isAuthenticated,
  } = useStateContext();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [desktopCategoriesOpen, setDesktopCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);
  const [storeHome, setStoreHome] = useState(null);
  const [storeCategories, setStoreCategories] = useState([]);

  const navLinks = useMemo(
    () => [
      { label: t(language, "nav.home"), href: "/" },
      { label: t(language, "nav.products"), href: "/tum-urunler" },
      { label: t(language, "nav.readyProducts"), href: "/hazir-urunler" },
      { label: t(language, "nav.artificialDry"), href: "/cicek-cesitleri" },
      { label: t(language, "nav.oasisTypes"), href: "/toptan-cicek-malzemesi-oasis-cesitleri" },
    ],
    [language]
  );

  const categoryLinks = useMemo(() => {
    if (storeCategories && storeCategories.length) {
      return storeCategories
        .filter((c) => !c.parentId)
        .map((cat) => ({
          label: language === "en" ? cat.nameEN || cat.nameTR : cat.nameTR,
          href: `/tum-urunler?category=${cat.slug}`,
        }));
    }
    return MAIN_CATEGORIES.map((cat) => ({
      label: getMainCategoryTitleByLang(cat.code, language),
      href: `/tum-urunler?category=${cat.code}`,
    }));
  }, [language, storeCategories]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [settingsRes, homeRes, categoriesRes] = await Promise.all([
          fetch("/api/store/settings"),
          fetch("/api/store/home"),
          fetch("/api/store/categories"),
        ]);
        const settingsPayload = await settingsRes.json().catch(() => null);
        const homePayload = await homeRes.json().catch(() => null);
        const categoriesPayload = await categoriesRes.json().catch(() => null);
        if (!isMounted) return;
        setStoreSettings(settingsPayload?.settings || null);
        setStoreHome(homePayload?.home || null);
        setStoreCategories(categoriesPayload?.categories || []);
      } catch (e) {
        if (isMounted) {
          setStoreSettings(null);
          setStoreHome(null);
          setStoreCategories([]);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setDesktopCategoriesOpen(false);
      setActive(false);
      setSearchOpen(false);
    };
    router.events?.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events?.off("routeChangeStart", handleRouteChange);
    };
  }, [router.events, setActive]);

  const toggleMobile = () => {
    setActive(!active);
  };

  const brandName = storeSettings?.brand?.siteName || t(language, "home.brand");
  const logoUrl = storeSettings?.brand?.logoUrl || "/maxoy_logo.png";

  const activeAnnouncement =
    (storeHome?.announcements || []).find((a) => a?.isActive !== false) || null;
  const announcementText =
    language === "en"
      ? activeAnnouncement?.messageEN
      : activeAnnouncement?.messageTR;
  const accountHref = isAuthenticated
    ? "/account"
    : { pathname: "/login", query: { next: router.asPath } };

  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <TopBar message={announcementText || t(language, "nav.announcement")} />
      <div className={styles.navbar}>
        <button
          type="button"
          className={styles.burger}
          onClick={toggleMobile}
          aria-label={t(language, "nav.menu")}
        >
          <span />
          <span />
          <span />
        </button>

        <Link href="/" className={styles.logo}>
            <img src={logoUrl} alt={brandName} />
            <span>{brandName}</span>
          </Link>

        <nav className={styles.navLinks}>
          <ul>
            <li className={styles.dropdown}>
              <button
                type="button"
                className={styles.dropdownToggle}
                onClick={() => setDesktopCategoriesOpen((prev) => !prev)}
                aria-expanded={desktopCategoriesOpen}
              >
                {t(language, "nav.categories")}
                <FiChevronDown />
              </button>
              {desktopCategoriesOpen && (
                <div className={styles.dropdownMenu}>
                  {categoryLinks.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setDesktopCategoriesOpen(false)}>{item.label}</Link>
                  ))}
                </div>
              )}
            </li>
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label={isDark ? "Light mode" : "Dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <HiOutlineSun /> : <HiOutlineMoon />}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setSearchOpen(true)}
            aria-label={t(language, "nav.search")}
          >
            <AiOutlineSearch />
          </button>
          <Link href={accountHref} className={styles.iconButton} aria-label={t(language, "nav.account")}>
              <AiOutlineUser />
            </Link>
          <button
            type="button"
            className={styles.cartButton}
            onClick={() => setShowCart(true)}
            aria-label={t(language, "cart.title")}
          >
            <AiOutlineShopping />
            <span className={styles.cartCount}>{totalQuantities}</span>
          </button>
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
                aria-label={lang.name}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>{showCart && <MiniCart />}</AnimatePresence>
      </div>

      <MobileNav isOpen={active} onClose={() => setActive(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.header>
  );
};

export default Navbar;
