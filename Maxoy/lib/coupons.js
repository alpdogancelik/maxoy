import { COUPON_DEFINITIONS } from "../constants/coupons";
import { getPriceForMode } from "./productUtils";

export const normalizeCouponCode = (code = "") =>
  String(code || "").trim().toUpperCase();

export const findCoupon = (code = "") => {
  const normalized = normalizeCouponCode(code);
  return COUPON_DEFINITIONS.find((coupon) => coupon.code === normalized) || null;
};

export const isCouponExpired = (coupon, now = new Date()) => {
  if (!coupon?.expiresAt) return false;
  const expiry = new Date(coupon.expiresAt);
  return Number.isNaN(expiry.getTime()) ? false : expiry < now;
};

export const getDiscountableSubtotal = ({
  cartItems = [],
  pricingMode = "retail",
  coupon = null,
}) => {
  if (!coupon?.categories?.length) {
    return cartItems.reduce(
      (sum, item) => sum + getPriceForMode(item, pricingMode) * (item.quantity || 0),
      0
    );
  }

  const categories = coupon.categories;
  return cartItems.reduce((sum, item) => {
    const itemCategory = item.category || "";
    const itemMain = item.mainCode || (itemCategory ? itemCategory.charAt(0) : "");
    const matches = categories.some((cat) =>
      cat.length === 1 ? cat === itemMain : cat === itemCategory
    );
    if (!matches) return sum;
    return sum + getPriceForMode(item, pricingMode) * (item.quantity || 0);
  }, 0);
};

export const calculateCouponDiscount = ({
  coupon,
  cartItems = [],
  pricingMode = "retail",
}) => {
  if (!coupon) return 0;
  if (coupon.type === "free_shipping") return 0;
  const discountableSubtotal = getDiscountableSubtotal({ cartItems, pricingMode, coupon });
  if (discountableSubtotal <= 0) return 0;
  if (coupon.type === "percentage") {
    return (discountableSubtotal * (coupon.value || 0)) / 100;
  }
  if (coupon.type === "fixed") {
    return Math.min(discountableSubtotal, coupon.value || 0);
  }
  return 0;
};

export const validateCoupon = ({
  code = "",
  cartItems = [],
  pricingMode = "retail",
  subtotal = 0,
  now = new Date(),
}) => {
  const coupon = findCoupon(code);
  if (!coupon) {
    return { valid: false, reason: "not_found" };
  }
  if (isCouponExpired(coupon, now)) {
    return { valid: false, reason: "expired", coupon };
  }
  if (coupon.minTotal && subtotal < coupon.minTotal) {
    return { valid: false, reason: "min_total", coupon };
  }

  if (coupon.categories?.length) {
    const discountableSubtotal = getDiscountableSubtotal({ cartItems, pricingMode, coupon });
    if (discountableSubtotal <= 0) {
      return { valid: false, reason: "not_applicable", coupon };
    }
  }

  return { valid: true, coupon };
};
