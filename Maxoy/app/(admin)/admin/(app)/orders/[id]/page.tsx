import OrderDetailsPage from "@/features/admin/orders/OrderDetailsPage";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function OrderDetailRoute({ params }: { params: { id: string } }) {
    const { user } = await requirePermissionServer("orders:read");
    if (!user) return null;
    return <OrderDetailsPage id={params.id} role={user.role.name} />;
}

