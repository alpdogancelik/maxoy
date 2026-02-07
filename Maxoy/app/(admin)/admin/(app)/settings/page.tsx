import SettingsForm from "@/features/admin/settings/SettingsForm";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function SettingsPage() {
  const { user } = await requirePermissionServer("settings:read");
  if (!user) return null;
  return (
    <SettingsForm />
  );
}
