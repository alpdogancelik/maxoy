import MediaLibrary from "@/features/admin/media/MediaLibrary";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function MediaPage() {
  const { user } = await requirePermissionServer("media:read");
  if (!user) return null;
  return (
    <MediaLibrary role={user.role.name} />
  );
}
