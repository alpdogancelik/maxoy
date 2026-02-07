import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/addressesPage.module.scss";
import { useStateContext } from "../../context/StateContext";
import { AUTH_COOKIE } from "../../lib/auth";
import { t } from "../../constants/i18n";
import AddressForm from "../../components/address/AddressForm";
import AddressCard from "../../components/address/AddressCard";
import EmptyState from "../../components/feedback/EmptyState";

const AddressesPage = () => {
  const {
    language,
    authReady,
    isAuthenticated,
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    selectedAddressId,
    setSelectedAddressId,
  } = useStateContext();
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

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

  const handleCreate = (values) => {
    addAddress(values);
    setFormOpen(false);
  };

  const handleUpdate = (values) => {
    if (!editing?.id) return;
    updateAddress(editing.id, values);
    setEditing(null);
    setFormOpen(false);
  };

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1>{t(language, "address.bookTitle")}</h1>
          <p>{t(language, "address.bookSubtitle")}</p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          {t(language, "address.addNew")}
        </button>
      </div>

      {formOpen && (
        <div className={styles.formWrapper}>
          <AddressForm
            initialValue={editing}
            showDefaultToggle
            submitLabel={editing ? t(language, "actions.update") : t(language, "actions.save")}
            onCancel={() => {
              setEditing(null);
              setFormOpen(false);
            }}
            onSubmit={editing ? handleUpdate : handleCreate}
          />
        </div>
      )}

      {addresses.length === 0 ? (
        <EmptyState
          title={t(language, "address.emptyTitle")}
          description={t(language, "address.emptyBody")}
          actionLabel={t(language, "address.addNew")}
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className={styles.grid}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selected={address.id === selectedAddressId}
              onSelect={() => setSelectedAddressId(address.id)}
              onEdit={() => {
                setEditing(address);
                setFormOpen(true);
              }}
              onDelete={() => removeAddress(address.id)}
              onMakeDefault={() => setDefaultAddress(address.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;

export const getServerSideProps = async ({ req, resolvedUrl }) => {
  const authCookie = req.cookies?.[AUTH_COOKIE];
  if (!authCookie) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/account/addresses")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
