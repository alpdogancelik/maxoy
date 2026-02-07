import ProductImportExport from "@/features/admin/products/ProductImportExport";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function ProductImportPage() {
  const { user } = await requirePermissionServer("products:import-export");
  if (!user) return null;
  return (
    <ProductImportExport />
  );
}
