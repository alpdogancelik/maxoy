export const BRAND_CONFIG = {
  brandName: "Maxoy",
  supportEmail: "destek@maxoy.com",
  supportPhone: "+90 850 000 00 00",
  whatsappPhone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "905XXXXXXXXX",
  address: "Adres bilginiz burada yer alacak.",
};

export const getBrandValue = (value, fallback = "") => value || fallback;

export const getWhatsAppNumber = () => {
  const raw = BRAND_CONFIG.whatsappPhone || "";
  return String(raw).replace(/\D/g, "");
};
