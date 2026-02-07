import styles from "./ui-kit.module.scss";
import { cn } from "./cn";

export default function Skeleton({
  height = 14,
  width = "100%",
  className,
}: {
  height?: number;
  width?: number | string;
  className?: string;
}) {
  return <div className={cn(styles.skeleton, className)} style={{ height, width }} />;
}

