import React from "react";
import Head from "next/head";

import Navbar from "./Navbar";
import Footer from "./Footer";
import StickyBar from "./StickyBar";
import TrustStrip from "./TrustStrip";
import styles from "./Layout.module.scss";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";
import { buildSeoTitle } from "@/lib/seo";

const Layout = ({ children }) => {
  const { language } = useStateContext();
  const brandLabel = t(language, "home.brand");
  const defaultTitle = buildSeoTitle({
    title: t(language, "seo.homeTitle", { brand: brandLabel }),
    brand: brandLabel,
  });
  const defaultDescription = t(language, "seo.homeDescription");
  return (
    <div>
      <Head>
        <title>{defaultTitle}</title>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content={defaultDescription}></meta>
      </Head>
      <header>
        <Navbar />
      </header>
      <main className={styles["main-container"]}>{children}</main>
      <StickyBar />
      <TrustStrip />
      <footer className={styles.footer}>
        <Footer />
      </footer>
    </div>
  );
};

export default Layout;
