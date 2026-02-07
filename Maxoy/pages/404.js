import React from "react";
import Link from "next/link";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";

const NotFound = () => {
  const { language } = useStateContext();
  return (
    <div className="container">
      <div className="not-found">
        <h1>{t(language, "misc.pageNotFoundTitle")}</h1>
        <h2>{t(language, "misc.pageNotFoundSubtitle")}</h2>
        <p>
          <Link href="/">{t(language, "misc.pageNotFoundCta")}</Link>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
