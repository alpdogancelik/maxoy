import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { TiDeleteOutline } from "react-icons/ti";
import { motion, useReducedMotion } from "framer-motion";
import { useStateContext } from "@/context/StateContext";
import styles from "./Cart.module.scss";
import {
  buildWhatsappQuoteMessage,
  formatPrice,
  getPriceForMode,
  getProductMainImage,
} from "@/lib/productUtils";
import { buildWhatsappOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";
import { t } from "@/constants/i18n";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

const Cart = () => {
  const cartOverlayRef = useRef(null);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const router = useRouter();
  const {
    totalPrice,
    totalQuantities,
    cartItems,
    setShowCart,
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
    invoiceInfo,
  } = useStateContext();
  const [couponCode, setCouponCode] = useState("");
  const shouldReduceMotion = useReducedMotion();

  useBodyScrollLock(true);

  const isEn = language === "en";
  const closeCart = () => setShowCart(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus?.();
  }, []);

  const trapFocus = (e) => {
    if (e.key !== "Tab") return;
    const root = panelRef.current;
    if (!root) return;
    const focusable = root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const getImageUrl = (item) => getProductMainImage(item);

  const handleCheckOut = () => {
    closeCart();
    router.push("/checkout");
  };

  const handleCouponApply = () => {
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim());
    if (result.success) setCouponCode("");
  };

  const handleWhatsAppOrder = () => {
    const customerName =
      authInfo?.session?.fullName || authInfo?.registration?.fullName;
    const customerPhone =
      authInfo?.registration?.phone || authInfo?.login?.phone || "";
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

  const handleQuoteRequest = () => {
    const message = buildWhatsappQuoteMessage({
      language,
      items: cartItems,
      currency,
      pricingMode,
      invoiceInfo,
    });
    const url = buildWhatsappLink({ text: message });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const wholesaleRelevant = cartItems.some(
    (item) => item.minOrderQty || item.packQty || item.priceTiers?.wholesale
  );

  const hasMinOrderIssue = cartItems.some((item) => {
    if (!item.minOrderQty) return false;
    return item.quantity < Number(item.minOrderQty);
  });

  const shipping = cartTotals?.shipping;
  const remaining = shipping?.remainingForFree || 0;
  const progressMessage = shipping?.isFree
    ? t(language, "shipping.free")
    : remaining > 0
      ? t(language, "shipping.progress", {
          amount: formatPrice(remaining, currency, language),
        })
      : t(language, "shipping.free");

  return (
    <motion.div
      className={styles["cart-wrapper"]}
      ref={cartOverlayRef}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === cartOverlayRef.current) closeCart();
      }}
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
    >
      <motion.div
        className={styles["cart-container"]}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? "Cart drawer" : "Sepet çekmecesi"}
        onKeyDown={trapFocus}
        initial={shouldReduceMotion ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={shouldReduceMotion ? { x: 0 } : { x: "100%" }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            {isEn ? "Cart" : "Sepetim"}{" "}
            <span className={styles.drawerCount}>({totalQuantities})</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label={isEn ? "Close cart" : "Sepeti kapat"}
            ref={closeButtonRef}
          >
            ×
          </button>
        </div>

        {cartItems.length < 1 && (
          <div className={styles["empty-cart"]}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none">
                <path
                  d="M14 18h6l4 28h24l5-20H24"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M27 52a3 3 0 100 6 3 3 0 000-6zM47 52a3 3 0 100 6 3 3 0 000-6z"
                  stroke="currentColor"
                  strokeWidth="3.2"
                />
              </svg>
            </div>
            <h3>{isEn ? "Your cart is empty" : "Sepetiniz boş"}</h3>
            <p>
              {isEn
                ? "Start shopping to add products to your cart."
                : "Sepetinize ürün eklemek için alışverişe başlayın."}
            </p>
            <button
              type="button"
              onClick={() => {
                closeCart();
                router.push("/tum-urunler");
              }}
              className={styles.emptyCta}
            >
              {isEn ? "Start shopping" : "ALIŞVERİŞE BAŞLA"}
            </button>
          </div>
        )}

        <div className={styles["product-container"]}>
          {cartItems.length >= 1 &&
            cartItems.map((item) => {
              const itemKey = item.id || item.code || item.productCode;
              return (
                <div className={styles.product} key={itemKey}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(item)}
                    className={styles["cart-product-image"]}
                    alt={item.name}
                  />

                  <div className={styles["item-desc"]}>
                    <div className={`${styles.flex} ${styles.top}`}>
                      <h5>{item.name}</h5>
                      <h4>
                        {formatPrice(
                          getPriceForMode(item, pricingMode),
                          currency,
                          language
                        )}
                      </h4>
                    </div>
                    <p>
                      {[item.code, item.colorTone, item.sizeInfo]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    <div className={`${styles.flex} ${styles.bottom}`}>
                      <div>
                        <div className={styles["quantity-desc"]}>
                          <span
                            className={styles.minus}
                            onClick={() =>
                              toggleCartItemQuanitity(
                                item.id || item.code,
                                "dec"
                              )
                            }
                          >
                            <AiOutlineMinus />
                          </span>
                          <span className={styles.num}>{item.quantity}</span>
                          <span
                            className={styles.plus}
                            onClick={() =>
                              toggleCartItemQuanitity(
                                item.id || item.code,
                                "inc"
                              )
                            }
                          >
                            <AiOutlinePlus />
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles["remove-item"]}
                        onClick={() => onRemove(item)}
                        aria-label={isEn ? "Remove item" : "Ürünü kaldır"}
                      >
                        <TiDeleteOutline />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {cartItems.length >= 1 && (
          <div className={styles["cart-bottom"]}>
            <div className={styles.total}>
              <h3>{t(language, "cart.subtotal")}:</h3>
              <h3>
                {formatPrice(cartTotals?.subtotal || totalPrice, currency, language)}
              </h3>
            </div>

            <div className={styles.couponBox}>
              {appliedCoupon ? (
                <div className={styles.couponChip}>
                  <span>{appliedCoupon.code}</span>
                  <button type="button" onClick={removeCoupon} aria-label={isEn ? "Remove coupon" : "Kuponu kaldır"}>
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
              {couponError && (
                <small className={styles.error}>
                  {t(language, `coupon.errors.${couponError}`)}
                </small>
              )}
            </div>

            {cartTotals?.discountTotal > 0 && (
              <div className={styles.totalRow}>
                <span>{t(language, "coupon.discount")}</span>
                <strong>
                  -{formatPrice(cartTotals.discountTotal, currency, language)}
                </strong>
              </div>
            )}

            <div className={styles.totalRow}>
              <span>{t(language, "checkout.shippingFee")}</span>
              <strong>{formatPrice(cartTotals?.shippingCost || 0, currency, language)}</strong>
            </div>

            <div className={styles.shippingInfo}>
              <span className={styles.shippingTitle}>{t(language, "cart.shippingTitle")}</span>
              <p>
                {t(language, "cart.shippingEta", {
                  min: shipping?.etaDays?.[0],
                  max: shipping?.etaDays?.[1],
                })}
              </p>
              <small>{progressMessage}</small>
            </div>

            <div className={styles["btn-container"]}>
              <button type="button" className="btn" onClick={handleCheckOut}>
                {t(language, "cart.checkout")}
              </button>
              <button type="button" className={styles.whatsappOrder} onClick={handleWhatsAppOrder}>
                {t(language, "cart.whatsappOrder")}
              </button>
              <button
                type="button"
                className={styles.quoteButton}
                onClick={handleQuoteRequest}
                disabled={!wholesaleRelevant}
              >
                {t(language, "cart.requestQuote")}
              </button>
            </div>

            <div className={styles.trustLine}>{t(language, "cart.trustLine")}</div>
            {wholesaleRelevant && hasMinOrderIssue && (
              <p className={styles.minOrderNote}>{t(language, "cart.minOrderNote")}</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Cart;
