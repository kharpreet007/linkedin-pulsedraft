const TIMEZONE = process.env.PULSECRAFT_TIMEZONE || "Asia/Kolkata";

/** Today's date as YYYY-MM-DD in PULSECRAFT_TIMEZONE, e.g. for keying the daily Run. */
export function todayInTimezone(timezone: string = TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Hour of day (0-23) that `date` falls on in `timezone` — e.g. for bucketing a UTC timestamp
 *  like PostedSelection.postedAt into "what time did I actually publish this" for Analytics. */
export function hourInTimezone(date: Date, timezone: string = TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  // Some environments format midnight as "24" with hour12:false — normalize back to 0.
  return Number(hour) % 24;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  return DATE_RE.test(value);
}
