"use client";

import { useEffect, useState } from "react";
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
  Skeleton,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/features/admin/ui-kit";

type LogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { email: string };
  before?: unknown;
  after?: unknown;
};

export default function ActivityLog() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);
  const [selected, setSelected] = useState<LogItem | null>(null);

  const diffKeys = (before: any, after: any) => {
    const b = before && typeof before === "object" ? before : {};
    const a = after && typeof after === "object" ? after : {};
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    const changed: string[] = [];
    keys.forEach((k) => {
      const bv = (b as any)[k];
      const av = (a as any)[k];
      if (JSON.stringify(bv) !== JSON.stringify(av)) changed.push(k);
    });
    return changed.sort();
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    if (actor) params.set("actor", actor);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/activity?${params.toString()}`);
    if (!res.ok) {
      setLoading(false);
      toast.error("Failed to load activity");
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setDbOffline(Boolean(data.dbOffline));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminContainer>
      <PageHeader
        title="Activity"
        description="Audit log of admin actions."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      {dbOffline ? (
        <Card>
          <CardBody>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="warn">DB offline</Badge>
              <div style={{ color: "rgba(17,24,39,0.7)", fontSize: 13 }}>
                Activity log is unavailable without a database.
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <FormField label="Search">
              <Input
                placeholder="Entity type, entity id, actor email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </FormField>
            <FormField label="Action">
              <Input placeholder="CREATE / UPDATE / DELETE / RESTORE" value={action} onChange={(e) => setAction(e.target.value)} />
            </FormField>
            <FormField label="Entity type">
              <Input placeholder="Order, Product, Category..." value={entityType} onChange={(e) => setEntityType(e.target.value)} />
            </FormField>
            <FormField label="Actor">
              <Input placeholder="email contains..." value={actor} onChange={(e) => setActor(e.target.value)} />
            </FormField>
            <FormField label="From (ISO)">
              <Input placeholder="2026-02-01" value={from} onChange={(e) => setFrom(e.target.value)} />
            </FormField>
            <FormField label="To (ISO)">
              <Input placeholder="2026-02-02" value={to} onChange={(e) => setTo(e.target.value)} />
            </FormField>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="primary" onClick={load} disabled={loading}>
                {loading ? "Loading…" : "Filter"}
              </Button>
            </div>
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
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No activity yet" description="Actions will show up here as admins manage content." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr hover={false}>
                    <Th>Action</Th>
                    <Th>Entity</Th>
                    <Th>Actor</Th>
                    <Th>Time</Th>
                  </Tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <Tr key={item.id} onClick={() => setSelected(item)} style={{ cursor: "pointer" } as any}>
                      <Td>
                        <div style={{ fontWeight: 800 }}>{item.action}</div>
                      </Td>
                      <Td>
                        <div style={{ fontWeight: 700 }}>{item.entityType}</div>
                        <div style={{ color: "rgba(17,24,39,0.6)", fontSize: 12 }}>{item.entityId}</div>
                      </Td>
                      <Td>{item.actor?.email || "—"}</Td>
                      <Td>{new Date(item.createdAt).toLocaleString()}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardBody>
      </Card>

      <Drawer
        open={Boolean(selected)}
        title={selected ? `${selected.action} ${selected.entityType}` : "Details"}
        onClose={() => setSelected(null)}
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 13 }}>
              <div>
                <strong>Entity:</strong> {selected.entityType} · {selected.entityId}
              </div>
              <div>
                <strong>Actor:</strong> {selected.actor?.email || "—"}
              </div>
              <div>
                <strong>Time:</strong> {new Date(selected.createdAt).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Changed keys</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {diffKeys(selected.before, selected.after).slice(0, 60).map((k) => (
                  <Badge key={k} tone="neutral">
                    {k}
                  </Badge>
                ))}
                {diffKeys(selected.before, selected.after).length === 0 ? (
                  <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 13 }}>No field-level diff detected.</div>
                ) : null}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Before</div>
                <pre style={{ whiteSpace: "pre-wrap", background: "rgba(17,24,39,0.04)", padding: 12, borderRadius: 12, fontSize: 12 }}>
                  {JSON.stringify(selected.before ?? null, null, 2)}
                </pre>
              </div>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>After</div>
                <pre style={{ whiteSpace: "pre-wrap", background: "rgba(17,24,39,0.04)", padding: 12, borderRadius: 12, fontSize: 12 }}>
                  {JSON.stringify(selected.after ?? null, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AdminContainer>
  );
}
