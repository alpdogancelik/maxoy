import React from "react";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import PolicyPage from "../components/policy/PolicyPage";

const Shipping = () => {
  const { language } = useStateContext();
  return (
    <PolicyPage
      title={t(language, "policies.shipping.title")}
      intro={t(language, "policies.shipping.intro")}
      lastUpdated={t(language, "policies.lastUpdatedDate")}
      sections={[
        {
          title: t(language, "policies.shipping.sections.dispatch.title"),
          body: [
            t(language, "policies.shipping.sections.dispatch.p1"),
            t(language, "policies.shipping.sections.dispatch.p2"),
          ],
        },
        {
          title: t(language, "policies.shipping.sections.delivery.title"),
          body: [
            t(language, "policies.shipping.sections.delivery.p1"),
            t(language, "policies.shipping.sections.delivery.p2"),
          ],
        },
        {
          title: t(language, "policies.shipping.sections.cost.title"),
          body: [
            t(language, "policies.shipping.sections.cost.p1"),
            t(language, "policies.shipping.sections.cost.p2"),
          ],
        },
      ]}
    />
  );
};

export default Shipping;
