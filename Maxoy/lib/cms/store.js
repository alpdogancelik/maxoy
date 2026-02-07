import fs from "fs";
import path from "path";

const CMS_DIR = path.join(process.cwd(), "data", "cms");
const PAGES_PATH = path.join(CMS_DIR, "pages.json");
const SETTINGS_PATH = path.join(CMS_DIR, "global_settings.json");
const NAV_PATH = path.join(CMS_DIR, "navigation.json");

export const DEFAULT_SEO = {
  title: "",
  description: "",
  ogImage: "",
  canonical: "",
  noindex: false,
};

const DEFAULT_GLOBAL_SETTINGS = {
  id: "global",
  updatedAt: "",
  data: {
    siteName: "Maxoy",
    siteUrl: "",
    logoUrl: "",
    whatsapp: "",
    phone: "",
    email: "",
    address: "",
    shippingNote: "",
    returnPolicy: "",
    currency: "TRY",
    footerText: "",
    social: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
  },
};

const DEFAULT_NAVIGATION = [
  {
    id: "nav-tr",
    locale: "tr",
    updatedAt: "",
    items: [
      { id: "nav-tr-home", label: "Anasayfa", href: "/", type: "link" },
      { id: "nav-tr-about", label: "Hakkımızda", href: "/about", type: "link" },
      { id: "nav-tr-contact", label: "İletişim", href: "/contact", type: "link" },
      { id: "nav-tr-quote", label: "Teklif Al", href: "/wholesale", type: "link" },
    ],
  },
  {
    id: "nav-en",
    locale: "en",
    updatedAt: "",
    items: [
      { id: "nav-en-home", label: "Home", href: "/", type: "link" },
      { id: "nav-en-about", label: "About", href: "/about", type: "link" },
      { id: "nav-en-contact", label: "Contact", href: "/contact", type: "link" },
      { id: "nav-en-quote", label: "Get Quote", href: "/wholesale", type: "link" },
    ],
  },
];

function ensureDir() {
  if (!fs.existsSync(CMS_DIR)) {
    fs.mkdirSync(CMS_DIR, { recursive: true });
  }
}

function ensureFile(filePath, defaultValue) {
  ensureDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function normalizeSlug(slug) {
  if (!slug) return "/";
  const trimmed = String(slug).trim();
  if (trimmed === "/") return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

export function normalizeSection(section = {}) {
  return {
    id: section.id || createId("section"),
    type: section.type || "rich_text",
    props: section.props && typeof section.props === "object" ? section.props : {},
  };
}

export function normalizePagePayload(payload = {}) {
  const sections = Array.isArray(payload.sections)
    ? payload.sections.map((section) => normalizeSection(section))
    : [];

  return {
    id: payload.id,
    slug: normalizeSlug(payload.slug || ""),
    locale: payload.locale || "tr",
    status: payload.status || "draft",
    seo: { ...DEFAULT_SEO, ...(payload.seo || {}) },
    sections,
  };
}

export function validatePagePayload(payload) {
  const errors = {};
  if (!payload.slug) {
    errors.slug = "Slug is required.";
  } else {
    if (!payload.slug.startsWith("/")) {
      errors.slug = "Slug must start with '/'.";
    }
    if (payload.slug.includes(" ")) {
      errors.slug = "Slug cannot contain spaces.";
    }
  }

  if (!payload.locale) {
    errors.locale = "Locale is required.";
  }

  if (!["draft", "published"].includes(payload.status)) {
    errors.status = "Status must be draft or published.";
  }

  if (!Array.isArray(payload.sections)) {
    errors.sections = "Sections must be an array.";
  } else {
    payload.sections.forEach((section, index) => {
      if (!section.type) {
        errors[`sections.${index}.type`] = "Section type is required.";
      }
    });
  }

  return errors;
}

export function getPages() {
  return readJson(PAGES_PATH, []);
}

export function savePages(pages) {
  writeJson(PAGES_PATH, pages);
}

export function getGlobalSettings() {
  const settings = readJson(SETTINGS_PATH, DEFAULT_GLOBAL_SETTINGS);
  if (!settings.updatedAt) {
    const next = { ...settings, updatedAt: new Date().toISOString() };
    writeJson(SETTINGS_PATH, next);
    return next;
  }
  return settings;
}

export function saveGlobalSettings(settings) {
  writeJson(SETTINGS_PATH, settings);
}

export function getNavigation() {
  const nav = readJson(NAV_PATH, DEFAULT_NAVIGATION);
  if (Array.isArray(nav)) {
    let changed = false;
    const next = nav.map((entry) => {
      if (entry && !entry.updatedAt) {
        changed = true;
        return { ...entry, updatedAt: new Date().toISOString() };
      }
      return entry;
    });
    if (changed) {
      writeJson(NAV_PATH, next);
      return next;
    }
  }
  return nav;
}

export function saveNavigation(navigation) {
  writeJson(NAV_PATH, navigation);
}

export function getPageBySlug(pages, slug, locale, { preview = false } = {}) {
  const normalized = normalizeSlug(slug);
  const found = pages.find(
    (page) => normalizeSlug(page.slug) === normalized && page.locale === locale
  );
  if (!found) return null;
  if (!preview && found.status !== "published") return null;
  return found;
}
