import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

export default function TinyBarChart({
  days,
  series,
  loading,
  height = 64,
}: {
  days: string[];
  series: number[];
  loading?: boolean;
  height?: number;
}) {
  const max = Math.max(...(series || []), 1);

  if (loading) {
    return (
      <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-end", height }}>
        {Array.from({ length: Math.max(days?.length || 7, 7) }).map((_, i) => (
          <Skeleton key={i} height={height} width={18} />
        ))}
      </div>
    );
  }

  if (!series?.length) {
    return <EmptyState title="No chart data" description="No orders were found for the selected period." />;
  }

  return (
    <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-end", height }}>
      {series.map((v, i) => {
        const barHeight = Math.round((v / max) * (height - 12));
        return (
          <div
            key={days[i] || String(i)}
            title={`${days[i] || ""}: ${v}`}
            style={{
              width: 18,
              height: barHeight,
              borderRadius: 8,
              background: "rgba(27,28,31,0.85)",
            }}
          />
        );
      })}
    </div>
  );
}

