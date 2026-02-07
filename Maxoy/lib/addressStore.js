const ADDRESS_STORAGE_KEY = "maxoy-addresses";

export const loadAddresses = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse stored addresses");
    return [];
  }
};

export const saveAddresses = (addresses = []) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
};

export const generateAddressId = () => `addr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
