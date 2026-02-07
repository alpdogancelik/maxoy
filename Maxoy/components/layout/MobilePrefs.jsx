import React from "react";
import styles from "./MobilePrefs.module.scss";
import { useStateContext } from "@/context/StateContext";
import { LANGUAGES, t } from "@/constants/i18n";
import { CURRENCY_OPTIONS } from "@/constants/currency";

const MobilePrefs = () => {
  const { language, changeLanguage, currency, setCurrency, pricingMode, setPricingMode } =
    useStateContext();

  return (
    <section className={styles.mobilePrefs}>
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>{t(language, "nav.language")}</span>
        <div className={styles.pillGroup}>
          {Object.values(LANGUAGES).map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={language === lang.code ? styles.pillActive : styles.pill}
              onClick={() => changeLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>{t(language, "nav.currency")}</span>
        <div className={styles.pillGroup}>
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              className={currency === option.code ? styles.pillActive : styles.pill}
              onClick={() => setCurrency(option.code)}
            >
              {option.symbol}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>{t(language, "nav.pricingMode")}</span>
        <div className={styles.pillGroup}>
          {[
            { key: "retail", label: t(language, "nav.retail") },
            { key: "wholesale", label: t(language, "nav.wholesale") },
            { key: "vip", label: t(language, "nav.vip") },
          ].map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={pricingMode === mode.key ? styles.pillActive : styles.pill}
              onClick={() => setPricingMode(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobilePrefs;
