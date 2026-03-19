import { buildOfflineMetaKey, buildOfflineStorageKey, type OfflineEntityType } from "@/lib/offline/cacheKeys";

export type OfflineStoredEnvelope<T> = {
  savedAt: string;
  data: T;
};

export type OfflineStoredMeta = {
  savedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveOfflineData<T>(
  entity: OfflineEntityType,
  companySubdomain: string,
  userId: string,
  data: T
): void {
  if (!isBrowser()) {
    return;
  }

  const savedAt = new Date().toISOString();

  const envelope: OfflineStoredEnvelope<T> = {
    savedAt,
    data,
  };

  const dataKey = buildOfflineStorageKey(entity, companySubdomain, userId);
  const metaKey = buildOfflineMetaKey(entity, companySubdomain, userId);

  window.localStorage.setItem(dataKey, JSON.stringify(envelope));
  window.localStorage.setItem(metaKey, JSON.stringify({ savedAt } satisfies OfflineStoredMeta));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseEnvelope<T>(raw: string | null): OfflineStoredEnvelope<T> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return null;
    }

    const savedAt = parsed["savedAt"];
    const data = parsed["data"];

    if (typeof savedAt !== "string") {
      return null;
    }

    return {
      savedAt,
      data: data as T,
    };
  } catch {
    return null;
  }
}

export function readOfflineData<T>(
  entity: OfflineEntityType,
  companySubdomain: string,
  userId: string
): OfflineStoredEnvelope<T> | null {
  if (!isBrowser()) {
    return null;
  }

  const dataKey = buildOfflineStorageKey(entity, companySubdomain, userId);
  const raw = window.localStorage.getItem(dataKey);

  return parseEnvelope<T>(raw);
}

export function clearOfflineData(
  entity: OfflineEntityType,
  companySubdomain: string,
  userId: string
): void {
  if (!isBrowser()) {
    return;
  }

  const dataKey = buildOfflineStorageKey(entity, companySubdomain, userId);
  const metaKey = buildOfflineMetaKey(entity, companySubdomain, userId);

  window.localStorage.removeItem(dataKey);
  window.localStorage.removeItem(metaKey);
}