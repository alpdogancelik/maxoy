import {
  createId,
  getPages,
  normalizePagePayload,
  normalizeSlug,
  savePages,
  validatePagePayload,
} from "../../../../lib/cms/store";

const parseBool = (value) => value === "1" || value === "true";

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      const pages = getPages();
      const { slug, locale, status, preview } = req.query || {};
      const wantsPreview = parseBool(preview);

      if (slug || locale || status) {
        const normalizedSlug = slug ? normalizeSlug(slug) : null;
        const filtered = pages.filter((page) => {
          if (normalizedSlug && normalizeSlug(page.slug) !== normalizedSlug) return false;
          if (locale && page.locale !== locale) return false;
          if (status && page.status !== status) return false;
          if (!wantsPreview && page.status !== "published") return false;
          return true;
        });

        if (normalizedSlug && locale) {
          return res.status(200).json(filtered[0] || null);
        }

        return res.status(200).json(filtered);
      }

      return res.status(200).json(pages);
    }

    if (req.method === "POST") {
      const payload = normalizePagePayload(req.body || {});
      const errors = validatePagePayload(payload);
      if (Object.keys(errors).length) {
        return res.status(400).json({ error: "Validation failed", details: errors });
      }

      const pages = getPages();
      const duplicate = pages.find(
        (page) =>
          normalizeSlug(page.slug) === payload.slug && page.locale === payload.locale
      );
      if (duplicate) {
        return res.status(409).json({ error: "Slug and locale already exists." });
      }

      const now = new Date().toISOString();
      const nextPage = {
        id: createId("page"),
        slug: payload.slug,
        locale: payload.locale,
        status: payload.status || "draft",
        seo: payload.seo,
        sections: payload.sections,
        createdAt: now,
        updatedAt: now,
        publishedAt: payload.status === "published" ? now : null,
        revisions: [],
        version: 1,
      };

      pages.push(nextPage);
      savePages(pages);
      return res.status(201).json(nextPage);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
