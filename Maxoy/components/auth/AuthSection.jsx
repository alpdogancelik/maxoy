import React, { useEffect, useMemo, useState } from "react";
import styles from "./AuthSection.module.scss";
import { useStateContext } from "@/context/StateContext";
import { t } from "@/constants/i18n";

const defaultRegistration = {
  fullName: "",
  company: "",
  phone: "",
  email: "",
  password: "",
};

const defaultLogin = {
  email: "",
  password: "",
};

const AuthSection = () => {
  const { language, authInfo, setAuthInfo, signIn } = useStateContext();
  const [registration, setRegistration] = useState(defaultRegistration);
  const [login, setLogin] = useState(defaultLogin);
  const [registerNotice, setRegisterNotice] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

  useEffect(() => {
    setRegistration(authInfo?.registration || defaultRegistration);
    setLogin(authInfo?.login || defaultLogin);
  }, [authInfo]);

  const formatDate = useMemo(
    () => (value) => {
      if (!value) return "-";
      try {
        return new Date(value).toLocaleString(
          language === "tr" ? "tr-TR" : "en-US"
        );
      } catch (e) {
        return value;
      }
    },
    [language]
  );

  const handleRegisterChange = (field) => (event) => {
    setRegistration((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleLoginChange = (field) => (event) => {
    setLogin((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    setAuthInfo((prev) => ({
      ...prev,
      registration,
      lastRegistrationAt: new Date().toISOString(),
    }));
    setRegisterNotice(t(language, "account.registerSuccess"));
    setTimeout(() => setRegisterNotice(""), 2500);
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    signIn({ email: login.email, password: login.password });
    setLoginNotice(t(language, "account.loginSuccess"));
    setTimeout(() => setLoginNotice(""), 2500);
  };

  const handleClear = () => {
    setAuthInfo({
      registration: defaultRegistration,
      login: defaultLogin,
      lastRegistrationAt: "",
      lastLoginAt: "",
    });
    setRegisterNotice("");
    setLoginNotice("");
  };

  const savedRegistration = authInfo?.registration || defaultRegistration;
  const savedLogin = authInfo?.login || defaultLogin;
  const hasSaved =
    Boolean(savedRegistration?.email) ||
    Boolean(savedRegistration?.phone) ||
    Boolean(savedLogin?.email);

  return (
    <section className={styles.authSection} id="account">
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          <p className={styles.kicker}>{t(language, "account.kicker")}</p>
          <h2 className={styles.title}>{t(language, "account.title")}</h2>
          <p className={styles.subtitle}>{t(language, "account.subtitle")}</p>
          <div className={styles.savedCard}>
            <div className={styles.savedHeader}>
              <h3>{t(language, "account.savedTitle")}</h3>
              <button type="button" onClick={handleClear} className={styles.clearBtn}>
                {t(language, "account.clear")}
              </button>
            </div>
            {hasSaved ? (
              <div className={styles.savedGrid}>
                <div>
                  <span>{t(language, "account.fullName")}</span>
                  <strong>{savedRegistration.fullName || "-"}</strong>
                </div>
                <div>
                  <span>{t(language, "account.company")}</span>
                  <strong>{savedRegistration.company || "-"}</strong>
                </div>
                <div>
                  <span>{t(language, "account.phone")}</span>
                  <strong>{savedRegistration.phone || "-"}</strong>
                </div>
                <div>
                  <span>{t(language, "account.email")}</span>
                  <strong>{savedRegistration.email || "-"}</strong>
                </div>
                <div>
                  <span>{t(language, "account.lastRegistration")}</span>
                  <strong>{formatDate(authInfo?.lastRegistrationAt)}</strong>
                </div>
                <div>
                  <span>{t(language, "account.lastLogin")}</span>
                  <strong>{formatDate(authInfo?.lastLoginAt)}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.savedEmpty}>{t(language, "account.savedEmpty")}</p>
            )}
            <p className={styles.note}>{t(language, "account.note")}</p>
          </div>
        </div>
        <div className={styles.forms}>
          <form
            id="account-register"
            className={styles.formCard}
            onSubmit={handleRegisterSubmit}
          >
            <div className={styles.formHeader}>
              <h3>{t(language, "account.registerTitle")}</h3>
              <p>{t(language, "account.registerHint")}</p>
            </div>
            <label className={styles.field}>
              <span>{t(language, "account.fullName")}</span>
              <input
                type="text"
                value={registration.fullName}
                onChange={handleRegisterChange("fullName")}
                placeholder={t(language, "account.placeholders.fullName")}
              />
            </label>
            <label className={styles.field}>
              <span>{t(language, "account.company")}</span>
              <input
                type="text"
                value={registration.company}
                onChange={handleRegisterChange("company")}
                placeholder={t(language, "account.placeholders.company")}
              />
            </label>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>{t(language, "account.phone")}</span>
                <input
                  type="tel"
                  value={registration.phone}
                  onChange={handleRegisterChange("phone")}
                  placeholder={t(language, "account.placeholders.phone")}
                />
              </label>
              <label className={styles.field}>
                <span>{t(language, "account.email")}</span>
                <input
                  type="email"
                  value={registration.email}
                  onChange={handleRegisterChange("email")}
                  placeholder={t(language, "account.placeholders.email")}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>{t(language, "account.password")}</span>
              <input
                type="password"
                value={registration.password}
                onChange={handleRegisterChange("password")}
                placeholder={t(language, "account.placeholders.password")}
              />
            </label>
            <button type="submit" className={styles.primaryBtn}>
              {t(language, "account.saveRegister")}
            </button>
            {registerNotice ? (
              <p className={styles.notice}>{registerNotice}</p>
            ) : null}
          </form>
          <form
            id="account-login"
            className={styles.formCard}
            onSubmit={handleLoginSubmit}
          >
            <div className={styles.formHeader}>
              <h3>{t(language, "account.loginTitle")}</h3>
              <p>{t(language, "account.loginHint")}</p>
            </div>
            <label className={styles.field}>
              <span>{t(language, "account.email")}</span>
              <input
                type="email"
                value={login.email}
                onChange={handleLoginChange("email")}
                placeholder={t(language, "account.placeholders.email")}
              />
            </label>
            <label className={styles.field}>
              <span>{t(language, "account.password")}</span>
              <input
                type="password"
                value={login.password}
                onChange={handleLoginChange("password")}
                placeholder={t(language, "account.placeholders.password")}
              />
            </label>
            <button type="submit" className={styles.secondaryBtn}>
              {t(language, "account.saveLogin")}
            </button>
            {loginNotice ? <p className={styles.notice}>{loginNotice}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
};

export default AuthSection;
