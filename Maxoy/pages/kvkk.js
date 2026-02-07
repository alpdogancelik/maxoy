import React from "react";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import PolicyPage from "../components/policy/PolicyPage";

const Kvkk = () => {
  const { language } = useStateContext();
  return (
    <PolicyPage
      title={t(language, "policies.kvkk.title")}
      intro={t(language, "policies.kvkk.intro")}
      lastUpdated={t(language, "policies.lastUpdatedDate")}
      sections={[
        {
          title: t(language, "policies.kvkk.sections.controller.title"),
          body: [
            t(language, "policies.kvkk.sections.controller.p1"),
            t(language, "policies.kvkk.sections.controller.p2"),
          ],
        },
        {
          title: t(language, "policies.kvkk.sections.purpose.title"),
          body: [
            t(language, "policies.kvkk.sections.purpose.p1"),
            t(language, "policies.kvkk.sections.purpose.p2"),
          ],
        },
        {
          title: t(language, "policies.kvkk.sections.rights.title"),
          body: [
            t(language, "policies.kvkk.sections.rights.p1"),
            t(language, "policies.kvkk.sections.rights.p2"),
          ],
        },
      ]}
    />
  );
};

export default Kvkk;
