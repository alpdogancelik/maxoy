const REQUIRED_FIELDS = ["name", "phone", "city", "district", "addressLine"];

export const createEmptyAddress = () => ({
  id: "",
  name: "",
  phone: "",
  city: "",
  district: "",
  addressLine: "",
  postalCode: "",
  company: "",
  taxNo: "",
  isDefault: false,
});

export const normalizePhone = (value = "") => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length > 10) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
};

export const formatPhoneTR = (value = "") => {
  const digits = normalizePhone(value);
  if (!digits) return "";
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);
  return `+90 ${parts[0] || ""}${parts[1] ? ` ${parts[1]}` : ""}${parts[2] ? ` ${parts[2]}` : ""}${parts[3] ? ` ${parts[3]}` : ""}`.trim();
};

export const validateAddress = (address = {}) => {
  const errors = {};
  REQUIRED_FIELDS.forEach((field) => {
    if (!address?.[field] || String(address[field]).trim().length === 0) {
      errors[field] = "required";
    }
  });

  const phoneDigits = normalizePhone(address?.phone || "");
  if (address?.phone && phoneDigits.length !== 10) {
    errors.phone = "invalid";
  }

  if (address?.postalCode && String(address.postalCode).length < 4) {
    errors.postalCode = "invalid";
  }

  if (address?.taxNo && String(address.taxNo).length < 5) {
    errors.taxNo = "invalid";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const buildAddressLabel = (address = {}) => {
  const parts = [address.name, address.city, address.district].filter(Boolean);
  return parts.join(" · ") || "Adres";
};

export const mergeAddress = (base = {}, updates = {}) => ({
  ...base,
  ...updates,
  phone: updates.phone ?? base.phone,
});
