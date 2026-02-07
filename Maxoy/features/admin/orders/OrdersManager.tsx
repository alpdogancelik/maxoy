"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  Drawer,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  useConfirm,
} from "@/features/admin/ui-kit";

type OrderItem = {
  id: string;
  status: string;
  total: number | string;
  paymentMethod?: string;
  createdAt: string;
  customerInfo?: { fullName: string; phone: string };
};

export default function OrdersManager() {
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "100");

    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Failed to load orders");
      setOrders([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrders(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, from, to]);

  useEffect(() => {
    const t = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const formatMoney = (value: number | string | undefined) => {
    if (value === undefined) return "—";
    const num = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(num)) return String(value);
    return `${num.toFixed(2)} ₺`;
  };

  const statusTone = (s: string) => {
    if (s === "PAID" || s === "DELIVERED") return "success";
    if (s === "PENDING" || s === "PREPARING") return "warn";
    if (s === "CANCELLED" || s === "REFUNDED") return "danger";
    return "neutral";
  };

  const updateStatus = async (id: string, nextStatus: string) => {
    const current = orders.find((o) => o.id === id)?.status || "PENDING";
    const STATUS_RANK: Record<string, number> = {
      PENDING: 0,
      PAID: 1,
      PREPARING: 2,
      SHIPPED: 3,
      DELIVERED: 4,
      CANCELLED: 10,
      REFUNDED: 11,
    };
    const backwards = (STATUS_RANK[nextStatus] ?? 0) < (STATUS_RANK[current] ?? 0);
    const cancelOrRefund = nextStatus === "CANCELLED" || nextStatus === "REFUNDED";
    const reason = cancelOrRefund ? window.prompt("Reason (required):")?.trim() : "";
    if (cancelOrRefund && (!reason || reason.length < 3)) {
      toast.error("Reason is required");
      return;
    }

    const ok = await confirm({
      title: "Update order status?",
      description: backwards
        ? `You're changing ${current} → ${nextStatus}. This is a backward transition.`
        : `Change status to ${nextStatus}?`,
      confirmText: "Update",
      cancelText: "Cancel",
      variant: nextStatus === "CANCELLED" || nextStatus === "REFUNDED" ? "danger" : "primary",
    });
    if (!ok) return;

    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));

    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, adminNote: cancelOrRefund ? reason : undefined, force: backwards ? true : undefined }),
    });
    if (!res.ok) {
      setOrders(prev);
      toast.error("Failed to update status");
      return;
    }
    toast.success("Order updated");
  };

  const addNote = async (id: string) => {
    const note = window.prompt("Admin note:");
    if (!note) return;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: note }),
    });
    if (!res.ok) {
      toast.error("Failed to save note");
      return;
    }
    toast.success("Note saved");
    load();
  };

  const viewDetail = async (id: string) => {
    setSelectedId(id);
    setSelected(null);
    setDetailLoading(true);
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) {
      setDetailLoading(false);
      toast.error("Failed to load order");
      return;
    }
    const data = await res.json();
    setSelected(data);
    setDetailLoading(false);
  };

  const filteredCountLabel = useMemo(() => {
    const parts: string[] = [];
    if (status) parts.push(`status=${status}`);
    if (q.trim()) parts.push(`q="${q.trim()}"`);
    if (from) parts.push(`from=${from}`);
    if (to) parts.push(`to=${to}`);
    return parts.length ? parts.join(", ") : "all orders";
  }, [status, q, from, to]);

  const downloadCsv = () => {
    const header = [
      "orderId",
      "orderNo",
      "customer",
      "phone",
      "total",
      "payment",
      "status",
      "createdAt",
    ];
    const rows = orders.map((o) => [
      o.id,
      `#${o.id.slice(-6)}`,
      o.customerInfo?.fullName || "",
      o.customerInfo?.phone || "",
      String(o.total ?? ""),
      o.paymentMethod || "",
      o.status,
      o.createdAt,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminContainer>
      <PageHeader
        title="Orders"
        description="Search, filter, view details, and update statuses."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={downloadCsv} disabled={loading || orders.length === 0}>
              Export CSV
            </Button>
          </>
        }
      />

      <Card>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PREPARING">Preparing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </Select>
            </FormField>
            <FormField label="Search" helperText="Name, phone, or order ID">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Ayşe / 05… / cuid…" />
            </FormField>
            <FormField label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </FormField>
            <FormField label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </FormField>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 13 }}>
              Showing <strong>{orders.length}</strong> for {filteredCountLabel}
            </div>
            {(status || q || from || to) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatus("");
                  setQ("");
                  setFrom("");
                  setTo("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ) : error ? (
            <EmptyState
              title="Couldn’t load orders"
              description={error}
              action={
                <Button variant="primary" onClick={load}>
                  Retry
                </Button>
              }
            />
          ) : orders.length === 0 ? (
            <EmptyState title="No orders found" description="Try adjusting filters or search." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr hover={false}>
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Phone</Th>
                    <Th>Total</Th>
                    <Th>Payment</Th>
                    <Th>Status</Th>
                    <Th>Created</Th>
                    <Th>Delivery</Th>
                    <Th>Actions</Th>
                  </Tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <Tr key={order.id}>
                      <Td>
                        <div style={{ fontWeight: 700 }}>#{order.id.slice(-6)}</div>
                        <div style={{ color: "rgba(17,24,39,0.55)", fontSize: 12 }}>{order.id}</div>
                      </Td>
                      <Td>{order.customerInfo?.fullName || "—"}</Td>
                      <Td>{order.customerInfo?.phone || "—"}</Td>
                      <Td>{formatMoney(order.total)}</Td>
                      <Td>{order.paymentMethod || "—"}</Td>
                      <Td>
                        <Badge tone={statusTone(order.status) as any}>{order.status}</Badge>
                      </Td>
                      <Td>{new Date(order.createdAt).toLocaleString()}</Td>
                      <Td>—</Td>
                      <Td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button variant="secondary" onClick={() => viewDetail(order.id)}>
                            View
                          </Button>
                          <Link href={`/admin/orders/${order.id}`} style={{ alignSelf: "center" }}>
                            Open
                          </Link>
                          <Link href={`/admin/orders/${order.id}/print`} target="_blank" rel="noreferrer" style={{ alignSelf: "center" }}>
                            Print
                          </Link>
                          <Select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            aria-label="Update status"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="PREPARING">Preparing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUNDED">Refunded</option>
                          </Select>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardBody>
      </Card>

      <Drawer
        open={Boolean(selectedId)}
        title={selected ? `Order #${selected.id?.slice?.(-6)}` : "Order details"}
        onClose={() => {
          setSelectedId(null);
          setSelected(null);
        }}
      >
        {detailLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={18} />
          </div>
        ) : selected ? (
          <>
            <Card>
              <CardBody>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Customer</div>
                    <div style={{ fontWeight: 700 }}>{selected.customerInfo?.fullName || "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Phone</div>
                    <div style={{ fontWeight: 700 }}>{selected.customerInfo?.phone || "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Payment</div>
                    <div style={{ fontWeight: 700 }}>{selected.paymentMethod || "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Status</div>
                    <div style={{ marginTop: 6 }}>
                      <Badge tone={statusTone(selected.status) as any}>{selected.status}</Badge>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={() => addNote(selected.id)}>
                    Add note
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const text = [
                        `Order: ${selected.id}`,
                        `Customer: ${selected.customerInfo?.fullName || ""}`,
                        `Phone: ${selected.customerInfo?.phone || ""}`,
                        `Status: ${selected.status}`,
                        `Total: ${selected.total}`,
                      ].join("\n");
                      navigator.clipboard.writeText(text);
                      toast.success("Copied summary");
                    }}
                  >
                    Copy summary
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    Print
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Items</div>
                {selected.items?.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {selected.items.map((item: any) => (
                      <li key={item.id}>
                        {item.productName} × {item.quantity} — {formatMoney(item.lineTotal)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: "rgba(17,24,39,0.65)" }}>No items</div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Address</div>
                <div style={{ color: "rgba(17,24,39,0.85)", lineHeight: 1.5 }}>
                  {selected.address?.line1}
                  {selected.address?.line2 ? `, ${selected.address.line2}` : ""}
                  <br />
                  {selected.address?.district ? `${selected.address.district}, ` : ""}
                  {selected.address?.city} {selected.address?.postalCode || ""}
                  <br />
                  {selected.address?.country}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Timeline</div>
                <div style={{ color: "rgba(17,24,39,0.8)", fontSize: 13 }}>
                  Created: {new Date(selected.createdAt).toLocaleString()}
                  <br />
                  Updated: {new Date(selected.updatedAt).toLocaleString()}
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          <EmptyState title="Order not loaded" description="Select an order again." />
        )}
      </Drawer>
    </AdminContainer>
  );
}
