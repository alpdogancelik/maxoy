import React from "react";
import { useStateContext } from "../context/StateContext";
import { t } from "../constants/i18n";
import PolicyPage from "../components/policy/PolicyPage";

const Privacy = () => {
  const { language } = useStateContext();
  return (
    <PolicyPage
      title={t(language, "policies.privacy.title")}
      intro={t(language, "policies.privacy.intro")}
      lastUpdated={t(language, "policies.lastUpdatedDate")}
      sections={[
        {
          title: t(language, "policies.privacy.sections.collect.title"),
          body: [
            t(language, "policies.privacy.sections.collect.p1"),
            t(language, "policies.privacy.sections.collect.p2"),
          ],
        },
        {
          title: t(language, "policies.privacy.sections.use.title"),
          body: [
            t(language, "policies.privacy.sections.use.p1"),
            t(language, "policies.privacy.sections.use.p2"),
          ],
        },
        {
          title: t(language, "policies.privacy.sections.rights.title"),
          body: [
            t(language, "policies.privacy.sections.rights.p1"),
            t(language, "policies.privacy.sections.rights.p2"),
          ],
        },
      ]}
    />
  );
};

export default Privacy;
