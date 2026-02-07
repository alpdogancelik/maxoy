import { ReactNode } from "react";
import styles from "./admin-shell.module.scss";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { SessionUser } from "@/lib/admin-auth";
import AdminProviders from "./AdminProviders";

export default function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser;
}) {
  return (
    <AdminProviders>
      <div className={styles.shell}>
        <AdminSidebar user={user} />
        <div className={styles.main}>
          <AdminTopbar user={user} />
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </AdminProviders>
  );
}
