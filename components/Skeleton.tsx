export function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />;
}

export function CalendarSkeleton() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 680 }}>
        <div>
          <Skeleton style={{ width: 180, height: 24 }} />
          <div style={{ marginTop: 8 }}>
            <Skeleton style={{ width: 260, height: 13 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Skeleton style={{ width: 36, height: 34 }} />
          <Skeleton style={{ width: 36, height: 34 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: "var(--space-5)", maxWidth: 680 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} style={{ aspectRatio: "1", width: "100%" }} />
        ))}
      </div>
    </>
  );
}

export function DayViewSkeleton() {
  return (
    <>
      <div>
        <Skeleton style={{ width: 140, height: 12 }} />
        <div style={{ marginTop: 10 }}>
          <Skeleton style={{ width: 280, height: 24 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Skeleton style={{ width: 320, height: 13 }} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton style={{ width: 90, height: 20, borderRadius: 999 }} />
            <div style={{ marginTop: 12 }}>
              <Skeleton style={{ width: "100%", height: 40 }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Skeleton style={{ width: "100%", height: 140 }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Skeleton style={{ width: "100%", height: 36 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
