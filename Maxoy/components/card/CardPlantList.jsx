import React from "react";
import styles from "./Card.module.scss";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { AiFillHeart, AiOutlineHeart, AiOutlinePlus } from "react-icons/ai";
import { useStateContext } from "../../context/StateContext";
import SmartImage from "../ui/SmartImage";
import HighlightText from "../ui/HighlightText";
import {
  buildWhatsappProductMessage,
  formatPrice,
  getLocalizedField,
  getPriceForMode,
  getProductMainImage,
} from "../../lib/productUtils";
import { WHATSAPP_NUMBER } from "../../constants/contact";
import { t } from "../../constants/i18n";

const CardPlantList = ({ product, highlightQuery = "" }) => {
  const {
    onAdd,
    toggleFavorite,
    isFavorite,
    language,
    currency,
    pricingMode,
  } = useStateContext();

  if (!product) return null;

  const { slug, name, summary, tags, code, stock, minStock } = product;
  const imageUrl = getProductMainImage(product);
  const linkHref = slug?.current || code || name || "#";
  const nameText = getLocalizedField(product, "name", language) || name || t(language, "misc.unnamed");
  const summaryText = getLocalizedField(product, "summary", language) || summary || "";
  const priceValue = getPriceForMode(product, pricingMode);
  const formattedPrice = formatPrice(priceValue, currency, language);
  const priceModeLabel =
    pricingMode === "wholesale"
      ? t(language, "product.priceModeWholesale")
      : pricingMode === "vip"
        ? t(language, "product.priceModeVip")
        : t(language, "product.priceModeRetail");
  const stockValue = Number(stock || 0);
  const minStockValue = Number(minStock || 0);
  const stockStatus =
    stockValue <= 0
      ? "out"
      : minStockValue > 0 && stockValue <= minStockValue
        ? "low"
        : "in";

  const handleQuickAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (stockValue <= 0) return;
    onAdd(product, 1);
  };

  const handleWhatsapp = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const message = buildWhatsappProductMessage({
      language,
      product,
      currency,
      pricingMode,
      quantity: 1,
    });
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <>
      <Link href={`/product/${linkHref}`}>
        <div className={styles["card__container"]}>
          <div className={styles["card__image"]}>
            <SmartImage
              src={imageUrl}
              alt={nameText}
              width={320}
              height={240}
              className={styles.image}
              sizes="(max-width: 768px) 90vw, 280px"
            />
          </div>
          <div className={styles["details-container"]}>
            <div className={styles["details__container"]}>
              <p>
                <HighlightText text={nameText} query={highlightQuery} />
              </p>
              <p>{formattedPrice}</p>
            </div>
            <div className={styles.priceMode}>{priceModeLabel}</div>
            <div className={styles["card__summary"]}>
              <HighlightText text={summaryText} query={highlightQuery} />
            </div>
            <div className={styles.metaRow}>
              <span className={styles.sku}>{t(language, "product.sku")}: {code || "-"}</span>
              <span
                className={`${styles.stockBadge} ${styles[`stock-${stockStatus}`]}`}
              >
                {stockStatus === "out"
                  ? t(language, "product.outOfStock")
                  : stockStatus === "low"
                    ? t(language, "product.lowStock")
                    : t(language, "product.inStock")}
              </span>
            </div>
            {product.variants?.length > 1 && (
              <div className={styles.variantNote}>
                {t(language, "product.variants")}: {product.variants.length}
              </div>
            )}
            <div className={styles.shippingHint}>{t(language, "product.shippingHint")}</div>
            {(product.minOrderQty || product.packQty) && (
              <div className={styles.minInfo}>
                {product.minOrderQty && (
                  <span>{t(language, "product.minOrder")}: {product.minOrderQty}</span>
                )}
                {product.packQty && (
                  <span>{t(language, "product.packQty")}: {product.packQty}</span>
                )}
              </div>
            )}
          </div>
          <span className={styles["card__tag"]}>{tags && tags[0]}</span>
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.quickAdd}
              onClick={handleQuickAdd}
              disabled={stockValue <= 0}
            >
              <AiOutlinePlus />
              {t(language, "actions.addToCart")}
            </button>
            <button
              type="button"
              className={styles.whatsapp}
              onClick={handleWhatsapp}
            >
              <FaWhatsapp />
              {t(language, "product.whatsappAsk")}
            </button>
            <button
              type="button"
              className={styles.favorite}
              onClick={handleFavorite}
            >
              {isFavorite(product) ? <AiFillHeart /> : <AiOutlineHeart />}
              {t(language, "product.favorite")}
            </button>
          </div>
        </div>
      </Link>
    </>
  );
};

export default CardPlantList;
