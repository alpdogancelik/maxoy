import React from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/cmsPage.module.scss";

const HeroSection = ({ eyebrow, title, subtitle, ctaLabel, ctaHref, imageUrl }) => (
  <section className={`${styles.section} ${styles.hero}`}>
    <div className={styles.heroContent}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      {title && <h1>{title}</h1>}
      {subtitle && <p>{subtitle}</p>}
      {ctaLabel && ctaHref && (
        <a className={styles.heroCta} href={ctaHref}>
          {ctaLabel}
        </a>
      )}
    </div>
    {imageUrl && (
      <div className={styles.heroImage}>
        <Image
          src={imageUrl}
          alt={title || "Hero image"}
          width={1200}
          height={900}
          className={styles.mediaImage}
        />
      </div>
    )}
  </section>
);

const PromoBannerSection = ({ text, variant = "info" }) => (
  <section
    className={`${styles.section} ${styles.promoBanner} ${
      styles[`promo_${variant}`] || ""
    }`}
  >
    <p>{text}</p>
  </section>
);

const CategoryGridSection = ({ title, subtitle, items = [] }) => (
  <section className={`${styles.section} ${styles.categorySection}`}>
    <div className={styles.sectionHeader}>
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </div>
    <div className={styles.categoryGrid}>
      {items.map((item) => (
        <a key={item.id || item.href || item.label} href={item.href || "#"}>
          <div className={styles.categoryCard}>
            {item.image && (
              <Image
                src={item.image}
                alt={item.label || "Category"}
                width={320}
                height={240}
                className={styles.mediaImage}
              />
            )}
            <span>{item.label}</span>
          </div>
        </a>
      ))}
    </div>
  </section>
);

const RichTextSection = ({ title, content, align = "left" }) => {
  const paragraphs = String(content || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <section className={`${styles.section} ${styles.richText}`}>
      {title && <h2>{title}</h2>}
      <div style={{ textAlign: align }}>
        {paragraphs.map((text, index) => (
          <p key={`${text}-${index}`}>{text}</p>
        ))}
      </div>
    </section>
  );
};

const ContactBlockSection = ({
  title,
  subtitle,
  phone,
  email,
  address,
  whatsapp,
  globalSettings,
}) => {
  const settings = globalSettings || {};
  const resolvedPhone = phone || settings.phone;
  const resolvedEmail = email || settings.email;
  const resolvedAddress = address || settings.address;
  const resolvedWhatsapp = whatsapp || settings.whatsapp;
  return (
    <section className={`${styles.section} ${styles.contactBlock}`}>
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
      <ul>
        {resolvedPhone && <li>Tel: {resolvedPhone}</li>}
        {resolvedWhatsapp && <li>WhatsApp: {resolvedWhatsapp}</li>}
        {resolvedEmail && <li>Email: {resolvedEmail}</li>}
        {resolvedAddress && <li>{resolvedAddress}</li>}
      </ul>
    </section>
  );
};

const SECTION_MAP = {
  hero: HeroSection,
  promo_banner: PromoBannerSection,
  category_grid: CategoryGridSection,
  rich_text: RichTextSection,
  contact_block: ContactBlockSection,
};

const renderMetaTag = (name, content) =>
  content ? <meta name={name} content={content} /> : null;

export default function PageRenderer({ sections = [], seo = {}, globalSettings }) {
  return (
    <>
      <Head>
        {seo?.title ? <title>{seo.title}</title> : null}
        {renderMetaTag("description", seo?.description)}
        {seo?.canonical ? <link rel="canonical" href={seo.canonical} /> : null}
        {seo?.ogImage ? <meta property="og:image" content={seo.ogImage} /> : null}
        {seo?.noindex ? (
          <meta name="robots" content="noindex,nofollow" />
        ) : null}
      </Head>
      <div className={styles.page}>
        {sections.map((section, index) => {
          const Component = SECTION_MAP[section.type];
          if (!Component) return null;
          return (
            <Component
              key={section.id || `${section.type}-${index}`}
              {...section.props}
              globalSettings={globalSettings}
            />
          );
        })}
      </div>
    </>
  );
}
