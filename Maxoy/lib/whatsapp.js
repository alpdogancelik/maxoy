import { t } from "../constants/i18n";
import { getWhatsAppNumber } from "../constants/brand";
import { formatPrice, getLocalizedField, getPriceForMode } from "./productUtils";

export const buildWhatsappOrderMessage = ({
  language = "tr",
  items = [],
  currency = "TRY",
  pricingMode = "retail",
  customer = {},
  address = null,
  totals = {},
} = {}) => {
  const lines = [t(language, "whatsapp.orderIntro")];
  lines.push(t(language, "whatsapp.itemsTitle"));

  items.forEach((item) => {
    const name = getLocalizedField(item, "name", language) || item.name || "";
    const sku = item.code || item.productCode || "-";
    const unitPrice = getPriceForMode(item, pricingMode);
    const lineTotal = unitPrice * (item.quantity || 0);
    lines.push(
      `- ${name} (${sku}) x${item.quantity} • ${formatPrice(unitPrice, currency, language)} • ${formatPrice(
        lineTotal,
        currency,
        language
      )}`
    );
  });

  lines.push("");
  if (totals.subtotal != null) {
    lines.push(`${t(language, "whatsapp.subtotal")}: ${formatPrice(totals.subtotal, currency, language)}`);
  }
  if (totals.discountTotal) {
    lines.push(`${t(language, "whatsapp.discount")}: -${formatPrice(totals.discountTotal, currency, language)}`);
  }
  if (totals.shippingCost != null) {
    lines.push(`${t(language, "whatsapp.shipping")}: ${formatPrice(totals.shippingCost, currency, language)}`);
  }
  if (totals.total != null) {
    lines.push(`${t(language, "whatsapp.total")}: ${formatPrice(totals.total, currency, language)}`);
  }

  if (customer?.name || customer?.phone) {
    lines.push("");
    lines.push(`${t(language, "whatsapp.customerTitle")}:`);
    if (customer.name) lines.push(`- ${customer.name}`);
    if (customer.phone) lines.push(`- ${customer.phone}`);
  }

  if (address) {
    const snippet = [address.addressLine, address.district, address.city]
      .filter(Boolean)
      .join(" / ");
    if (snippet) {
      lines.push("");
      lines.push(`${t(language, "whatsapp.addressTitle")}:`);
      lines.push(`- ${snippet}`);
    }
  }

  lines.push("");
  lines.push(t(language, "whatsapp.footer"));

  return lines.join("\n");
};

export const buildWhatsappLink = ({ phone, text } = {}) => {
  const safePhone = phone ? String(phone).replace(/\D/g, "") : getWhatsAppNumber();
  const encoded = encodeURIComponent(text || "");
  const query = safePhone ? `phone=${safePhone}&text=${encoded}` : `text=${encoded}`;
  return `whatsapp://send?${query}`;
};
