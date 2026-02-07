export const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

export const parseList = (value) => {
  const raw = getQueryValue(value);
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((item) => decodeURIComponent(item.trim()))
    .filter(Boolean);
};

export const parseBool = (value) => {
  const raw = getQueryValue(value);
  return raw === "1" || raw === "true";
};

export const normalizeQuery = (query) => {
  const entries = Object.entries(query || {}).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.join(",") : String(value),
  ]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
};

export const buildShareableLink = (basePath, query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};
