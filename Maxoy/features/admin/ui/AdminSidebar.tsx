"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./admin-shell.module.scss";
import { SessionUser } from "@/lib/admin-auth";
import type { Permission } from "@/lib/admin-permissions";
import { hasAnyPermission } from "@/lib/admin-permissions";
import { useConfirm, useUnsavedChangesContext } from "@/features/admin/ui-kit";

const links = [
  { href: "/admin", label: "Dashboard", permissions: ["dashboard:read"] as Permission[] },
  { href: "/admin/media", label: "Media", permissions: ["media:read"] as Permission[] },
  { href: "/admin/categories", label: "Categories", permissions: ["categories:read"] as Permission[] },
  { href: "/admin/products", label: "Products", permissions: ["products:read"] as Permission[] },
  { href: "/admin/home", label: "Home Builder", permissions: ["home-builder:read"] as Permission[] },
  { href: "/admin/catalog-pages", label: "Catalog Pages", permissions: ["catalog-pages:read"] as Permission[] },
  { href: "/admin/orders", label: "Orders", permissions: ["orders:read"] as Permission[] },
  { href: "/admin/settings", label: "Settings", permissions: ["settings:read"] as Permission[] },
  { href: "/admin/activity", label: "Activity", permissions: ["activity:read"] as Permission[] },
  { href: "/admin/products/import", label: "Import/Export", permissions: ["products:import-export"] as Permission[] },
];

export default function AdminSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirm } = useConfirm();
  const { state } = useUnsavedChangesContext();

  const onNav = async (href: string) => {
    if (state.dirty) {
      const ok = await confirm({
        title: "Unsaved changes",
        description: state.message || "You have unsaved changes. Leave this page?",
        confirmText: "Leave page",
        cancelText: "Stay",
        variant: "danger",
      });
      if (!ok) return;
    }
    router.push(href);
  };

  return (
    <aside className={styles.sidebar} suppressHydrationWarning>
      <div className={styles.brand}>Maxoy Admin</div>
      <nav className={styles.nav}>
        {links
          .filter((link) => hasAnyPermission(user, link.permissions))
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ""}`}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onNav(link.href);
              }}
            >
              {link.label}
            </Link>
          ))}
      </nav>
    </aside>
  );
}
