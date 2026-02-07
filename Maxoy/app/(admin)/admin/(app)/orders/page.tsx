import OrdersManager from "@/features/admin/orders/OrdersManager";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function OrdersPage() {
  const { user } = await requirePermissionServer("orders:read");
  if (!user) return null;
  return (
    <OrdersManager />
  );
}
