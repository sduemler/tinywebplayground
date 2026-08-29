// Local-calendar-day helpers for the daily pack gate. All "days" are the
// player's local calendar day; limits reset at local midnight.

/** Local date as a stable "YYYY-MM-DD" key. */
export function ymd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Integer that increments once per local calendar day (for daily rotation). */
export function dayNumber(d: Date = new Date()): number {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/** Milliseconds remaining until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return next.getTime() - now.getTime();
}
