import React, { useEffect, useState } from "react";
import styles from "./AddressForm.module.scss";
import { t } from "@/constants/i18n";
import { useStateContext } from "@/context/StateContext";
import { createEmptyAddress, formatPhoneTR, validateAddress } from "@/lib/addressBook";

const AddressForm = ({
  initialValue,
  onSubmit,
  onCancel,
  submitLabel,
  showDefaultToggle = false,
}) => {
  const { language } = useStateContext();
  const [values, setValues] = useState(initialValue || createEmptyAddress());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(initialValue || createEmptyAddress());
    setErrors({});
  }, [initialValue]);

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value) => {
    const masked = formatPhoneTR(value);
    setValues((prev) => ({ ...prev, phone: masked }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = validateAddress(values);
    if (!result.valid) {
      setErrors(result.errors || {});
      return;
    }
    setErrors({});
    onSubmit?.(values);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>{t(language, "address.name")}</span>
          <input
            type="text"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t(language, "address.placeholders.name")}
          />
          {errors.name && <small>{t(language, "address.errors.name")}</small>}
        </label>

        <label className={styles.field}>
          <span>{t(language, "address.phone")}</span>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={t(language, "address.placeholders.phone")}
            inputMode="tel"
          />
          {errors.phone && <small>{t(language, "address.errors.phone")}</small>}
        </label>

        <label className={styles.field}>
          <span>{t(language, "address.city")}</span>
          <input
            type="text"
            value={values.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder={t(language, "address.placeholders.city")}
          />
          {errors.city && <small>{t(language, "address.errors.city")}</small>}
        </label>

        <label className={styles.field}>
          <span>{t(language, "address.district")}</span>
          <input
            type="text"
            value={values.district}
            onChange={(e) => handleChange("district", e.target.value)}
            placeholder={t(language, "address.placeholders.district")}
          />
          {errors.district && <small>{t(language, "address.errors.district")}</small>}
        </label>

        <label className={`${styles.field} ${styles.full}`}>
          <span>{t(language, "address.addressLine")}</span>
          <textarea
            rows={3}
            value={values.addressLine}
            onChange={(e) => handleChange("addressLine", e.target.value)}
            placeholder={t(language, "address.placeholders.addressLine")}
          />
          {errors.addressLine && <small>{t(language, "address.errors.addressLine")}</small>}
        </label>

        <label className={styles.field}>
          <span>
            {t(language, "address.postalCode")} <em>{t(language, "address.optional")}</em>
          </span>
          <input
            type="text"
            value={values.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            placeholder={t(language, "address.placeholders.postalCode")}
          />
          {errors.postalCode && <small>{t(language, "address.errors.postalCode")}</small>}
        </label>

        <label className={styles.field}>
          <span>
            {t(language, "address.company")} <em>{t(language, "address.optional")}</em>
          </span>
          <input
            type="text"
            value={values.company}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder={t(language, "address.placeholders.company")}
          />
        </label>

        <label className={styles.field}>
          <span>
            {t(language, "address.taxNo")} <em>{t(language, "address.optional")}</em>
          </span>
          <input
            type="text"
            value={values.taxNo}
            onChange={(e) => handleChange("taxNo", e.target.value)}
            placeholder={t(language, "address.placeholders.taxNo")}
          />
          {errors.taxNo && <small>{t(language, "address.errors.taxNo")}</small>}
        </label>

        {showDefaultToggle && (
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={Boolean(values.isDefault)}
              onChange={(e) => handleChange("isDefault", e.target.checked)}
            />
            {t(language, "address.makeDefault")}
          </label>
        )}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.secondary} onClick={onCancel}>
            {t(language, "actions.cancel")}
          </button>
        )}
        <button type="submit" className={styles.primary}>
          {submitLabel || t(language, "actions.save")}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
