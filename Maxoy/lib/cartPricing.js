import { getPriceForMode } from "./productUtils";
import { calculateCouponDiscount } from "./coupons";
import { calculateShipping } from "./shipping";

export const calculateCartSubtotal = ({ cartItems = [], pricingMode = "retail" }) =>
  cartItems.reduce(
    (sum, item) => sum + getPriceForMode(item, pricingMode) * (item.quantity || 0),
    0
  );

export const buildCartTotals = ({
  cartItems = [],
  pricingMode = "retail",
  coupon = null,
  address = null,
  selectedCarrier = "",
} = {}) => {
  const subtotal = calculateCartSubtotal({ cartItems, pricingMode });
  const discountTotal = coupon
    ? calculateCouponDiscount({ coupon, cartItems, pricingMode })
    : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountTotal);
  const shipping = calculateShipping({
    subtotal: discountedSubtotal,
    address,
    coupon,
    selectedCarrier,
  });
  const total = discountedSubtotal + (shipping?.fee || 0);

  return {
    subtotal,
    discountTotal,
    discountedSubtotal,
    shippingCost: shipping?.fee || 0,
    shipping,
    total,
  };
};
