// src/lib/breaks.ts

export type DayBreakComputation = {
  dayGrossMinutes: number;
  legalBreakMinutes: number;
  manualBreakMinutes: number;
  autoSupplementMinutes: number;
  effectiveBreakMinutes: number;
  netDayMinutes: number;
  breakAuto: boolean;
};

export function minutesBetweenHHMM(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(":").map((x) => Number(x));
  const [eh, em] = endHHMM.split(":").map((x) => Number(x));

  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
    return 0;
  }

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  return Math.max(0, end - start);
}

export function requiredLegalBreakMinutesByGrossDay(dayGrossMinutes: number): number {
  if (!Number.isFinite(dayGrossMinutes) || dayGrossMinutes <= 0) return 0;
  if (dayGrossMinutes > 9 * 60) return 45;
  if (dayGrossMinutes > 6 * 60) return 30;
  return 0;
}

export function computeDayBreakFromGross(
  dayGrossMinutes: number,
  manualBreakMinutes: number
): DayBreakComputation {
  const gross = Math.max(0, Math.round(dayGrossMinutes));
  const manual = Math.max(0, Math.round(manualBreakMinutes));
  const legal = requiredLegalBreakMinutesByGrossDay(gross);

  const effectiveUncapped = Math.max(manual, legal);
  const effective = Math.min(gross, effectiveUncapped);
  const autoSupplement = Math.max(0, effective - Math.min(manual, effective));

  return {
    dayGrossMinutes: gross,
    legalBreakMinutes: legal,
    manualBreakMinutes: Math.min(manual, gross),
    autoSupplementMinutes: autoSupplement,
    effectiveBreakMinutes: effective,
    netDayMinutes: Math.max(0, gross - effective),
    breakAuto: autoSupplement > 0,
  };
}