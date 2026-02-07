"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardBody, EmptyState, Skeleton } from "@/features/admin/ui-kit";

function formatMoney(value: any) {
  if (value === undefined || value === null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `${num.toFixed(2)} ₺`;
}

export default function OrderPrintPage({ id }: { id: string }) {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!loading && order) {
      // Let layout paint once
      setTimeout(() => window.print(), 50);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={18} />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title="Couldn’t load order"
            description={error}
            action={
              <button
                onClick={() => {
                  toast.dismiss();
                  load();
                }}
              >
                Retry
              </button>
            }
          />
        </CardBody>
      </Card>
    );
  }

  if (!order) return null;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Maxoy</div>
          <div style={{ color: "rgba(0,0,0,0.65)" }}>Order invoice</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900 }}>Order #{String(order.id).slice(-6)}</div>
          <div style={{ color: "rgba(0,0,0,0.65)" }}>{String(order.id)}</div>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Customer</div>
          <div>{order.customerInfo?.fullName || "—"}</div>
          <div>{order.customerInfo?.phone || "—"}</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Address</div>
          <div style={{ lineHeight: 1.4 }}>
            {order.address?.line1}
            {order.address?.line2 ? `, ${order.address.line2}` : ""}
            <br />
            {order.address?.district ? `${order.address.district}, ` : ""}
            {order.address?.city} {order.address?.postalCode || ""}
            <br />
            {order.address?.country}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Summary</div>
          <div>Status: {order.status}</div>
          <div>Payment: {order.paymentMethod}</div>
          <div>Total: {formatMoney(order.total)}</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 12 }}>
            Created: {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ fontWeight: 900, marginBottom: 8 }}>Items</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>Product</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>Qty</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>Line total</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((it: any) => (
            <tr key={it.id}>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 6px" }}>{it.productName}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #f0f0f0", padding: "8px 6px" }}>{it.quantity}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #f0f0f0", padding: "8px 6px" }}>{formatMoney(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 14, textAlign: "right", fontWeight: 900 }}>Total: {formatMoney(order.total)}</div>
    </div>
  );
}

