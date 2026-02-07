"use client";

import { useTransition } from "react";
import styles from "./admin-shell.module.scss";
import { SessionUser } from "@/lib/admin-auth";

export default function AdminTopbar({ user }: { user: SessionUser }) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    });
  };

  return (
    <header className={styles.topbar}>
      <div>
        <strong>Welcome</strong> {user.name || user.email}
      </div>
      <button data-testid="admin-logout" className={styles.logout} onClick={handleLogout} disabled={isPending}>
        {isPending ? "Logging out..." : "Logout"}
      </button>
    </header>
  );
}
