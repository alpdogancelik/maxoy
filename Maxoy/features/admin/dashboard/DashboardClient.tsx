"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  DbStatusBanner,
  EmptyState,
  PageHeader,
  Skeleton,
  Table,
  TableWrap,
  Td,
  Th,
  TinyBarChart,
  Tr,
} from "@/features/admin/ui-kit";

type DbStatus = "online" | "offline" | "unknown";

type DashboardPayload = {
  counts: { products: number; categories: number; media: number; orders: number };
  recentOrders: Array<{
    id: string;
    status: string;
    total: number | string;
    createdAt: string;
    customerInfo?: { fullName: string; phone: string };
  }>;
  lowStock: Array<{ id: string; sku: string; nameTR: string; stockQty: number; isActive: boolean }>;
  chart: { days: string[]; series: number[]; rangeDays?: 7 | 30 };
  chart30?: { days: string[]; series: number[]; rangeDays: 30 };
  dbOffline?: boolean;
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<{ status: DbStatus; detail?: string }>({
    status: "unknown",
  });
  const [chartRange, setChartRange] = useState<7 | 30>(7);

  const load = async () => {
    setLoading(true);

    const [dashboardRes, healthRes] = await Promise.all([
      fetch("/api/admin/dashboard").catch(() => null),
      fetch("/api/health/db").catch(() => null),
    ]);

    // Health (best-effort)
    if (!healthRes) {
      setHealth({ status: "unknown", detail: "Health check unreachable" });
    } else {
      const payload = await healthRes.json().catch(() => null);
      if (!payload) {
        setHealth({ status: "unknown", detail: "Health check unreadable" });
      } else {
        const ok = Boolean(payload.ok);
        setHealth({ status: ok ? "online" : "offline", detail: ok ? "OK" : "DB unreachable" });
      }
    }

    // Dashboard payload (tolerant)
    if (!dashboardRes) {
      setData({
        counts: { products: 0, categories: 0, media: 0, orders: 0 },
        recentOrders: [],
        lowStock: [],
        chart: { days: [], series: [], rangeDays: 7 },
        chart30: undefined,
        dbOffline: true,
      });
      toast.error("Failed to load dashboard");
      setLoading(false);
      return;
    }

    const payload = (await dashboardRes.json().catch(() => null)) as DashboardPayload | null;
    if (!payload) {
      setData({
        counts: { products: 0, categories: 0, media: 0, orders: 0 },
        recentOrders: [],
        lowStock: [],
        chart: { days: [], series: [], rangeDays: 7 },
        chart30: undefined,
        dbOffline: true,
      });
      toast.error("Failed to load dashboard");
      setLoading(false);
      return;
    }

    setData(payload);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const dbStatus: DbStatus = useMemo(() => {
    if (health.status !== "unknown") return health.status;
    if (!data) return "unknown";
    return data.dbOffline ? "offline" : "online";
  }, [data, health.status]);

  const chartData = useMemo(() => {
    if (!data) return { days: [] as string[], series: [] as number[] };
    if (chartRange === 30 && data.chart30) return { days: data.chart30.days, series: data.chart30.series };
    return { days: data.chart.days, series: data.chart.series };
  }, [chartRange, data]);

  return (
    <AdminContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of products, categories, media, and orders."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <DbStatusBanner
        status={dbStatus}
        message={
          dbStatus === "offline"
            ? "Some widgets may show placeholders until the database is reachable."
            : dbStatus === "online"
              ? "All systems look good."
              : "Checking connectivity…"
        }
        onRetry={load}
        retryDisabled={loading}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {loading || !data ? (
          <>
            <Skeleton height={92} />
            <Skeleton height={92} />
            <Skeleton height={92} />
            <Skeleton height={92} />
          </>
        ) : (
          <>
            {[
              ["Products", data.counts.products],
              ["Categories", data.counts.categories],
              ["Media assets", data.counts.media],
              ["Orders", data.counts.orders],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <CardBody>
                  <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 12 }}>{label}</div>
                  <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900 }}>{value}</div>
                </CardBody>
              </Card>
            ))}
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <Card>
          <CardBody>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>
                  Orders (last {chartRange} days)
                </div>
                <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Lightweight chart</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  variant={chartRange === 7 ? "primary" : "secondary"}
                  onClick={() => setChartRange(7)}
                  disabled={loading}
                >
                  7d
                </Button>
                <Button
                  variant={chartRange === 30 ? "primary" : "secondary"}
                  onClick={() => setChartRange(30)}
                  disabled={loading || !data?.chart30?.series?.length}
                >
                  30d
                </Button>
              </div>
            </div>

            <TinyBarChart days={chartData.days} series={chartData.series} loading={loading || !data} height={64} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Recent orders</div>
                <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Last 10 orders</div>
              </div>
              <Button variant="secondary" onClick={() => (window.location.href = "/admin/orders")}>
                Open Orders
              </Button>
            </div>

            <div style={{ marginTop: 12 }}>
              {loading || !data ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                </div>
              ) : data.recentOrders.length === 0 ? (
                <EmptyState title="No recent orders" description="Orders will show up here when created." />
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <Tr hover={false}>
                        <Th>Order</Th>
                        <Th>Customer</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((o) => (
                        <Tr key={o.id}>
                          <Td>
                            <div style={{ fontWeight: 800 }}>#{o.id.slice(-6)}</div>
                            <div style={{ color: "rgba(17,24,39,0.55)", fontSize: 12 }}>{o.id}</div>
                          </Td>
                          <Td>{o.customerInfo?.fullName || "—"}</Td>
                          <Td>
                            <Badge
                              tone={
                                o.status === "PAID" || o.status === "DELIVERED"
                                  ? "success"
                                  : o.status === "PENDING" || o.status === "PREPARING"
                                    ? "warn"
                                    : o.status === "CANCELLED" || o.status === "REFUNDED"
                                      ? "danger"
                                      : "neutral"
                              }
                            >
                              {o.status}
                            </Badge>
                          </Td>
                          <Td>{new Date(o.createdAt).toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Low stock</div>
                <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Products with stock ≤ 5</div>
              </div>
              <Button variant="secondary" onClick={() => (window.location.href = "/admin/products")}>
                Open Products
              </Button>
            </div>

            <div style={{ marginTop: 12 }}>
              {loading || !data ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                </div>
              ) : data.lowStock.length === 0 ? (
                <EmptyState title="No low-stock products" description="Looks good—nothing needs restocking right now." />
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <Tr hover={false}>
                        <Th>SKU</Th>
                        <Th>Product</Th>
                        <Th>Stock</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {data.lowStock.map((p) => (
                        <Tr key={p.id}>
                          <Td>{p.sku}</Td>
                          <Td>{p.nameTR}</Td>
                          <Td>
                            <Badge tone={p.stockQty === 0 ? "danger" : "warn"}>{String(p.stockQty)}</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminContainer>
  );
}

