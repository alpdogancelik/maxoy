import styles from "./ui-kit.module.scss";
import { cn } from "./cn";
import { ReactNode } from "react";

type Tone = "neutral" | "success" | "warn" | "danger";

export default function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  const toneClass =
    tone === "success"
      ? styles.badgeSuccess
      : tone === "warn"
        ? styles.badgeWarn
        : tone === "danger"
          ? styles.badgeDanger
          : undefined;
  return <span className={cn(styles.badge, toneClass)}>{children}</span>;
}

