import { SHIPPING_RULES, DEFAULT_CARRIER } from "../constants/shipping";

const normalizeCity = (value = "") => {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/i/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "")
    .trim();
};

export const getRegionForCity = (city = "") => {
  if (!city) return null;
  const normalized = normalizeCity(city);
  if (!normalized) return null;
  return (
    SHIPPING_RULES.regions.find((region) =>
      region.cities.some((name) => normalizeCity(name) === normalized)
    ) || null
  );
};

export const calculateShipping = ({
  subtotal = 0,
  address = {},
  coupon = null,
  selectedCarrier = "",
} = {}) => {
  const region = getRegionForCity(address?.city);
  const carrierOptions = region?.carriers?.length
    ? region.carriers
    : [DEFAULT_CARRIER];
  const resolvedCarrier = carrierOptions.includes(selectedCarrier)
    ? selectedCarrier
    : carrierOptions[0];
  const threshold = SHIPPING_RULES.freeShippingThreshold;
  const freeByCoupon = coupon?.type === "free_shipping";
  const isFree = freeByCoupon || subtotal >= threshold;
  const fee = isFree ? 0 : SHIPPING_RULES.baseFee;
  const remainingForFree = Math.max(0, threshold - subtotal);

  return {
    region,
    carrierOptions,
    carrier: resolvedCarrier,
    threshold,
    remainingForFree,
    isFree,
    fee,
    etaDays: region?.etaDays || [2, 3],
  };
};
