import { ReactNode } from "react";
import styles from "./ui-kit.module.scss";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageHeaderTitle}>{title}</h1>
        {description ? <div className={styles.pageHeaderDesc}>{description}</div> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

