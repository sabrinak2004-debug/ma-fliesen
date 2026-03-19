export type OfflineQueueAction =
  | {
      id: string;
      type: "CREATE_ENTRY";
      createdAt: string;
      payload: {
        workDate: string;
        startTime: string;
        endTime: string;
        activity: string;
        location: string;
        travelMinutes: number;
        noteEmployee: string;
      };
    }
      | {
      id: string;
      type: "SUBMIT_ABSENCE_REQUEST";
      createdAt: string;
      payload: {
        startDate: string;
        endDate: string;
        type: "VACATION" | "SICK";
        dayPortion: "FULL_DAY" | "HALF_DAY";
        compensation: "PAID" | "UNPAID";
        noteEmployee: string;
      };
    }
  | {
      id: string;
      type: "CREATE_ADMIN_APPOINTMENT";
      createdAt: string;
      payload: {
        date: string;
        startHHMM: string;
        endHHMM: string;
        title: string;
        location: string;
        notes: string;
      };
    }
  | {
      id: string;
      type: "UPDATE_ADMIN_APPOINTMENT";
      createdAt: string;
      payload: {
        id: string;
        date: string;
        startHHMM: string;
        endHHMM: string;
        title: string;
        location: string;
        notes: string;
      };
    }
  | {
      id: string;
      type: "DELETE_ADMIN_APPOINTMENT";
      createdAt: string;
      payload: {
        id: string;
      };
    }
  | {
      id: string;
      type: "SAVE_DAY_BREAK";
      createdAt: string;
      payload: {
        workDate: string;
        breakStartHHMM: string;
        breakEndHHMM: string;
      };
    }
  | {
      id: string;
      type: "SUBMIT_CORRECTION_REQUEST";
      createdAt: string;
      payload: {
        targetDate: string;
        noteEmployee: string;
      };
    }

  | {
      id: string;
      type: "UPDATE_ENTRY";
      createdAt: string;
      payload: {
        id: string;
        workDate: string;
        startTime: string;
        endTime: string;
        activity: string;
        location: string;
        travelMinutes: number;
        noteEmployee: string;
      };
    }
  | {
      id: string;
      type: "DELETE_ENTRY";
      createdAt: string;
      payload: {
        id: string;
      };
    }

  | {
      id: string;
      type: "COMPLETE_TASK";
      createdAt: string;
      payload: {
        taskId: string;
      };
    };

const OFFLINE_QUEUE_STORAGE_KEY = "ma-fliesen-offline-queue-v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCreateEntryAction(value: unknown): value is Extract<OfflineQueueAction, { type: "CREATE_ENTRY" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "CREATE_ENTRY") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["workDate"] === "string" &&
    typeof payload["startTime"] === "string" &&
    typeof payload["endTime"] === "string" &&
    typeof payload["activity"] === "string" &&
    typeof payload["location"] === "string" &&
    typeof payload["travelMinutes"] === "number" &&
    typeof payload["noteEmployee"] === "string"
  );
}

function isSaveDayBreakAction(value: unknown): value is Extract<OfflineQueueAction, { type: "SAVE_DAY_BREAK" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "SAVE_DAY_BREAK") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["workDate"] === "string" &&
    typeof payload["breakStartHHMM"] === "string" &&
    typeof payload["breakEndHHMM"] === "string"
  );
}

function isSubmitCorrectionRequestAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "SUBMIT_CORRECTION_REQUEST" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "SUBMIT_CORRECTION_REQUEST") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["targetDate"] === "string" &&
    typeof payload["noteEmployee"] === "string"
  );
}

function isCompleteTaskAction(value: unknown): value is Extract<OfflineQueueAction, { type: "COMPLETE_TASK" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "COMPLETE_TASK") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return typeof payload["taskId"] === "string";
}

function isSubmitAbsenceRequestAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "SUBMIT_ABSENCE_REQUEST" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "SUBMIT_ABSENCE_REQUEST") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["startDate"] === "string" &&
    typeof payload["endDate"] === "string" &&
    (payload["type"] === "VACATION" || payload["type"] === "SICK") &&
    (payload["dayPortion"] === "FULL_DAY" || payload["dayPortion"] === "HALF_DAY") &&
    (payload["compensation"] === "PAID" || payload["compensation"] === "UNPAID") &&
    typeof payload["noteEmployee"] === "string"
  );
}

function isCreateAdminAppointmentAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "CREATE_ADMIN_APPOINTMENT" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "CREATE_ADMIN_APPOINTMENT") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["date"] === "string" &&
    typeof payload["startHHMM"] === "string" &&
    typeof payload["endHHMM"] === "string" &&
    typeof payload["title"] === "string" &&
    typeof payload["location"] === "string" &&
    typeof payload["notes"] === "string"
  );
}

function isUpdateAdminAppointmentAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "UPDATE_ADMIN_APPOINTMENT" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "UPDATE_ADMIN_APPOINTMENT") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["id"] === "string" &&
    typeof payload["date"] === "string" &&
    typeof payload["startHHMM"] === "string" &&
    typeof payload["endHHMM"] === "string" &&
    typeof payload["title"] === "string" &&
    typeof payload["location"] === "string" &&
    typeof payload["notes"] === "string"
  );
}

function isDeleteAdminAppointmentAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "DELETE_ADMIN_APPOINTMENT" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "DELETE_ADMIN_APPOINTMENT") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return typeof payload["id"] === "string";
}

function isUpdateEntryAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "UPDATE_ENTRY" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "UPDATE_ENTRY") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return (
    typeof payload["id"] === "string" &&
    typeof payload["workDate"] === "string" &&
    typeof payload["startTime"] === "string" &&
    typeof payload["endTime"] === "string" &&
    typeof payload["activity"] === "string" &&
    typeof payload["location"] === "string" &&
    typeof payload["travelMinutes"] === "number" &&
    typeof payload["noteEmployee"] === "string"
  );
}

function isDeleteEntryAction(
  value: unknown
): value is Extract<OfflineQueueAction, { type: "DELETE_ENTRY" }> {
  if (!isRecord(value)) return false;
  if (value["type"] !== "DELETE_ENTRY") return false;
  if (typeof value["id"] !== "string") return false;
  if (typeof value["createdAt"] !== "string") return false;

  const payload = value["payload"];
  if (!isRecord(payload)) return false;

  return typeof payload["id"] === "string";
}

function isOfflineQueueAction(value: unknown): value is OfflineQueueAction {
  return (
    isCreateEntryAction(value) ||
    isSaveDayBreakAction(value) ||
    isSubmitCorrectionRequestAction(value) ||
    isCompleteTaskAction(value) ||
    isSubmitAbsenceRequestAction(value) ||
    isCreateAdminAppointmentAction(value) ||
    isUpdateAdminAppointmentAction(value) ||
    isDeleteAdminAppointmentAction(value) ||
    isUpdateEntryAction(value) ||
    isDeleteEntryAction(value)
  );
}

export function readOfflineQueue(): OfflineQueueAction[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isOfflineQueueAction);
  } catch {
    return [];
  }
}

export function writeOfflineQueue(actions: OfflineQueueAction[]): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(actions));
}

export function enqueueOfflineAction(action: OfflineQueueAction): void {
  const current = readOfflineQueue();
  writeOfflineQueue([...current, action]);
}

export function removeOfflineAction(actionId: string): void {
  const current = readOfflineQueue();
  writeOfflineQueue(current.filter((action) => action.id !== actionId));
}

export function clearOfflineQueue(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
}

export function createOfflineActionId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `offline-${Date.now()}-${randomPart}`;
}