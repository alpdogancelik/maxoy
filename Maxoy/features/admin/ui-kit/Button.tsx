import { ButtonHTMLAttributes } from "react";
import styles from "./ui-kit.module.scss";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export default function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variantClass =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
        ? styles.btnDanger
        : variant === "ghost"
          ? styles.btnGhost
          : styles.btnSecondary;
  return <button {...props} className={cn(styles.btn, styles.focusRing, variantClass, className)} />;
}

