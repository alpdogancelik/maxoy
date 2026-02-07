import React, { useState } from "react";
import { WHATSAPP_NUMBER } from "../constants/contact";
import { t, WHATSAPP_TEMPLATES } from "../constants/i18n";
import { useStateContext } from "../context/StateContext";
import styles from "../styles/wholesale.module.scss";

const WholesalePage = () => {
  const { language } = useStateContext();
  const [form, setForm] = useState({
    company: "",
    name: "",
    phone: "",
    email: "",
    message: "",
    fileName: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    setForm((prev) => ({ ...prev, fileName: file ? file.name : "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.company.trim()) nextErrors.company = t(language, "form.required");
    if (!form.name.trim()) nextErrors.name = t(language, "form.required");
    if (!form.phone.trim() && !form.email.trim()) {
      nextErrors.contact = t(language, "form.contactRequired");
    }
    if (form.email.trim()) {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!emailValid) nextErrors.email = t(language, "form.invalidEmail");
    }
    return nextErrors;
  };

  const handleSend = (event) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setStatus("error");
      return;
    }

    const template = WHATSAPP_TEMPLATES[language] || WHATSAPP_TEMPLATES.tr;
    const lines = [
      template.quoteIntro,
      form.company && `${t(language, "wholesale.companyLabel")}: ${form.company}`,
      form.name && `${t(language, "wholesale.nameLabel")}: ${form.name}`,
      form.phone && `${t(language, "wholesale.phoneLabel")}: ${form.phone}`,
      form.email && `${t(language, "wholesale.emailLabel")}: ${form.email}`,
      form.fileName && `${t(language, "wholesale.fileLabel")}: ${form.fileName}`,
      form.message && `${t(language, "wholesale.messageLabel")}: ${form.message}`,
    ].filter(Boolean);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("success");
  };

  const handleReset = () => {
    setForm({
      company: "",
      name: "",
      phone: "",
      email: "",
      message: "",
      fileName: "",
    });
    setErrors({});
    setStatus("idle");
  };

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1>{t(language, "wholesale.title")}</h1>
        <p>{t(language, "wholesale.subtitle")}</p>
      </header>

      <section className={styles.steps}>
        <h2>{t(language, "wholesale.stepsTitle")}</h2>
        <ol>
          <li>{t(language, "wholesale.steps.one")}</li>
          <li>{t(language, "wholesale.steps.two")}</li>
          <li>{t(language, "wholesale.steps.three")}</li>
          <li>{t(language, "wholesale.steps.four")}</li>
        </ol>
      </section>

      <section className={styles.flow}>
        <div className={styles.flowHeader}>
          <h2>{t(language, "wholesale.flowTitle")}</h2>
          <p>{t(language, "wholesale.flowIntro")}</p>
        </div>
        <div className={styles.flowGrid}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={styles.flowCard}>
              <span className={styles.flowStep}>{step}</span>
              <p>{t(language, `wholesale.flowSteps.${["one", "two", "three", "four"][step - 1]}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {status !== "idle" && (
        <div
          className={`${styles.statusCard} ${
            status === "success" ? styles.statusSuccess : styles.statusError
          }`}
        >
          <h3>
            {status === "success"
              ? t(language, "wholesale.successTitle")
              : t(language, "wholesale.errorTitle")}
          </h3>
          <p>
            {status === "success"
              ? t(language, "wholesale.successMessage")
              : t(language, "wholesale.errorMessage")}
          </p>
          <button
            type="button"
            className={styles.statusAction}
            onClick={handleReset}
          >
            {status === "success"
              ? t(language, "actions.sendAnother")
              : t(language, "actions.tryAgain")}
          </button>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSend}>
        <h2>{t(language, "wholesale.formTitle")}</h2>

        <div className={styles.field}>
          <label htmlFor="company">{t(language, "wholesale.companyLabel")}</label>
          <input
            id="company"
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            aria-invalid={Boolean(errors.company)}
          />
          <span className={styles.helper}>{t(language, "wholesale.companyHelper")}</span>
          {errors.company && <span className={styles.error}>{errors.company}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="name">{t(language, "wholesale.nameLabel")}</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={Boolean(errors.name)}
          />
          <span className={styles.helper}>{t(language, "wholesale.nameHelper")}</span>
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="phone">{t(language, "wholesale.phoneLabel")}</label>
          <input
            id="phone"
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            aria-invalid={Boolean(errors.contact)}
          />
          <span className={styles.helper}>{t(language, "wholesale.phoneHelper")}</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="email">{t(language, "wholesale.emailLabel")}</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={Boolean(errors.email || errors.contact)}
          />
          <span className={styles.helper}>{t(language, "wholesale.emailHelper")}</span>
          {(errors.email || errors.contact) && (
            <span className={styles.error}>{errors.email || errors.contact}</span>
          )}
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="message">{t(language, "wholesale.messageLabel")}</label>
          <textarea
            id="message"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <span className={styles.helper}>{t(language, "wholesale.messageHelper")}</span>
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="file">{t(language, "wholesale.fileLabel")}</label>
          <input id="file" type="file" accept=".csv,.xlsx" onChange={handleFile} />
          <span className={styles.helper}>{t(language, "wholesale.fileHelper")}</span>
          {form.fileName && (
            <span className={styles.fileName}>
              {t(language, "wholesale.fileSelected")}: {form.fileName}
            </span>
          )}
        </div>

        <button type="submit" className={styles.submit}>
          {t(language, "actions.sendWhatsApp")}
        </button>
      </form>
    </div>
  );
};

export default WholesalePage;
