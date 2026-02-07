import { ReactNode } from "react";
import styles from "./ui-kit.module.scss";
import { cn } from "./cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.card, className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.cardBody, className)}>{children}</div>;
}

