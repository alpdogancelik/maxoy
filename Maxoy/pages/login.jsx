import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import styles from "../styles/authPages.module.scss";

const MIN_PASSWORD = 6;

const Login = () => {
  const { language, signIn, authInfo } = useStateContext();
  const router = useRouter();
  const [form, setForm] = useState({
    email: authInfo?.login?.email || "",
    password: "",
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
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    signIn({ email: form.email, password: form.password });
    setNotice(t(language, "account.loginSuccess"));
    const nextParam = router.query?.next;
    const nextPath = Array.isArray(nextParam)
      ? nextParam[0]
      : nextParam || "/account";
    router.replace(nextPath);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{t(language, "auth.loginTitle")}</h1>
          <p>{t(language, "auth.loginSubtitle")}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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

          <div className={styles.linkRow}>
            <span />
            <a href="#" onClick={(event) => event.preventDefault()}>
              {t(language, "auth.forgotPassword")}
            </a>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton}>
              {t(language, "auth.submitLogin")}
            </button>
            {notice && <span className={styles.notice}>{notice}</span>}
          </div>
        </form>

        <div className={styles.switchRow}>
          {t(language, "auth.noAccount")}
          <Link href="/register">{t(language, "auth.switchToRegister")}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
