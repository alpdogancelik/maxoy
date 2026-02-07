import React from "react";
import styles from "./PolicyPage.module.scss";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";
import { BRAND_CONFIG } from "@/constants/brand";

const PolicyPage = ({ title, intro, sections = [], lastUpdated }) => {
  const { language, changeLanguage } = useStateContext();
  const supportEmail = BRAND_CONFIG.supportEmail;
  const supportPhone = BRAND_CONFIG.supportPhone;

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
          {lastUpdated && (
            <span className={styles.updated}>
              {t(language, "policies.lastUpdated", { date: lastUpdated })}
            </span>
          )}
        </div>
        <div className={styles.langToggle}>
          <button
            type="button"
            className={language === "tr" ? styles.active : ""}
            onClick={() => changeLanguage("tr")}
          >
            TR
          </button>
          <button
            type="button"
            className={language === "en" ? styles.active : ""}
            onClick={() => changeLanguage("en")}
          >
            EN
          </button>
        </div>
      </div>

      <div className={styles.sections}>
        {sections.map((section, index) => (
          <div key={`${section.title}-${index}`} className={styles.section}>
            <h2>{section.title}</h2>
            {Array.isArray(section.body)
              ? section.body.map((text, bodyIndex) => <p key={bodyIndex}>{text}</p>)
              : section.body && <p>{section.body}</p>}
          </div>
        ))}
      </div>

      <div className={styles.contact}>
        <h3>{t(language, "policies.contactTitle")}</h3>
        <p>{t(language, "policies.contactBody")}</p>
        <div>
          <span>{t(language, "policies.contactEmail")}: </span>
          <strong>{supportEmail}</strong>
        </div>
        <div>
          <span>{t(language, "policies.contactPhone")}: </span>
          <strong>{supportPhone}</strong>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
