import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import styles from "./Footer.module.scss";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";

const Footer = () => {
  const { language } = useStateContext();
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const settingsRes = await fetch("/api/store/settings");
        const data = await settingsRes.json().catch(() => null);
        if (isMounted) setStoreSettings(data?.settings || null);
      } catch (e) {
        if (isMounted) setStoreSettings(null);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const brandName = storeSettings?.brand?.siteName || t(language, "home.brand");
  const logoUrl = storeSettings?.brand?.logoUrl || "/maxoy_logo.png";
  const year = useMemo(() => new Date().getFullYear(), []);
  const isEn = language === "en";

  const categories = useMemo(
    () => [
      { href: "/", name: t(language, "nav.home") },
      { href: "/tum-urunler", name: t(language, "nav.products") },
      { href: "/hazir-urunler", name: t(language, "nav.readyProducts") },
      { href: "/toptan-cicek-malzemesi-oasis-cesitleri", name: t(language, "nav.oasisTypes") },
    ],
    [language]
  );

  const accountLinks = useMemo(
    () => [
      { href: "/login", name: isEn ? "Sign in" : "Giriş Yap" },
      { href: "/register", name: isEn ? "Create account" : "Kayıt Ol" },
    ],
    [isEn]
  );

  const aboutLinks = useMemo(
    () => [
      { href: "/returns", name: isEn ? "Returns & Exchanges" : "İade / Değişim" },
      { href: "/terms", name: isEn ? "Distance sales contract" : "Mesafeli Satış" },
      { href: "/privacy", name: isEn ? "Privacy" : "Kullanım & Gizlilik" },
      { href: "/about", name: isEn ? "About" : "Hakkımızda" },
    ],
    [isEn]
  );

  return (
    <footer className={styles.footer} id="footer">
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={brandName} />
            <span>{brandName}</span>
          </Link>
          <p className={styles.desc}>
            {isEn
              ? "Wholesale & retail flower supplies — fast delivery, secure shopping."
              : "Toptan + perakende çiçek malzemeleri — hızlı teslimat, güvenli alışveriş."}
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <div className={styles.heading}>{isEn ? "Categories" : "Kategoriler"}</div>
            <ul>
              {categories.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <div className={styles.heading}>{isEn ? "My account" : "Hesabım"}</div>
            <ul>
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <div className={styles.heading}>{isEn ? "About" : "Hakkımızda"}</div>
            <ul>
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <span>© {year} {brandName}</span>
            <span className={styles.muted}>{isEn ? "All rights reserved." : "Tüm hakları saklıdır."}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
