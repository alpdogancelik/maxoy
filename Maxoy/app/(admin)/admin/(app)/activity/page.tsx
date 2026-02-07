import ActivityLog from "@/features/admin/activity/ActivityLog";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function ActivityPage() {
  const { user } = await requirePermissionServer("activity:read");
  if (!user) return null;
  return <ActivityLog />;
}
