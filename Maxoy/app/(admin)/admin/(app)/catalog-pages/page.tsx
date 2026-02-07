import CatalogPagesManager from "@/features/admin/catalog-pages/CatalogPagesManager";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function CatalogPagesPage() {
  const { user } = await requirePermissionServer("catalog-pages:read");
  if (!user) return null;
  return <CatalogPagesManager />;
}

