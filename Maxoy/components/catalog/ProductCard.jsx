import React, { useMemo } from "react";
import Link from "next/link";

import styles from "./ProductCard.module.scss";
import { formatPrice, getPriceForMode, getProductMainImage, toNumber } from "@/lib/productUtils";

function getVariantLabel(product, language) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length <= 1) return null;

  const colors = new Set(
    variants
      .map((v) => String(v?.colorTone || "").trim())
      .filter(Boolean)
      .map((x) => x.toLowerCase())
  );
  const count = colors.size || variants.length;

  if (language === "en") return `${count} variants`;
  return colors.size ? `${count} Renk` : `${count} Varyant`;
}

const ProductCard = ({ product, brandName, language, currency, pricingMode, view = "grid" }) => {
  const name =
    (language === "en" ? product?.nameEN : product?.nameTR) ||
    product?.name ||
    (language === "en" ? "Product" : "Ürün");

  const slug = product?.slug?.current || product?.code || product?.id || "";
  const href = slug ? `/product/${slug}` : "#";
  const image = getProductMainImage(product) || "/placeholder-product.png";

  const discountPercent = Number(product?.discountPercent || 0);
  const currentPriceValue = getPriceForMode(product, pricingMode);
  const currentPriceText = formatPrice(currentPriceValue, currency, language);

  const basePrice = useMemo(() => {
    const tiers = product?.priceTiers || {};
    const tier = toNumber(tiers?.[pricingMode], 0);
    const fallback = toNumber(product?.price, 0);
    return tier || fallback;
  }, [pricingMode, product]);

  const showOld = Number.isFinite(basePrice) && basePrice > 0 && basePrice > Number(currentPriceValue || 0);
  const oldPriceText = showOld ? formatPrice(basePrice, currency, language) : null;
  const variantLabel = getVariantLabel(product, language);

  return (
    <Link
      href={href}
      className={`${styles.card} ${view === "list" ? styles.cardList : ""}`}
      aria-label={name}
    >
      <div className={styles.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} loading="lazy" decoding="async" />
        {discountPercent > 0 ? <div className={styles.discount}>%{discountPercent}</div> : null}
      </div>

      <div className={styles.body}>
        <div className={styles.brand}>{brandName}</div>
        <div className={styles.title}>{name}</div>

        <div className={styles.prices}>
          {oldPriceText ? <div className={styles.oldPrice}>{oldPriceText}</div> : null}
          <div className={styles.price}>{currentPriceText}</div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.kdv}>{language === "en" ? "VAT included" : "KDV dahil"}</span>
          {variantLabel ? <span className={styles.variant}>{variantLabel}</span> : null}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
