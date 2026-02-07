import { ReactNode } from "react";
import styles from "./ui-kit.module.scss";
import { cn } from "./cn";

export function FormField({
  label,
  required,
  helperText,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label}>
          {label}
          {required ? <span className={styles.required}>*</span> : null}
        </label>
      </div>
      {children}
      {error ? <div className={styles.error}>{error}</div> : helperText ? <div className={styles.help}>{helperText}</div> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(styles.input, styles.focusRing, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(styles.input, styles.focusRing, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(styles.input, styles.focusRing, props.className)} />;
}

