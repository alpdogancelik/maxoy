import OrderPrintPage from "@/features/admin/orders/OrderPrintPage";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function OrderPrintRoute({ params }: { params: { id: string } }) {
    const { user } = await requirePermissionServer("orders:read");
    if (!user) return null;
    return <OrderPrintPage id={params.id} />;
}

