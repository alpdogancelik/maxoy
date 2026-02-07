import { ReactNode } from "react";
import styles from "./ui-kit.module.scss";
import { cn } from "./cn";

export default function AdminContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.container, className)}>{children}</div>;
}

