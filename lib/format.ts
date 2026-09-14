export function fmtLabel(dateStr: string, today: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const s = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return dateStr === today ? "Today · " + s.split(", ")[1] : s;
}

export function fmtHeader(dateStr: string, today: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const s = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return dateStr === today ? "Today — " + s : s;
}
