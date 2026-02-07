import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminShell from "@/features/admin/ui/AdminShell";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requirePermissionServer(["dashboard:read"]);
  if (!user) {
    redirect("/admin/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
