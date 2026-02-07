import React from "react";

import styles from "./TopBar.module.scss";

const TopBar = ({ message }) => {
  if (!message) return null;
  return <div className={styles.topbar}>{message}</div>;
};

export default TopBar;
