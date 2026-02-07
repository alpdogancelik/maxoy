import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useStateContext } from "../context/StateContext";
import { AUTH_COOKIE } from "../lib/auth";
import { t } from "../constants/i18n";
import styles from "../styles/accountPage.module.scss";

const Account = () => {
  const { language, authInfo, isAuthenticated, authReady, signOut, addresses } =
    useStateContext();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [authReady, isAuthenticated, router]);

  if (!authReady || !isAuthenticated) {
    return (
      <div className={`container ${styles.page}`}>
        <p>{t(language, "misc.redirecting")}</p>
      </div>
    );
  }

  const profileName = authInfo?.session?.fullName || authInfo?.registration?.fullName || "-";
  const profileEmail = authInfo?.session?.email || authInfo?.login?.email || "-";

  const handleLogout = () => {
    signOut();
    router.push("/");
  };

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1>{t(language, "accountPage.title")}</h1>
        <p>{t(language, "accountPage.subtitle")}</p>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>{t(language, "accountPage.profileTitle")}</h2>
          <div className={styles.profileList}>
            <div>
              <span>{t(language, "account.fullName")}:</span> {profileName}
            </div>
            <div>
              <span>{t(language, "account.email")}:</span> {profileEmail}
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>{t(language, "accountPage.ordersTitle")}</h2>
          <p className={styles.empty}>{t(language, "accountPage.ordersEmpty")}</p>
        </section>

        <section className={styles.card}>
          <h2>{t(language, "accountPage.addressesTitle")}</h2>
          {addresses.length === 0 ? (
            <p className={styles.empty}>{t(language, "accountPage.addressesEmpty")}</p>
          ) : (
            <p className={styles.empty}>
              {t(language, "accountPage.addressesCount", { count: addresses.length })}
            </p>
          )}
          <Link href="/account/addresses" className={styles.linkButton}>{t(language, "accountPage.manageAddresses")}</Link>
        </section>
      </div>

      <div className={styles.logoutRow}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          {t(language, "accountPage.logout")}
        </button>
      </div>
    </div>
  );
};

export default Account;

export const getServerSideProps = async ({ req, resolvedUrl }) => {
  const authCookie = req.cookies?.[AUTH_COOKIE];
  if (!authCookie) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/account")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
