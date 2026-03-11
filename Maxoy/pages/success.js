import React, { useEffect } from "react";
import Link from "next/link";
import { BsBagCheckFill } from "react-icons/bs";
import { useStateContext } from "../context/StateContext";
import Image from "next/image";
import { runFireWorks } from "../lib/utility";
import { analytics } from "../lib/analytics";
import { t } from "../constants/i18n";
import { BRAND_CONFIG } from "../constants/brand";
const Success = () => {
  const { setCartItems, setTotalPrice, setTotalQuantities, language } = useStateContext();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastOrder = window.localStorage.getItem("maxoy-last-order");
      if (lastOrder) {
        try {
          const parsed = JSON.parse(lastOrder);
          analytics.purchase({
            value: parsed?.totals?.total,
            currency: parsed?.currency,
            items: parsed?.items || [],
          });
        } catch (e) {
          console.warn("Failed to parse last order");
        }
        window.localStorage.removeItem("maxoy-last-order");
      }
    }
    setCartItems([]);
    setTotalPrice(0);
    setTotalQuantities(0);
    runFireWorks();
  }, [setCartItems, setTotalPrice, setTotalQuantities]);
  return (
    <div className="success-container">
      <div className="text-box">
        <h3>{t(language, "success.title")}</h3>
        <p className="sub-heading">{t(language, "success.subtitle")}</p>
        <p className="sub-heading">
          {t(language, "success.helper", { email: BRAND_CONFIG.supportEmail })}
        </p>
        <p className="icon">
          <BsBagCheckFill />
        </p>

        <Link href="/">
          <button type="button" className="btn">
            {t(language, "success.continue")}
          </button>
        </Link>
      </div>
      <div className="image-box">
        <Image src="/hero-image.png" alt="Order success" height={200} width={215} />
      </div>
    </div>
  );
};

export default Success;
