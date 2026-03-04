// src/lib/timesheetLock.ts

export function berlinTodayYMD(now: Date = new Date()): string {
  // YYYY-MM-DD in Europe/Berlin
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

export function assertEmployeeMayEditDate(args: {
  role: "ADMIN" | "EMPLOYEE";
  workDateYMD: string; // "YYYY-MM-DD"
}) {
  if (args.role === "ADMIN") return;

  const today = berlinTodayYMD();
  if (args.workDateYMD !== today) {
    throw new Error("Du kannst Einträge nur am selben Tag bearbeiten.");
  }
}