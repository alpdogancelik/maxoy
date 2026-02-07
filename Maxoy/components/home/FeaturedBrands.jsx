import React from "react";
import styles from "./FeaturedBrands.module.scss";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";

const FeaturedBrands = ({ stats = {} }) => {
  const { language } = useStateContext();
  const formatValue = (value) =>
    new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR").format(
      Number(value || 0)
    );
  const items = [
    { value: formatValue(stats.products), label: t(language, "featured.statProducts") },
    { value: formatValue(stats.categories), label: t(language, "featured.statCustomers") },
    { value: formatValue(stats.inStock), label: t(language, "featured.statOrders") },
  ];
  return (
    <div className={styles.container}>
      <p>{t(language, "featured.title")}</p>
      <div className={styles.metricsGrid}>
        {items.map((stat) => (
          <div key={stat.label} className={styles.metricCard}>
            <span className={styles.metricValue}>{stat.value}</span>
            <span className={styles.metricLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBrands;
