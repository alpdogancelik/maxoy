import React from "react";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import PolicyPage from "../components/policy/PolicyPage";

const Returns = () => {
  const { language } = useStateContext();
  return (
    <PolicyPage
      title={t(language, "policies.returns.title")}
      intro={t(language, "policies.returns.intro")}
      lastUpdated={t(language, "policies.lastUpdatedDate")}
      sections={[
        {
          title: t(language, "policies.returns.sections.eligibility.title"),
          body: [
            t(language, "policies.returns.sections.eligibility.p1"),
            t(language, "policies.returns.sections.eligibility.p2"),
          ],
        },
        {
          title: t(language, "policies.returns.sections.process.title"),
          body: [
            t(language, "policies.returns.sections.process.p1"),
            t(language, "policies.returns.sections.process.p2"),
          ],
        },
        {
          title: t(language, "policies.returns.sections.refund.title"),
          body: [
            t(language, "policies.returns.sections.refund.p1"),
            t(language, "policies.returns.sections.refund.p2"),
          ],
        },
      ]}
    />
  );
};

export default Returns;
