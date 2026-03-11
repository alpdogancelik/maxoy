import React from "react";

import styles from "./TrustStrip.module.scss";
import { useStateContext } from "@/context/StateContext";

const ShieldIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 12.2l1.8 1.8 3.6-3.8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TruckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M3 7h11v10H3V7z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14 10h4l3 3v4h-7v-7z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const PriceIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 3a9 9 0 100 18 9 9 0 000-18z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M13.8 8.3c-.4-.3-1-.5-1.6-.5-1.1 0-1.9.6-1.9 1.5 0 2.2 4.2 1 4.2 3.6 0 1.1-1 2-2.5 2-.7 0-1.4-.2-2-.6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M12 7v10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const TrustStrip = () => {
  const { language } = useStateContext();
  const isEn = language === "en";

  const items = [
    {
      icon: ShieldIcon,
      text: isEn ? "Secure shopping with 256-bit SSL" : "256 Bit SSL ile güvenli alışveriş",
    },
    {
      icon: TruckIcon,
      text: isEn ? "Free shipping over 3000 TRY" : "3000₺ üzeri ücretsiz kargo",
    },
    {
      icon: PriceIcon,
      text: isEn ? "Retail at wholesale prices" : "Toptan fiyata perakende satış",
    },
  ];

  return (
    <section className={styles.strip} aria-label={isEn ? "Trust badges" : "Güven bilgileri"}>
      <div className={`container ${styles.inner}`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.text} className={styles.item}>
              <Icon className={styles.icon} />
              <div className={styles.text}>{item.text}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustStrip;
