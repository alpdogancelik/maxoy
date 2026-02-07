import React from "react";
import styles from "./EmptyState.module.scss";

const EmptyState = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
