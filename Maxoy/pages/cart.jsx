import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../styles/cartPage.module.scss";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import { formatPrice, getPriceForMode, getProductMainImage } from "../lib/productUtils";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { TiDeleteOutline } from "react-icons/ti";
import EmptyState from "../components/feedback/EmptyState";
import { buildWhatsappOrderMessage, buildWhatsappLink } from "../lib/whatsapp";

const CartPage = () => {
  const {
    cartItems,
    toggleCartItemQuanitity,
    onRemove,
    language,
    currency,
    pricingMode,
    cartTotals,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    authInfo,
    selectedAddress,
  } = useStateContext();
  const [couponCode, setCouponCode] = useState("");

  const handleCouponApply = () => {
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponCode("");
    }
  };

  const handleWhatsapp = () => {
    const customerName = authInfo?.session?.fullName || authInfo?.registration?.fullName;
    const customerPhone = authInfo?.registration?.phone || authInfo?.login?.phone || "";
    const message = buildWhatsappOrderMessage({
      language,
      items: cartItems,
      currency,
      pricingMode,
      customer: { name: customerName, phone: customerPhone },
      address: selectedAddress,
      totals: {
        subtotal: cartTotals?.subtotal,
        discountTotal: cartTotals?.discountTotal,
        shippingCost: cartTotals?.shippingCost,
        total: cartTotals?.total,
      },
    });
    const url = buildWhatsappLink({ text: message });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (cartItems.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <EmptyState
          title={t(language, "states.emptyCartTitle")}
          description={t(language, "states.emptyCartBody")}
          actionLabel={t(language, "actions.continueShopping")}
          onAction={() => (window.location.href = "/")}
        />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <h1>{t(language, "cart.title")}</h1>
      <div className={styles.layout}>
        <div className={styles.items}>
          {cartItems.map((item) => (
            <div className={styles.item} key={item.id || item.code}>
              <Image
                src={getProductMainImage(item)}
                alt={item.name || ""}
                width={100}
                height={100}
                className={styles.itemImage}
              />
              <div className={styles.itemInfo}>
                <div className={styles.itemHeader}>
                  <h4>{item.name}</h4>
                  <strong>{formatPrice(getPriceForMode(item, pricingMode), currency, language)}</strong>
                </div>
                <p>{[item.code, item.colorTone, item.sizeInfo].filter(Boolean).join(" � ")}</p>
                <div className={styles.controls}>
                  <div className={styles.quantity}>
                    <button type="button" onClick={() => toggleCartItemQuanitity(item.id || item.code, "dec")}>
                      <AiOutlineMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => toggleCartItemQuanitity(item.id || item.code, "inc")}>
                      <AiOutlinePlus />
                    </button>
                  </div>
                  <button type="button" className={styles.remove} onClick={() => onRemove(item)}>
                    <TiDeleteOutline />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className={styles.summary}>
          <h2>{t(language, "checkout.summaryTitle")}</h2>
          <div className={styles.couponBox}>
            {appliedCoupon ? (
              <div className={styles.couponChip}>
                <span>{appliedCoupon.code}</span>
                <button type="button" onClick={removeCoupon}>
                  &times;
                </button>
              </div>
            ) : (
              <div className={styles.couponField}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t(language, "coupon.placeholder")}
                />
                <button type="button" onClick={handleCouponApply}>
                  {t(language, "coupon.apply")}
                </button>
              </div>
            )}
            {couponError && <small className={styles.error}>{t(language, `coupon.errors.${couponError}`)}</small>}
          </div>
          <div className={styles.lineItem}>
            <span>{t(language, "cart.subtotal")}</span>
            <strong>{formatPrice(cartTotals?.subtotal || 0, currency, language)}</strong>
          </div>
          {cartTotals?.discountTotal > 0 && (
            <div className={styles.lineItem}>
              <span>{t(language, "coupon.discount")}</span>
              <strong>-{formatPrice(cartTotals.discountTotal, currency, language)}</strong>
            </div>
          )}
          <div className={styles.lineItem}>
            <span>{t(language, "checkout.shippingFee")}</span>
            <strong>{formatPrice(cartTotals?.shippingCost || 0, currency, language)}</strong>
          </div>
          <div className={styles.totalRow}>
            <span>{t(language, "checkout.total")}</span>
            <strong>{formatPrice(cartTotals?.total || 0, currency, language)}</strong>
          </div>
          <Link href="/checkout" className={styles.primaryButton}>
            {t(language, "cart.checkout")}
          </Link>
          <button type="button" className={styles.whatsappButton} onClick={handleWhatsapp}>
            {t(language, "cart.whatsappOrder")}
          </button>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
