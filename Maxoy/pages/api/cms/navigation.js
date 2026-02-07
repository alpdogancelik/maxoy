import { createId, getNavigation, saveNavigation } from "../../../lib/cms/store";

const isValidItem = (item) => {
  if (!item || typeof item !== "object") return false;
  if (!item.label || !item.href) return false;
  if (item.children && !Array.isArray(item.children)) return false;
  return true;
};

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      const navigation = getNavigation();
      const { locale } = req.query || {};
      if (locale) {
        const entry = navigation.find((nav) => nav.locale === locale);
        return res
          .status(200)
          .json(entry || { id: createId("nav"), locale, items: [], updatedAt: "" });
      }
      return res.status(200).json(navigation);
    }

    if (req.method === "PUT") {
      const payload = req.body || {};
      if (!payload.locale) {
        return res.status(400).json({ error: "Locale is required." });
      }
      if (!Array.isArray(payload.items)) {
        return res.status(400).json({ error: "Items must be an array." });
      }
      const invalid = payload.items.find((item) => !isValidItem(item));
      if (invalid) {
        return res.status(400).json({ error: "Each item must include label and href." });
      }

      const navigation = getNavigation();
      const now = new Date().toISOString();
      const index = navigation.findIndex((nav) => nav.locale === payload.locale);
      const nextEntry = {
        id: payload.id || (index !== -1 ? navigation[index].id : createId("nav")),
        locale: payload.locale,
        items: payload.items,
        updatedAt: now,
      };

      if (index === -1) {
        navigation.push(nextEntry);
      } else {
        navigation[index] = nextEntry;
      }
      saveNavigation(navigation);
      return res.status(200).json(nextEntry);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
