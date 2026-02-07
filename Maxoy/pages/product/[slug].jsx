import React, { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

import { useStateContext } from "../../context/StateContext";
import { t } from "../../constants/i18n";
import { WHATSAPP_NUMBER } from "../../constants/contact";
import { getStorefrontProductBySlug, getStorefrontProducts } from "../../lib/storefront/products";
import { getGlobalSettings } from "../../lib/cms/store";
import { buildSeoTitle } from "../../lib/seo";
import {
  buildWhatsappProductMessage,
  formatPrice,
  getLocalizedField,
  getPriceForMode,
  getProductMainImage,
} from "../../lib/productUtils";

function findProductBySlug(products, slug) {
  const needle = String(slug || "").trim().toLowerCase();
  if (!needle) return null;

  const flat = [];
  (products || []).forEach((p) => {
    flat.push(p);
    if (Array.isArray(p?.variants) && p.variants.length) {
      p.variants.forEach((v) => flat.push(v));
    }
  });

  return (
    flat.find((p) => String(p?.slug?.current || "").toLowerCase() === needle) ||
    flat.find((p) => String(p?.code || "").toLowerCase() === needle) ||
    flat.find((p) => String(p?.id || "").toLowerCase() === needle) ||
    flat.find((p) => String(p?.name || "").toLowerCase().replace(/\s+/g, "-") === needle) ||
    null
  );
}

export default function ProductPage({ product, globalSettings }) {
  const router = useRouter();
  const { language, currency, pricingMode, onAdd } = useStateContext();

  const brandLabel = globalSettings?.data?.siteName || t(language, "home.brand");
  const nameText = getLocalizedField(product, "name", language) || product.name || t(language, "misc.unnamed");
  const summaryText = getLocalizedField(product, "summary", language) || product.summary || "";
  const imageUrl = getProductMainImage(product);

  const priceValue = getPriceForMode(product, pricingMode);
  const priceText = formatPrice(priceValue, currency, language);

  const seoTitle = buildSeoTitle({ title: nameText, brand: brandLabel });

  const stockValue = Number(product.stock || 0);

  const whatsappUrl = useMemo(() => {
    if (!product) return "";
    if (!WHATSAPP_NUMBER) return "";
    const message = buildWhatsappProductMessage({
      language,
      product,
      currency,
      pricingMode,
      quantity: 1,
    });
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [currency, language, pricingMode, product]);

  if (router.isFallback) return null;
  if (!product) return null;

  return (
    <>
      <Head>{seoTitle && <title>{seoTitle}</title>}</Head>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/tum-urunler" style={{ color: "#7a2d3a", textDecoration: "none" }}>
            ← {t(language, "nav.products")}
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 420px) minmax(0, 1fr)",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 18,
              border: "1px solid rgba(0,0,0,0.08)",
              padding: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl || "/placeholder-product.png"}
              alt={nameText}
              style={{ width: "100%", height: "auto", borderRadius: 12, objectFit: "contain" }}
            />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.15 }}>{nameText}</h1>
            {summaryText ? (
              <p style={{ marginTop: 10, color: "rgba(17,24,39,0.75)", maxWidth: 720 }}>
                {summaryText}
              </p>
            ) : null}

            <div style={{ marginTop: 16, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{priceText}</div>
              <div style={{ color: "rgba(17,24,39,0.65)" }}>KDV dahil</div>
              <div style={{ color: stockValue > 0 ? "#0f766e" : "#b42318", fontWeight: 700 }}>
                {stockValue > 0 ? t(language, "product.inStock") : t(language, "product.outOfStock")}
              </div>
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => onAdd(product, 1)}
                disabled={stockValue <= 0}
                style={{
                  border: 0,
                  borderRadius: 999,
                  padding: "12px 18px",
                  background: stockValue > 0 ? "#9b2c3f" : "rgba(0,0,0,0.2)",
                  color: "white",
                  fontWeight: 800,
                  cursor: stockValue > 0 ? "pointer" : "not-allowed",
                }}
              >
                {t(language, "actions.addToCart")}
              </button>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{
                    borderRadius: 999,
                    padding: "12px 18px",
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.15)",
                    color: "#111827",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  {t(language, "product.whatsappAsk")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const products = await getStorefrontProducts();
  const slugs = new Set();

  products.forEach((p) => {
    const s = p?.slug?.current || p?.code || p?.id;
    if (s) slugs.add(String(s));
    if (Array.isArray(p?.variants)) {
      p.variants.forEach((v) => {
        const vs = v?.slug?.current || v?.code || v?.id;
        if (vs) slugs.add(String(vs));
      });
    }
  });

  return {
    paths: Array.from(slugs).map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params, locale }) {
  const product = await getStorefrontProductBySlug(params?.slug);
  if (!product) {
    return { notFound: true, revalidate: 60 };
  }

  return {
    props: {
      product,
      globalSettings: getGlobalSettings(locale || "tr"),
    },
    revalidate: 60,
  };
}
