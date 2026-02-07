import { BASE_CURRENCY } from "../constants/currency";
import { getPriceForMode, getProductImages } from "./productUtils";

const TRAILING_SLASH_RE = /\/+$/;

export const getSiteUrl = (globalSettings) => {
  const fromSettings =
    globalSettings?.data?.siteUrl ||
    globalSettings?.siteUrl ||
    "";
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "";
  const raw = fromSettings || fromEnv || "";
  return raw ? raw.replace(TRAILING_SLASH_RE, "") : "";
};

export const toAbsoluteUrl = (baseUrl, path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
};

export const buildSeoTitle = ({ title, brand }) => {
  if (!title && !brand) return "";
  if (!title) return brand;
  if (!brand) return title;
  return `${title} | ${brand}`;
};

export const buildSeoDescription = ({ description, fallback }) => {
  if (description) return description;
  return fallback || "";
};

export const buildOrganizationSchema = ({
  name,
  url,
  logo,
  sameAs = [],
}) => {
  if (!name || !url) return null;
  const filteredSameAs = (sameAs || []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: logo || undefined,
    sameAs: filteredSameAs.length ? filteredSameAs : undefined,
  };
};

export const buildWebsiteSchema = ({ name, url, searchUrl }) => {
  if (!name || !url) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: searchUrl
      ? {
          "@type": "SearchAction",
          target: searchUrl,
          "query-input": "required name=search_term_string",
        }
      : undefined,
  };
};

export const buildBreadcrumbSchema = ({ items = [], baseUrl }) => {
  if (!items.length) return null;
  const list = items
    .map((item, index) => {
      const url = toAbsoluteUrl(baseUrl, item.href || "") || item.href;
      if (!url) return null;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: url,
      };
    })
    .filter(Boolean);
  if (!list.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list,
  };
};

export const buildProductSchema = ({
  product,
  url,
  currency = BASE_CURRENCY,
  brandName,
  baseUrl,
}) => {
  if (!product || !url) return null;
  const images = (getProductImages(product) || [])
    .map((image) => toAbsoluteUrl(baseUrl, image) || image)
    .filter(Boolean);
  const priceValue = getPriceForMode(product, "retail");
  const stockValue = Number(product.stock || 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary || product.details || "",
    image: images.length ? images : undefined,
    sku: product.code || product.productCode || undefined,
    brand: brandName
      ? {
          "@type": "Brand",
          name: brandName,
        }
      : undefined,
    offers: priceValue
      ? {
          "@type": "Offer",
          url,
          priceCurrency: currency,
          price: priceValue,
          availability:
            stockValue > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        }
      : undefined,
  };
};

export const buildFaqSchema = ({ items = [] }) => {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
};
