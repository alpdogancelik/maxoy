import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import styles from "../styles/authPages.module.scss";

const MIN_PASSWORD = 6;

const Register = () => {
  const { language, setAuthInfo, signIn } = useStateContext();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = t(language, "form.required");
    const emailValid = /^\S+@\S+\.\S+$/.test(form.email);
    if (form.email && !emailValid) next.email = t(language, "form.invalidEmail");
    if (!form.password.trim()) next.password = t(language, "form.required");
    if (form.password && form.password.length < MIN_PASSWORD) {
      next.password = t(language, "form.minPassword", { count: MIN_PASSWORD });
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = t(language, "form.passwordMismatch");
    }
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setAuthInfo((prev) => ({
      ...prev,
      registration: {
        ...prev.registration,
        fullName: form.fullName,
        email: form.email,
      },
      lastRegistrationAt: new Date().toISOString(),
    }));
    signIn({ email: form.email, password: form.password, fullName: form.fullName });
    setNotice(t(language, "account.registerSuccess"));
    router.replace("/account");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{t(language, "auth.registerTitle")}</h1>
          <p>{t(language, "auth.registerSubtitle")}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="fullName">{t(language, "auth.fullNameLabel")}</label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange("fullName")}
              placeholder={t(language, "account.placeholders.fullName")}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">{t(language, "auth.emailLabel")}</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              className={errors.email ? styles.inputError : ""}
              placeholder={t(language, "account.placeholders.email")}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">{t(language, "auth.passwordLabel")}</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              className={errors.password ? styles.inputError : ""}
              placeholder={t(language, "account.placeholders.password")}
            />
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">{t(language, "auth.confirmPasswordLabel")}</label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              className={errors.confirmPassword ? styles.inputError : ""}
              placeholder={t(language, "account.placeholders.password")}
            />
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword}</span>
            )}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton}>
              {t(language, "auth.submitRegister")}
            </button>
            {notice && <span className={styles.notice}>{notice}</span>}
          </div>
        </form>

        <div className={styles.switchRow}>
          {t(language, "auth.haveAccount")}
          <Link href="/login">{t(language, "auth.switchToLogin")}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
