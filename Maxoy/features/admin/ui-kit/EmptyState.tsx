import { ReactNode } from "react";
import styles from "./ui-kit.module.scss";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(17,24,39,0.9)" }}>{title}</div>
      {description ? <div style={{ marginTop: 8 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

