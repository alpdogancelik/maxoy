import React from "react";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import PolicyPage from "../components/policy/PolicyPage";

const Terms = () => {
  const { language } = useStateContext();
  return (
    <PolicyPage
      title={t(language, "policies.terms.title")}
      intro={t(language, "policies.terms.intro")}
      lastUpdated={t(language, "policies.lastUpdatedDate")}
      sections={[
        {
          title: t(language, "policies.terms.sections.scope.title"),
          body: [
            t(language, "policies.terms.sections.scope.p1"),
            t(language, "policies.terms.sections.scope.p2"),
          ],
        },
        {
          title: t(language, "policies.terms.sections.orders.title"),
          body: [
            t(language, "policies.terms.sections.orders.p1"),
            t(language, "policies.terms.sections.orders.p2"),
          ],
        },
        {
          title: t(language, "policies.terms.sections.liability.title"),
          body: [
            t(language, "policies.terms.sections.liability.p1"),
            t(language, "policies.terms.sections.liability.p2"),
          ],
        },
      ]}
    />
  );
};

export default Terms;
