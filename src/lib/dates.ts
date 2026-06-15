// Small date helpers. Weeks start on Monday.

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `d` (or today). */
export function weekStart(d: Date = new Date()): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  return isoDate(date);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
