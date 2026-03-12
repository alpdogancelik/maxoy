import { BASE_CURRENCY, EXCHANGE_RATES, CURRENCY_OPTIONS } from "../constants/currency";
import { WHATSAPP_TEMPLATES } from "../constants/i18n";

export const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [value].filter(Boolean);
};

export const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

export const getLocalizedField = (product, field, lang = "tr") => {
  if (!product) return "";
  if (lang === "en") {
    return (
      product[`${field}En`] ||
      product[`${field}EN`] ||
      product[`${field}_en`] ||
      product[field] ||
      product[`${field}TR`] ||
      ""
    );
  }
  return product[field] || product[`${field}TR`] || "";
};

export const getLocalizedArrayField = (product, field, lang = "tr") => {
  if (!product) return [];
  if (lang === "en") {
    return normalizeArray(product[`${field}En`] || product[`${field}EN`] || product[`${field}_en`] || product[field]);
  }
  return normalizeArray(product[field] || product[`${field}TR`]);
};

export const getProductImages = (product) => {
  if (!product) return [];
  const images = [];
  normalizeArray(product.images).forEach((img) => {
    if (typeof img === "string") images.push(img);
    else if (img?.asset?.url) images.push(img.asset.url);
  });
  if (product.image) {
    if (typeof product.image === "string") images.push(product.image);
    else if (product.image?.asset?.url) images.push(product.image.asset.url);
  }
  const deduped = [...new Set(images.filter(Boolean))];
  return deduped.length ? deduped : ["/placeholder-product.png"];
};

export const getProductMainImage = (product) => getProductImages(product)[0];

export const getVariantGroupKey = (product) => {
  if (!product) return "";
  return (
    product.variantGroup ||
    product.groupCode ||
    product.baseCode ||
    product.parentCode ||
    ""
  );
};

export const getVariantDisplayLabel = (product, lang = "tr") => {
  if (!product) return "";
  return (
    getLocalizedField(product, "variantLabel", lang) ||
    [getLocalizedField(product, "primaryColor", lang), getLocalizedField(product, "secondaryColor", lang)]
      .filter(Boolean)
      .join(" / ") ||
    getLocalizedField(product, "colorTone", lang) ||
    ""
  );
};

export const getPriceForMode = (product, pricingMode = "retail") => {
  if (!product) return 0;
  const basePrice = toNumber(product.price, 0);
  const tiers = product.priceTiers || {};
  const tierPrice = toNumber(tiers[pricingMode], 0);
  const salePrice = toNumber(product.salePrice, 0);
  const discountPercent = toNumber(product.discountPercent, 0);
  let price = tierPrice || basePrice;
  if (salePrice > 0) price = salePrice;
  if (discountPercent > 0) price = price * (1 - discountPercent / 100);
  return price;
};

export const convertPrice = (value, currency = BASE_CURRENCY) => {
  const rate = EXCHANGE_RATES[currency] ?? 1;
  if (currency === BASE_CURRENCY) return value;
  return value * rate;
};

export const formatPrice = (value, currency = BASE_CURRENCY, lang = "tr") => {
  const numeric = toNumber(value, 0);
  const converted = convertPrice(numeric, currency);
  const currencyOption = CURRENCY_OPTIONS.find((c) => c.code === currency);
  const locale = currencyOption?.locale || (lang === "en" ? "en-US" : "tr-TR");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(converted);
};

export const buildSearchText = (product, lang = "tr") => {
  if (!product) return "";
  const fields = [
    getLocalizedField(product, "name", lang),
    getLocalizedField(product, "summary", lang),
    getLocalizedField(product, "details", lang),
    product.code,
    product.productCode,
    product.category,
    product.mainCategory,
    product.variantGroup,
    product.brand,
    product.locationCode,
    ...getLocalizedArrayField(product, "tags", lang),
    ...getLocalizedArrayField(product, "material", lang),
    ...getLocalizedArrayField(product, "usage", lang),
    ...getLocalizedArrayField(product, "packageContents", lang),
    getLocalizedField(product, "colorTone", lang),
    getLocalizedField(product, "sizeInfo", lang),
  ];
  return fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const buildWhatsappCartMessage = ({
  language = "tr",
  items = [],
  currency,
  pricingMode,
  invoiceInfo,
}) => {
  const template = WHATSAPP_TEMPLATES[language] || WHATSAPP_TEMPLATES.tr;
  const lines = [template.cartIntro];
  items.forEach((item) => {
    const price = formatPrice(getPriceForMode(item, pricingMode), currency, language);
    const label = [getLocalizedField(item, "name", language) || item.name, item.code || item.productCode, item.colorTone, item.sizeInfo]
      .filter(Boolean)
      .join(" | ");
    lines.push(`- ${label} x${item.quantity} (${price})`);
  });
  if (invoiceInfo?.companyName || invoiceInfo?.taxNumber) {
    lines.push("");
    lines.push(`${template.invoiceTitle}:`);
    if (invoiceInfo.companyName) lines.push(`- ${invoiceInfo.companyName}`);
    if (invoiceInfo.taxNumber) lines.push(`- ${invoiceInfo.taxNumber}`);
    if (invoiceInfo.taxOffice) lines.push(`- ${invoiceInfo.taxOffice}`);
    if (invoiceInfo.address) lines.push(`- ${invoiceInfo.address}`);
  }
  lines.push(template.footer);
  return lines.join("\n");
};

export const buildWhatsappProductMessage = ({
  language = "tr",
  product,
  currency,
  pricingMode,
  quantity = 1,
}) => {
  const template = WHATSAPP_TEMPLATES[language] || WHATSAPP_TEMPLATES.tr;
  if (!product) return template.footer;
  const price = formatPrice(getPriceForMode(product, pricingMode), currency, language);
  const label = [getLocalizedField(product, "name", language) || product.name, product.code || product.productCode, product.colorTone, product.sizeInfo]
    .filter(Boolean)
    .join(" | ");
  return [
    template.productIntro,
    `- ${label}`,
    `- ${price} x${quantity}`,
    template.footer,
  ].join("\n");
};

export const buildWhatsappQuoteMessage = ({
  language = "tr",
  items = [],
  currency,
  pricingMode,
  invoiceInfo,
}) => {
  const template = WHATSAPP_TEMPLATES[language] || WHATSAPP_TEMPLATES.tr;
  const lines = [template.quoteIntro];
  items.forEach((item) => {
    const price = formatPrice(getPriceForMode(item, pricingMode), currency, language);
    const label = [getLocalizedField(item, "name", language) || item.name, item.code || item.productCode, item.colorTone, item.sizeInfo]
      .filter(Boolean)
      .join(" | ");
    lines.push(`- ${label} x${item.quantity} (${price})`);
  });
  if (invoiceInfo?.companyName || invoiceInfo?.taxNumber) {
    lines.push("");
    lines.push(`${template.invoiceTitle}:`);
    if (invoiceInfo.companyName) lines.push(`- ${invoiceInfo.companyName}`);
    if (invoiceInfo.taxNumber) lines.push(`- ${invoiceInfo.taxNumber}`);
    if (invoiceInfo.taxOffice) lines.push(`- ${invoiceInfo.taxOffice}`);
    if (invoiceInfo.address) lines.push(`- ${invoiceInfo.address}`);
  }
  lines.push(template.footer);
  return lines.join("\n");
};
