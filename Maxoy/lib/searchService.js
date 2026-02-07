export const fetchSearchSuggestions = async (query, limit = 6, lang = "tr") => {
  if (!query) return [];
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    type: "suggest",
    lang,
  });
  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.items || [];
};
