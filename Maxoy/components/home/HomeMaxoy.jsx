import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import styles from "./HomeMaxoy.module.scss";
import { useStateContext } from "@/context/StateContext";

const pickLang = (language, tr, en) => (language === "en" ? en : tr);

export default function HomeMaxoy({ home, featuredProducts = [] }) {
  const { language } = useStateContext();
  const isEn = language === "en";
  const shouldReduceMotion = useReducedMotion();

  const heroSlides = useMemo(() => {
    const list = home?.heroSlides || [];
    const active = list.filter((s) => s?.isActive !== false);
    return active.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [home]);

  const categoryCards = useMemo(() => {
    const list = home?.categoryCards || [];
    return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [home]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % heroSlides.length), 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const slide = heroSlides[active] || null;
  const heroTitle = slide
    ? pickLang(language, slide.titleTR, slide.titleEN)
    : isEn
      ? "Complete your designs"
      : "Hayalinizdeki tasarımları tamamlayın!";
  const heroSubtitle = slide
    ? pickLang(language, slide.subtitleTR, slide.subtitleEN)
    : isEn
      ? "All flower supplies, one click away."
      : "Tüm çiçek malzemeleri şimdi tek tıkla kapınızda!";
  const ctaText = slide
    ? pickLang(language, slide.ctaTextTR, slide.ctaTextEN)
    : isEn
      ? "Shop now"
      : "Ürünlere Git";
  const ctaLink = slide?.ctaLink || "/tum-urunler";
  const heroImage = slide?.imageUrl || "/hero-image.png";

  const promoTiles = useMemo(() => {
    const fromData = categoryCards.slice(0, 2).map((card) => ({
      title: pickLang(language, card.titleTR, card.titleEN),
      desc: pickLang(language, card.descriptionTR, card.descriptionEN),
      href: card.link || "/tum-urunler",
      image: card.imageUrl || "/yellow-plant.jpg",
    }));
    if (fromData.length >= 2) return fromData;

    const fallback = [
      {
        title: isEn ? "Oasis Types" : "OASIS ÇEŞİTLERİ",
        desc: isEn ? "The solid base of every arrangement." : "Her aranjmanın sağlam temeli.",
        href: "/toptan-cicek-malzemesi-oasis-cesitleri",
        image: "/yellow-plant.jpg",
      },
      {
        title: isEn ? "Ready Products" : "HAZIR ÜRÜNLER",
        desc: isEn ? "Bouquets prepared with care." : "Sevgi ve özenle bir araya gelen buketler.",
        href: "/hazir-urunler",
        image: "/hero-image.png",
      },
    ];

    return [...fromData, ...fallback].slice(0, 2);
  }, [categoryCards, isEn, language]);

  const formatTry = (raw) => {
    const n = Number(String(raw || "").replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return new Intl.NumberFormat(isEn ? "en-US" : "tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(n);
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion ? { duration: 0 } : { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const heroItem = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" },
    },
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroSlide} style={{ backgroundImage: `url(${heroImage})` }}>
          <div className={styles.heroOverlay} />
          <motion.div
            className={`container ${styles.heroContent}`}
            variants={heroVariants}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
          >
            <motion.h1 className={styles.heroTitle} variants={heroItem}>
              {heroTitle}
            </motion.h1>
            {heroSubtitle ? (
              <motion.p className={styles.heroSubtitle} variants={heroItem}>
                {heroSubtitle}
              </motion.p>
            ) : null}
            <motion.div className={styles.heroCtas} variants={heroItem}>
              <Link href={ctaLink} className={styles.primaryBtn}>
                {ctaText}
              </Link>
            </motion.div>

            {heroSlides.length > 1 ? (
              <div className={styles.dots}>
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
                    aria-label={`slide ${i + 1}`}
                    onClick={() => setActive(i)}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
        </div>

        {heroSlides.length > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.navArrow} ${styles.left}`}
              aria-label="previous"
              onClick={() => setActive((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.navArrow} ${styles.right}`}
              aria-label="next"
              onClick={() => setActive((i) => (i + 1) % heroSlides.length)}
            >
              ›
            </button>
          </>
        ) : null}
      </section>

      <section className={styles.tiles}>
        <div className={`container ${styles.tilesGrid}`}>
          {promoTiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className={styles.tile}>
              <div className={styles.tileBg} style={{ backgroundImage: `url(${tile.image})` }} />
              <div className={styles.tileShade} />
              <div className={styles.tileCopy}>
                <div className={styles.tileTitle}>{tile.title}</div>
                {tile.desc ? <div className={styles.tileDesc}>{tile.desc}</div> : null}
                <div className={styles.tileBtn}>{isEn ? "Shop" : "İncele"}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.featured}>
        <div className="container">
          <h2 className={styles.sectionTitle}>{isEn ? "Deals" : "Fırsat Ürünleri"}</h2>
          <div className={styles.productGrid}>
            {featuredProducts.map((p) => {
              const name =
                pickLang(language, p?.nameTR || p?.name, p?.nameEN || p?.name) ||
                (isEn ? "Product" : "Ürün");
              const href = p?.slug?.current
                ? `/product/${p.slug.current}`
                : p?.slug
                  ? `/product/${p.slug}`
                  : p?.code
                    ? `/product/${p.code}`
                    : "#";
              const price = formatTry(p?.priceRetail ?? p?.price ?? p?.priceVip ?? p?.priceWholesale);
              const image = p?.imageUrl || p?.image || "/placeholder-product.png";

              return (
                <Link key={p.id || p._id || href} href={href} className={styles.productCard}>
                  <div className={styles.productImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={name} loading="lazy" decoding="async" />
                  </div>
                  <div className={styles.productMeta}>
                    <div className={styles.productName}>{name}</div>
                    {price ? <div className={styles.productPrice}>{price}</div> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
