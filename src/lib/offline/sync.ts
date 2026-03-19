import {
  readOfflineQueue,
  removeOfflineAction,
  type OfflineQueueAction,
} from "@/lib/offline/queue";

export type OfflineSyncResult = {
  processed: number;
  failed: number;
};

async function syncAction(action: OfflineQueueAction): Promise<boolean> {
  if (action.type === "CREATE_ENTRY") {
    const response = await fetch("/api/entries", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    return response.ok;
  }

  if (action.type === "SAVE_DAY_BREAK") {
    const response = await fetch("/api/day-breaks", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    return response.ok;
  }

  if (action.type === "SUBMIT_CORRECTION_REQUEST") {
    const response = await fetch("/api/time-entry-correction-requests", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    return response.ok;
  }

  if (action.type === "COMPLETE_TASK") {
    const response = await fetch(`/api/tasks/${encodeURIComponent(action.payload.taskId)}/complete`, {
      method: "POST",
      credentials: "include",
    });

    return response.ok;
  }

  if (action.type === "SUBMIT_ABSENCE_REQUEST") {
    const response = await fetch("/api/absence-requests", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    return response.ok;
  }

  if (action.type === "CREATE_ADMIN_APPOINTMENT") {
    const response = await fetch("/api/admin/appointments", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    return response.ok;
  }

  if (action.type === "UPDATE_ADMIN_APPOINTMENT") {
    const response = await fetch(`/api/admin/appointments/${encodeURIComponent(action.payload.id)}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: action.payload.date,
        startHHMM: action.payload.startHHMM,
        endHHMM: action.payload.endHHMM,
        title: action.payload.title,
        location: action.payload.location,
        notes: action.payload.notes,
      }),
    });

    return response.ok;
  }

  if (action.type === "DELETE_ADMIN_APPOINTMENT") {
    const response = await fetch(`/api/admin/appointments/${encodeURIComponent(action.payload.id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    return response.ok;
  }

  if (action.type === "UPDATE_ENTRY") {
    const response = await fetch("/api/entries", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    return response.ok;
  }

  if (action.type === "DELETE_ENTRY") {
    const response = await fetch(`/api/entries?id=${encodeURIComponent(action.payload.id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    return response.ok;
  }

  return false;
}

export async function flushOfflineQueue(): Promise<OfflineSyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      processed: 0,
      failed: 0,
    };
  }

  const queue = readOfflineQueue();

  let processed = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      const ok = await syncAction(action);

      if (ok) {
        removeOfflineAction(action.id);
        processed += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    processed,
    failed,
  };
}