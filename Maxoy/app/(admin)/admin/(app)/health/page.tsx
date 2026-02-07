import HealthClient from "@/features/admin/health/HealthClient";
import { requirePermissionServer } from "@/lib/admin-permissions-server";

export default async function HealthPage() {
    const { user } = await requirePermissionServer("dashboard:read");
    if (!user) return null;
    return <HealthClient />;
}

