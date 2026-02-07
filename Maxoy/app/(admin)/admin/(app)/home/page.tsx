import HomeBuilder from "@/features/admin/home-builder/HomeBuilder";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function HomeBuilderPage() {
  const { user } = await requirePermissionServer("home-builder:read");
  if (!user) return null;
  return (
    <HomeBuilder />
  );
}
