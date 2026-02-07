import React from "react";
import styles from "./Skeletons.module.scss";

export const HeroSkeleton = () => (
  <div className={styles.hero}>
    <div className={styles.heroMedia} />
    <div className={styles.heroContent}>
      <span className={styles.lineShort} />
      <span className={styles.lineWide} />
      <span className={styles.lineMid} />
      <div className={styles.heroButtons}>
        <span className={styles.button} />
        <span className={styles.button} />
      </div>
    </div>
  </div>
);

export const CategoryGridSkeleton = () => (
  <div className={styles.grid}>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={`cat-skeleton-${index}`} className={styles.card} />
    ))}
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className={styles.grid}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={`product-skeleton-${index}`} className={styles.productCard}>
        <div className={styles.image} />
        <span className={styles.lineWide} />
        <span className={styles.lineShort} />
      </div>
    ))}
  </div>
);
