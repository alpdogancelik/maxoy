import CategoryManager from "@/features/admin/categories/CategoryManager";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function CategoriesPage() {
  const { user } = await requirePermissionServer("categories:read");
  if (!user) return null;
  return <CategoryManager />;
}
