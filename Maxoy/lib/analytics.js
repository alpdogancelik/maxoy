const isDebugMode = () => {
  if (typeof process === "undefined") return false;
  return process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1";
};

export const trackEvent = (event, payload = {}) => {
  if (typeof window === "undefined") return;
  const detail = { event, payload, ts: Date.now() };
  if (isDebugMode()) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", detail);
  }
  window.dispatchEvent(new CustomEvent("analytics", { detail }));
};

export const analytics = {
  viewItem: (payload) => trackEvent("view_item", payload),
  viewItemList: (payload) => trackEvent("view_item_list", payload),
  addToCart: (payload) => trackEvent("add_to_cart", payload),
  removeFromCart: (payload) => trackEvent("remove_from_cart", payload),
  beginCheckout: (payload) => trackEvent("begin_checkout", payload),
  addShippingInfo: (payload) => trackEvent("add_shipping_info", payload),
  addPaymentInfo: (payload) => trackEvent("add_payment_info", payload),
  purchase: (payload) => trackEvent("purchase", payload),
};
