"use client";

import { ReactNode } from "react";
import styles from "./ui-kit.module.scss";

export default function StickySaveBar({
  show,
  left,
  right,
}: {
  show: boolean;
  left: ReactNode;
  right: ReactNode;
}) {
  if (!show) return null;
  return (
    <div className={styles.stickyBar} role="region" aria-label="Unsaved changes">
      <div className={styles.stickyText}>{left}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{right}</div>
    </div>
  );
}

