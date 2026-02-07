import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/checkoutPage.module.scss";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import AddressForm from "../components/address/AddressForm";
import AddressCard from "../components/address/AddressCard";
import EmptyState from "../components/feedback/EmptyState";
import { formatPrice } from "../lib/productUtils";
import getStripe from "../lib/getStripe";
import { buildWhatsappOrderMessage, buildWhatsappLink } from "../lib/whatsapp";
import { analytics } from "../lib/analytics";

const CheckoutPage = () => {
  const {
    language,
    currency,
    cartItems,
    cartTotals,
    addresses,
    selectedAddress,
    selectedAddressId,
    setSelectedAddressId,
    addAddress,
    customerType,
    setCustomerType,
    invoiceInfo,
    setInvoiceInfo,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    selectedCarrier,
    setSelectedCarrier,
    authInfo,
    pricingMode,
  } = useStateContext();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const didBegin = useRef(false);

  const shipping = cartTotals?.shipping;
  const carrierOptions = shipping?.carrierOptions || [];

  useEffect(() => {
    if (didBegin.current) return;
    if (cartItems.length === 0) return;
    analytics.beginCheckout({
      items: cartItems.map((item) => ({ id: item.id || item.code, quantity: item.quantity })),
      value: cartTotals?.total,
      currency,
    });
    didBegin.current = true;
  }, [cartItems, cartTotals?.total, currency]);

  useEffect(() => {
    if (!selectedAddress) return;
    analytics.addShippingInfo({
      address: {
        city: selectedAddress.city,
        district: selectedAddress.district,
      },
      carrier: shipping?.carrier,
    });
  }, [selectedAddress, shipping?.carrier]);

  const handleCouponApply = () => {
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponCode("");
    }
  };

  const handleCheckout = async () => {
    if (!cartItems.length || !selectedAddress) return;
    setLoading(true);
    analytics.addPaymentInfo({ value: cartTotals?.total, currency });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "maxoy-last-order",
        JSON.stringify({
          items: cartItems.map((item) => ({
            id: item.id || item.code,
            name: item.name,
            quantity: item.quantity,
          })),
          totals: cartTotals,
          currency,
        })
      );
    }
    const stripe = await getStripe();
    const payload = {
      items: cartItems,
      checkout: {
        customerType,
        invoiceInfo,
        address: selectedAddress,
        coupon: appliedCoupon,
        shipping,
      },
    };
    const response = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setLoading(false);
    if (data?.id) {
      stripe.redirectToCheckout({ sessionId: data.id });
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
      customer: {
        name: customerName,
        phone: customerPhone,
      },
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
      <div className={styles.header}>
        <h1>{t(language, "checkout.title")}</h1>
        <p>{t(language, "checkout.subtitle")}</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.left}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{t(language, "checkout.addressTitle")}</h2>
              <button type="button" onClick={() => setShowAddressForm((prev) => !prev)}>
                {t(language, "address.addNew")}
              </button>
            </div>

            {showAddressForm && (
              <AddressForm
                onSubmit={(values) => {
                  addAddress(values);
                  setShowAddressForm(false);
                }}
                onCancel={() => setShowAddressForm(false)}
                submitLabel={t(language, "actions.save")}
              />
            )}

            {addresses.length === 0 && !showAddressForm ? (
              <EmptyState
                title={t(language, "address.emptyTitle")}
                description={t(language, "address.emptyBody")}
                actionLabel={t(language, "address.addNew")}
                onAction={() => setShowAddressForm(true)}
              />
            ) : (
              <div className={styles.addressGrid}>
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    selected={address.id === selectedAddressId}
                    onSelect={() => setSelectedAddressId(address.id)}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2>{t(language, "checkout.customerType")}</h2>
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={customerType === "personal" ? styles.active : ""}
                onClick={() => setCustomerType("personal")}
              >
                {t(language, "checkout.personal")}
              </button>
              <button
                type="button"
                className={customerType === "corporate" ? styles.active : ""}
                onClick={() => setCustomerType("corporate")}
              >
                {t(language, "checkout.corporate")}
              </button>
            </div>

            {customerType === "corporate" && (
              <div className={styles.corporateFields}>
                <label>
                  <span>{t(language, "cart.companyName")}</span>
                  <input
                    type="text"
                    value={invoiceInfo.companyName}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, companyName: e.target.value })}
                  />
                </label>
                <label>
                  <span>{t(language, "cart.taxOffice")}</span>
                  <input
                    type="text"
                    value={invoiceInfo.taxOffice}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxOffice: e.target.value })}
                  />
                </label>
                <label>
                  <span>{t(language, "cart.taxNumber")}</span>
                  <input
                    type="text"
                    value={invoiceInfo.taxNumber}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxNumber: e.target.value })}
                  />
                </label>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2>{t(language, "checkout.shippingTitle")}</h2>
            <div className={styles.shippingRow}>
              <div>
                <strong>{t(language, "checkout.shippingEta")}</strong>
                <p>
                  {shipping?.etaDays?.[0]}-{shipping?.etaDays?.[1]} {t(language, "checkout.businessDays")}
                </p>
              </div>
              {carrierOptions.length > 0 && (
                <label>
                  <span>{t(language, "checkout.carrier")}</span>
                  <select
                    value={shipping?.carrier || selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                  >
                    {carrierOptions.map((carrier) => (
                      <option key={carrier} value={carrier}>
                        {carrier}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>
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

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleCheckout}
            disabled={!selectedAddress || loading}
          >
            {loading ? t(language, "misc.redirecting") : t(language, "checkout.payNow")}
          </button>
          <button type="button" className={styles.whatsappButton} onClick={handleWhatsapp}>
            {t(language, "cart.whatsappOrder")}
          </button>
        </aside>
      </div>
    </div>
    );
  };

export default CheckoutPage;
