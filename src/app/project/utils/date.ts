export function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function setHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(hours);
  return d;
}

export function setMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setMinutes(minutes);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

export function formatDateRange(anchor: Date, view: "day" | "week" | "month"): string {
  if (view === "day") {
    return anchor.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  if (view === "month") {
    return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  const left = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const right = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${left} - ${right}`;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function parseEventDateTime(date: string, time: string): Date {
  const [hour, minute] = time.split(":").map(Number);
  const dt = new Date(`${date}T00:00:00`);
  dt.setHours(hour, minute, 0, 0);
  return dt;
}

export function sameDate(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
