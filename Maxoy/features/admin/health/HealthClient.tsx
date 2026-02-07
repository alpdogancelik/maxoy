"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminContainer, Badge, Button, Card, CardBody, EmptyState, PageHeader, Skeleton, Table, TableWrap, Td, Th, Tr } from "@/features/admin/ui-kit";

type HealthPayload = {
  ok: boolean;
  checks: {
    db: { ok: boolean; detail: string };
    media: { ok: boolean; detail: string };
    env: { ok: boolean; detail: string; env: Record<string, { present: boolean; value: string | null }> };
  };
};

export default function HealthClient() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/health");
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Failed to load health");
      setData(null);
      setLoading(false);
      return;
    }
    const payload = (await res.json()) as HealthPayload;
    setData(payload);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const tone = (ok: boolean) => (ok ? ("success" as const) : ("danger" as const));

  return (
    <AdminContainer>
      <PageHeader
        title="Health"
        description="Actionable diagnostics for admin dependencies."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            Retry
          </Button>
        }
      />

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
            <EmptyState title="Couldn’t load health checks" description={error} action={<Button onClick={load}>Retry</Button>} />
          </CardBody>
        </Card>
      ) : !data ? null : (
        <>
          <Card>
            <CardBody>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Badge tone={tone(data.ok)}>{data.ok ? "All systems OK" : "Degraded"}</Badge>
                <div style={{ color: "rgba(17,24,39,0.7)", fontSize: 13 }}>
                  DB: {data.checks.db.detail} · Media: {data.checks.media.detail}
                </div>
              </div>
            </CardBody>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card>
              <CardBody>
                <div style={{ fontWeight: 900 }}>Database</div>
                <div style={{ marginTop: 8 }}>
                  <Badge tone={tone(data.checks.db.ok)}>{data.checks.db.ok ? "OK" : "Down"}</Badge>
                </div>
                <div style={{ marginTop: 10, color: "rgba(17,24,39,0.7)", fontSize: 13 }}>{data.checks.db.detail}</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 900 }}>Media / Storage</div>
                <div style={{ marginTop: 8 }}>
                  <Badge tone={tone(data.checks.media.ok)}>{data.checks.media.ok ? "OK" : "Down"}</Badge>
                </div>
                <div style={{ marginTop: 10, color: "rgba(17,24,39,0.7)", fontSize: 13 }}>{data.checks.media.detail}</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ fontWeight: 900 }}>Env sanity</div>
                <div style={{ marginTop: 8 }}>
                  <Badge tone={tone(data.checks.env.ok)}>{data.checks.env.ok ? "OK" : "Check"}</Badge>
                </div>
                <div style={{ marginTop: 10, color: "rgba(17,24,39,0.7)", fontSize: 13 }}>
                  Secrets are redacted. Missing env vars can cause admin features to fail.
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Env vars</div>
              <TableWrap>
                <Table>
                  <thead>
                    <Tr hover={false}>
                      <Th>Key</Th>
                      <Th>Present</Th>
                      <Th>Value (redacted)</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.checks.env.env).map(([k, v]) => (
                      <Tr key={k}>
                        <Td>{k}</Td>
                        <Td>
                          <Badge tone={v.present ? "success" : "warn"}>{v.present ? "Yes" : "No"}</Badge>
                        </Td>
                        <Td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
                          {v.value ?? "—"}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </CardBody>
          </Card>
        </>
      )}
    </AdminContainer>
  );
}

