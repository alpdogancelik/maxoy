import Link from "next/link";
import Badge from "./Badge";
import Button from "./Button";
import { Card, CardBody } from "./Card";

export type DbStatus = "online" | "offline" | "unknown";

export default function DbStatusBanner({
  status,
  message,
  onRetry,
  retryDisabled,
  healthHref = "/admin/health",
}: {
  status: DbStatus;
  message?: string;
  onRetry?: () => void;
  retryDisabled?: boolean;
  healthHref?: string;
}) {
  const tone = status === "online" ? "success" : status === "offline" ? "warn" : "neutral";
  const label = status === "online" ? "DB online" : status === "offline" ? "DB offline" : "DB status unknown";

  return (
    <Card>
      <CardBody>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge tone={tone}>{label}</Badge>
          <div style={{ color: "rgba(17,24,39,0.7)", fontSize: 13 }}>
            {message ||
              (status === "offline"
                ? "Some widgets may show placeholders until the database is reachable."
                : status === "online"
                  ? "All systems look good."
                  : "Checking connectivity…")}
          </div>
          {onRetry ? (
            <Button variant="primary" onClick={onRetry} disabled={retryDisabled}>
              Retry
            </Button>
          ) : null}
          <Link href={healthHref} style={{ fontSize: 13 }}>
            Open Health
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

