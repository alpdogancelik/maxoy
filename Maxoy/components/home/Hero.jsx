import React from "react";

import { motion } from "framer-motion";
import styles from "./Hero.module.scss";
import { images } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";

const Hero = ({ stats = {} }) => {
  const { language } = useStateContext();
  const highlight = t(language, "hero.highlight");
  const titleTemplate = t(language, "hero.title", { highlight: "__HIGHLIGHT__" });
  const [titlePrefix, titleSuffix] = titleTemplate.split("__HIGHLIGHT__");
  const formatValue = (value) =>
    new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR").format(
      Number(value || 0)
    );
  const metricItems = [
    { value: formatValue(stats.products), label: t(language, "hero.products") },
    { value: formatValue(stats.inStock), label: t(language, "hero.delivered") },
    { value: formatValue(stats.categories), label: t(language, "hero.customers") },
  ];
  const categories = [
    { label: t(language, "hero.categoryOne"), href: "/hazir-urunler" },
    { label: t(language, "hero.categoryTwo"), href: "/cicek-cesitleri" },
    { label: t(language, "hero.categoryThree"), href: "/toptan-cicek-malzemesi-ambalaj-cesitleri" },
  ];
  return (
    <section className={`${styles["hero-section"]}  grid`}>
      <motion.div className={styles["hero-text"]}>
        <span className={styles.eyebrow}>{t(language, "hero.eyebrow")}</span>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {titlePrefix}
          <span>{highlight}</span>
          {titleSuffix}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {t(language, "hero.subtitle")}
        </motion.p>
        <div className={styles.ctaRow}>
          <Link href="/tum-urunler" legacyBehavior passHref>
            <motion.a
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="btn margin-top"
            >
              {t(language, "hero.ctaPrimary")}
            </motion.a>
          </Link>
          <Link href="/wholesale" legacyBehavior passHref>
            <motion.a
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={styles.secondaryCta}
            >
              {t(language, "hero.ctaSecondary")}
            </motion.a>
          </Link>
        </div>
        <div className={styles["hero-num"]}>
          {metricItems.map((stat) => (
            <div key={stat.label} className={styles["hero-num-content"]}>
              <p>{stat.value}</p>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.categoryCards}>
          {categories.map((cat) => (
            <Link key={cat.href} href={cat.href} className={styles.categoryCard}>{cat.label}</Link>
          ))}
        </div>
      </motion.div>
      <div className={styles["hero-image-container"]}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={styles["hero-images"]}
        >
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={styles["yellow-plant"]}
          >
            <Image src={images.yellowPlant} alt="Yellow plant" height={400} width={300} />
          </motion.div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={styles.leaf1}
          >
            <Image src={images.leaf3} alt="leaf" width={160} height={160} />
          </motion.div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={styles.leaf2}
          >
            <Image src={images.leaf2} alt="leaf" width={128} height={128} />
          </motion.div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={styles.leaf3}
          >
            <Image src={images.leaf1} alt="leaf" width={160} height={160} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
