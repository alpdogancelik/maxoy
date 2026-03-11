import React, { useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./StickyBar.module.scss";
import { useStateContext } from "@/context/StateContext";
import { formatPrice } from "@/lib/productUtils";
import { t } from "@/constants/i18n";
import { CATALOG_PAGE_LIST } from "@/constants/catalogPages";

const StickyBar = () => {
  const router = useRouter();
  const {
    cartTotals,
    totalQuantities,
    currency,
    language,
    setShowCart,
  } = useStateContext();

  const pathname = router.pathname;
  const isCartPage = pathname === "/cart";
  const isCheckoutPage = pathname === "/checkout";
  const isProductPage = pathname.startsWith("/product");
  const isCatalogPage = CATALOG_PAGE_LIST.some((page) => page.slug === pathname);
  const isListPage =
    pathname === "/" || pathname.startsWith("/category") || pathname === "/search" || isCatalogPage;

  const visible = (isProductPage || isListPage || isCartPage) && !isCheckoutPage;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (visible) {
      root.style.setProperty("--sticky-bar-height", "9.4rem");
    } else {
      root.style.removeProperty("--sticky-bar-height");
    }
  }, [visible]);

  if (!visible) return null;

  const subtotal = cartTotals?.discountedSubtotal ?? cartTotals?.subtotal ?? 0;
  const formattedSubtotal = formatPrice(subtotal, currency, language);

  return (
    <div className={styles.sticky}>
      <div className={styles.summary}>
        <span>{t(language, "cart.subtotal")}</span>
        <strong>{formattedSubtotal}</strong>
        <small>{t(language, "cart.itemsCount", { count: totalQuantities })}</small>
      </div>

      <div className={styles.actions}>
        {!isCartPage && (
          <button type="button" className={styles.secondary} onClick={() => setShowCart(true)}>
            {t(language, "cart.title")}
          </button>
        )}
        <button
          type="button"
          className={styles.primary}
          onClick={() => router.push("/checkout")}
          disabled={totalQuantities === 0}
        >
          {t(language, "cart.checkout")}
        </button>
      </div>
    </div>
  );
};

export default StickyBar;
