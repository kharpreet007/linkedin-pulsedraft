const TIMEZONE = process.env.PULSECRAFT_TIMEZONE || "UTC";

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  return DATE_RE.test(value);
}
