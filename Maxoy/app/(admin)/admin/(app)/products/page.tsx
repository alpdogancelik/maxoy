import ProductManager from "@/features/admin/products/ProductManager";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function ProductsPage() {
  const { user } = await requirePermissionServer("products:read");
  if (!user) return null;
  return <ProductManager />;
}
