export const OFFLINE_STORAGE_PREFIX = "ma-fliesen-offline";

export type OfflineEntityType =
  | "overview"
  | "tasks"
  | "calendar"
  | "entries"
  | "planEntries"
  | "me"
  | "publicCompany"
  | "adminDashboard"
  | "adminTasks"
  | "adminUsers"
  | "adminSchedule";

function normalizePart(value: string): string {
  return value.trim().toLowerCase();
}

export function buildOfflineStorageKey(
  entity: OfflineEntityType,
  companySubdomain: string,
  userId: string
): string {
  const normalizedCompany = normalizePart(companySubdomain) || "global";
  const normalizedUser = normalizePart(userId) || "anonymous";

  return [
    OFFLINE_STORAGE_PREFIX,
    normalizedCompany,
    normalizedUser,
    entity,
  ].join(":");
}

export function buildOfflineMetaKey(
  entity: OfflineEntityType,
  companySubdomain: string,
  userId: string
): string {
  return `${buildOfflineStorageKey(entity, companySubdomain, userId)}:meta`;
}