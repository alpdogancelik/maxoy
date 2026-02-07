// Mock client - Sanity kaldırıldı, custom admin panel kullanılacak

export const client = null;

export const urlFor = (source) => {
  if (typeof source === "string") return source;
  if (source && source.url) return source.url;
  if (source && source.asset && source.asset.url) return source.asset.url;
  return "/placeholder-product.png";
};
