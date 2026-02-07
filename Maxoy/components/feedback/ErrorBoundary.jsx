import React from "react";
import styles from "./ErrorBoundary.module.scss";
import { t } from "@/constants/i18n";
import { useStateContext } from "@/context/StateContext";

class ErrorBoundaryCore extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback || null;
  }
}

const ErrorBoundary = ({ children }) => {
  const { language } = useStateContext();
  return (
    <ErrorBoundaryCore
      fallback={
        <div className={styles.fallback}>
          <h2>{t(language, "states.errorTitle")}</h2>
          <p>{t(language, "states.errorBody")}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {t(language, "actions.tryAgain")}
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundaryCore>
  );
};

export default ErrorBoundary;
