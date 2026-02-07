import React from "react";
import styles from "./AddressCard.module.scss";
import { t } from "@/constants/i18n";
import { useStateContext } from "@/context/StateContext";

const AddressCard = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onMakeDefault,
  showActions = true,
}) => {
  const { language } = useStateContext();
  if (!address) return null;

  return (
    <div className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <button type="button" className={styles.selectArea} onClick={onSelect}>
        <div className={styles.header}>
          <strong>{address.name || t(language, "address.unnamed")}</strong>
          {address.isDefault && <span className={styles.badge}>{t(language, "address.default")}</span>}
        </div>
        <div className={styles.meta}>{address.phone}</div>
        <div className={styles.addressLine}>{address.addressLine}</div>
        <div className={styles.meta}>
          {address.district} / {address.city}
        </div>
      </button>

      {showActions && (
        <div className={styles.actions}>
          <button type="button" onClick={onEdit}>
            {t(language, "actions.edit")}
          </button>
          <button type="button" onClick={onDelete}>
            {t(language, "actions.delete")}
          </button>
          {!address.isDefault && (
            <button type="button" onClick={onMakeDefault}>
              {t(language, "address.makeDefault")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressCard;
