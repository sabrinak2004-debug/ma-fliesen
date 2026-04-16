// src/lib/timesheetLock.ts

// src/lib/time.ts
export const APP_TIMEZONE = "Europe/Berlin";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * YYYY-MM-DD in Europe/Berlin aus Date
 */
export function toIsoDateUTC(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Datum konnte nicht formatiert werden.");
  }

  return `${year}-${month}-${day}`
}

/**
 * HH:MM in Europe/Berlin aus Date
 */
export function toHHMMUTC(date: Date): string {
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;

  if (!hour || !minute) {
    throw new Error("Uhrzeit konnte nicht formatiert werden.");
  }

  return `${hour}:${minute}`;
  }

/**
 * Lokales Datum + Uhrzeit aus Europe/Berlin -> echtes UTC Date
 */
export function utcFromLocalDateTime(
  ymd: string,
  hhmm: string
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;

  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = hhmm.split(":").map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
}

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  const berlinParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utcGuess);
  const berlinYear = Number(berlinParts.find((p) => p.type === "year")?.value);
  const berlinMonth = Number(berlinParts.find((p) => p.type === "month")?.value);
  const berlinDay = Number(berlinParts.find((p) => p.type === "day")?.value);
  const berlinHour = Number(berlinParts.find((p) => p.type === "hour")?.value);
  const berlinMinute = Number(berlinParts.find((p) => p.type === "minute")?.value);
  const desiredAsUTC = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const berlinShownAsUTC = Date.UTC(
    berlinYear,
    berlinMonth - 1,
    berlinDay,
    berlinHour,
    berlinMinute,
    0,
    0
  );

  const diffMs = desiredAsUTC - berlinShownAsUTC;

  return new Date(utcGuess.getTime() + diffMs);
}

/**
 * Date -> Google Calendar dateTime ohne Z, passend zu Europe/Berlin
 */
export function toGoogleDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  const second = parts.find((p) => p.type === "second")?.value ?? "00";

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Google dateTime konnte nicht formatiert werden.");
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }
/**
 * Google dateTime -> Date
 */
export function googleDateTimeToUTC(dateTime: string): Date {
  return new Date(dateTime);
}

export function formatGermanDateTime(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatGermanDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}