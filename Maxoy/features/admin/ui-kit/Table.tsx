import { HTMLAttributes, ReactNode } from "react";
import styles from "./ui-kit.module.scss";
import { cn } from "./cn";

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.tableWrap, className)}>{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table className={styles.table}>{children}</table>;
}

export function Th({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th {...props} className={cn(styles.th, className)}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={cn(styles.td, className)}>
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  hover = true,
  ...props
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr {...props} className={cn(hover ? styles.trHover : undefined, className)}>
      {children}
    </tr>
  );
}

