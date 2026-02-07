"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AdminContainer,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useConfirm,
} from "@/features/admin/ui-kit";

type OrderDetail = any;

const STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 10,
  REFUNDED: 11,
};

function statusTone(s: string) {
  if (s === "PAID" || s === "DELIVERED") return "success";
  if (s === "PENDING" || s === "PREPARING") return "warn";
  if (s === "CANCELLED" || s === "REFUNDED") return "danger";
  return "neutral";
}

function formatMoney(value: any) {
  if (value === undefined || value === null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `${num.toFixed(2)} ₺`;
}

export default function OrderDetailsPage({ id, role }: { id: string; role: string }) {
  const { confirm } = useConfirm();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<string>("");
  const [reason, setReason] = useState("");

  const isAdmin = role === "ADMIN";

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Failed to load order");
      setOrder(null);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrder(data);
    setNextStatus(data.status);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const timeline = useMemo(() => {
    if (!order) return [];
    const s = String(order.status);
    if (s === "CANCELLED") {
      return ["CREATED", "CANCELLED"];
    }
    if (s === "REFUNDED") {
      return ["CREATED", "PAID", "REFUNDED"];
    }
    const steps = ["CREATED", "PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED"];
    const rank = STATUS_RANK[s] ?? 0;
    return steps.filter((step) => {
      if (step === "CREATED") return true;
      return (STATUS_RANK[step] ?? 0) <= rank;
    });
  }, [order]);

  const submitStatus = async () => {
    if (!order) return;
    const cur = String(order.status);
    const next = String(nextStatus);

    const curRank = STATUS_RANK[cur] ?? 0;
    const nextRank = STATUS_RANK[next] ?? 0;
    const backwards = nextRank < curRank;
    const cancelOrRefund = next === "CANCELLED" || next === "REFUNDED";

    if (cancelOrRefund && reason.trim().length < 3) {
      toast.error("Reason is required for cancel/refund");
      return;
    }

    if (backwards) {
      const ok = await confirm({
        title: "Move status backwards?",
        description: `You're changing ${cur} → ${next}. This is a backward transition.`,
        confirmText: "Proceed",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
    } else {
      const ok = await confirm({
        title: "Update order status?",
        description: `Change ${cur} → ${next}?`,
        confirmText: "Update",
        cancelText: "Cancel",
        variant: cancelOrRefund ? "danger" : "primary",
      });
      if (!ok) return;
    }

    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next,
        adminNote: cancelOrRefund ? reason.trim() : undefined,
        force: backwards ? true : undefined,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || "Status update failed");
      return;
    }
    toast.success("Order updated");
    setReason("");
    load();
  };

  const saveInternalNote = async () => {
    if (!isAdmin) return;
    const note = reason.trim();
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: note }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || "Failed to save note");
      return;
    }
    toast.success("Note saved");
    setReason("");
    load();
  };

  return (
    <AdminContainer>
      <PageHeader
        title={order ? `Order #${String(order.id).slice(-6)}` : "Order"}
        description={order ? String(order.id) : id}
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Link href={`/admin/orders/${id}/print`} target="_blank" rel="noreferrer">
              Print view
            </Link>
          </>
        }
      />

      <div style={{ marginBottom: 12 }}>
        <Link href="/admin/orders">← Back to orders</Link>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody>
            <EmptyState title="Couldn’t load order" description={error} action={<Button onClick={load}>Retry</Button>} />
          </CardBody>
        </Card>
      ) : !order ? null : (
        <>
          <Card>
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div>
                  <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Customer</div>
                  <div style={{ fontWeight: 800 }}>{order.customerInfo?.fullName || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Phone</div>
                  <div style={{ fontWeight: 800 }}>{order.customerInfo?.phone || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Total</div>
                  <div style={{ fontWeight: 800 }}>{formatMoney(order.total)}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>Status</div>
                  <div style={{ marginTop: 6 }}>
                    <Badge tone={statusTone(String(order.status)) as any}>{String(order.status)}</Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Timeline</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {timeline.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
                <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 12 }}>
                  Created: {new Date(order.createdAt).toLocaleString()} · Updated: {new Date(order.updatedAt).toLocaleString()}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Update status</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <FormField label="Next status">
                  <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </Select>
                </FormField>
                {nextStatus === "CANCELLED" || nextStatus === "REFUNDED" ? (
                  <FormField label="Reason (required)" helperText="Required for cancel/refund. This is stored as the cancel/refund reason.">
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer requested cancellation" />
                  </FormField>
                ) : null}
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Button variant="primary" onClick={submitStatus}>
                    Save status
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {isAdmin ? (
            <Card>
              <CardBody>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Internal notes (ADMIN)</div>
                <div style={{ color: "rgba(17,24,39,0.7)", fontSize: 13, marginBottom: 10 }}>
                  Current: {order.adminNote ? String(order.adminNote) : "—"}
                </div>
                <FormField label="Set internal note">
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Internal note…" />
                </FormField>
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <Button variant="secondary" onClick={saveInternalNote}>
                    Save note
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Items</div>
              {order.items?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                  {order.items.map((item: any) => (
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
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Address</div>
              <div style={{ color: "rgba(17,24,39,0.85)", lineHeight: 1.5 }}>
                {order.address?.line1}
                {order.address?.line2 ? `, ${order.address.line2}` : ""}
                <br />
                {order.address?.district ? `${order.address.district}, ` : ""}
                {order.address?.city} {order.address?.postalCode || ""}
                <br />
                {order.address?.country}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </AdminContainer>
  );
}

