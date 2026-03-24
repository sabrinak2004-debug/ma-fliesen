"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type TaskStatus = "OPEN" | "COMPLETED";
type TaskCategory = "WORK_TIME" | "VACATION" | "SICKNESS" | "GENERAL";
type TaskRequiredAction =
  | "NONE"
  | "WORK_ENTRY_FOR_DATE"
  | "VACATION_ENTRY_FOR_DATE"
  | "SICK_ENTRY_FOR_DATE";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  requiredAction: TaskRequiredAction;
  referenceDate: string | null;
  referenceStartDate: string | null;
  referenceEndDate: string | null;
  completedAt: string | null;
  createdAt: string;
  createdByUser: {
    id: string;
    fullName: string;
  };
  completedByUser: {
    id: string;
    fullName: string;
  } | null;
};

type MissingWorkEntryAlert = {
  count: number;
  oldestMissingDate: string;
  newestMissingDate: string;
};

type TasksApiResponse = {
  tasks: TaskRow[];
  missingWorkEntryAlert?: MissingWorkEntryAlert | null;
};

type CategoryGroupKey = "WORK_TIME" | "VACATION" | "SICKNESS" | "GENERAL";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isTaskCategory(v: unknown): v is TaskCategory {
  return (
    v === "WORK_TIME" ||
    v === "VACATION" ||
    v === "SICKNESS" ||
    v === "GENERAL"
  );
}

function isTaskStatus(v: unknown): v is TaskStatus {
  return v === "OPEN" || v === "COMPLETED";
}

function isTaskRequiredAction(v: unknown): v is TaskRequiredAction {
  return (
    v === "NONE" ||
    v === "WORK_ENTRY_FOR_DATE" ||
    v === "VACATION_ENTRY_FOR_DATE" ||
    v === "SICK_ENTRY_FOR_DATE"
  );
}

function isTaskRow(v: unknown): v is TaskRow {
  if (!isRecord(v)) return false;

  const createdByUser = v["createdByUser"];
  const completedByUser = v["completedByUser"];

  return (
    isString(v["id"]) &&
    isString(v["title"]) &&
    (v["description"] === null || isString(v["description"])) &&
    isTaskCategory(v["category"]) &&
    isTaskStatus(v["status"]) &&
    isTaskRequiredAction(v["requiredAction"]) &&
    (v["referenceDate"] === null || isString(v["referenceDate"])) &&
    (v["referenceStartDate"] === null || isString(v["referenceStartDate"])) &&
    (v["referenceEndDate"] === null || isString(v["referenceEndDate"])) &&
    (v["completedAt"] === null || isString(v["completedAt"])) &&
    isString(v["createdAt"]) &&
    isRecord(createdByUser) &&
    isString(createdByUser["id"]) &&
    isString(createdByUser["fullName"]) &&
    (completedByUser === null ||
      (isRecord(completedByUser) &&
        isString(completedByUser["id"]) &&
        isString(completedByUser["fullName"])))
  );
}

function isMissingWorkEntryAlert(v: unknown): v is MissingWorkEntryAlert {
  return (
    isRecord(v) &&
    typeof v["count"] === "number" &&
    isString(v["oldestMissingDate"]) &&
    isString(v["newestMissingDate"])
  );
}

function isTasksApiResponse(v: unknown): v is TasksApiResponse {
  return (
    isRecord(v) &&
    Array.isArray(v["tasks"]) &&
    v["tasks"].every(isTaskRow) &&
    (v["missingWorkEntryAlert"] === undefined ||
      v["missingWorkEntryAlert"] === null ||
      isMissingWorkEntryAlert(v["missingWorkEntryAlert"]))
  );
}

function formatDateDE(value: string | null): string {
  if (!value) return "—";

  const normalized = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return "—";

  const [year, month, day] = normalized.split("-");
  return `${day}.${month}.${year}`;
}

function formatDateLongDE(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [, month, day] = value.split("-");
  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ] as const;

  const monthName = monthNames[Number(month) - 1];
  if (!monthName) return value;

  return `${day}. ${monthName}`;
}

function formatReferenceRangeDE(
  startDate: string | null,
  endDate: string | null,
  fallbackDate: string | null
): string {
  const start = startDate ?? fallbackDate;
  const end = endDate ?? startDate ?? fallbackDate;

  if (!start) return "—";
  if (!end) return formatDateDE(start);
  if (start === end) return formatDateDE(start);

  return `${formatDateDE(start)} bis ${formatDateDE(end)}`;
}

function categoryLabel(category: TaskCategory): string {
  switch (category) {
    case "WORK_TIME":
      return "Arbeitszeit";
    case "VACATION":
      return "Urlaub";
    case "SICKNESS":
      return "Krankheit";
    case "GENERAL":
      return "Allgemein";
  }
}

function requiredActionLabel(requiredAction: TaskRequiredAction): string {
  switch (requiredAction) {
    case "NONE":
      return "Keine direkte Pflichtprüfung";
    case "WORK_ENTRY_FOR_DATE":
      return "Arbeitszeit-Eintrag erforderlich";
    case "VACATION_ENTRY_FOR_DATE":
      return "Urlaubs-Eintrag erforderlich";
    case "SICK_ENTRY_FOR_DATE":
      return "Krankheits-Eintrag erforderlich";
  }
}

function taskActionHref(task: TaskRow): string {
  if (task.category === "WORK_TIME") {
    const params = new URLSearchParams();

    const syncDate =
      task.referenceStartDate ??
      task.referenceDate ??
      task.referenceEndDate;

    if (syncDate) {
      params.set("syncDate", syncDate);
    }

    if (task.requiredAction === "WORK_ENTRY_FOR_DATE") {
      params.set("sourceTaskId", task.id);
    }

    const query = params.toString();
    return query ? `/erfassung?${query}` : "/erfassung";
  }

  if (task.category === "VACATION" || task.category === "SICKNESS") {
    return "/kalender";
  }

  return "/aufgaben";
}

function taskActionText(task: TaskRow): string {
  const dateText = task.referenceDate ? formatDateDE(task.referenceDate) : "den betreffenden Tag";

  switch (task.requiredAction) {
    case "WORK_ENTRY_FOR_DATE":
      return `Bitte trage deine Arbeitszeit für ${dateText} ein, bevor du die Aufgabe als erledigt markierst.`;
    case "VACATION_ENTRY_FOR_DATE":
      return `Bitte erfasse für ${dateText} den Urlaub bzw. stelle den passenden Urlaubsantrag, bevor du die Aufgabe abschließt.`;
    case "SICK_ENTRY_FOR_DATE":
      return `Bitte erfasse für ${dateText} die Krankheit bzw. stelle den passenden Krankheitsantrag, bevor du die Aufgabe abschließt.`;
    case "NONE":
      return "Bitte prüfe die Aufgabe und markiere sie erst als erledigt, wenn du sie wirklich abgeschlossen hast.";
  }
}

function categoryAccent(category: TaskCategory): string {
  switch (category) {
    case "WORK_TIME":
      return "rgba(184,207,58,0.95)";
    case "VACATION":
      return "rgba(90,167,255,0.95)";
    case "SICKNESS":
      return "rgba(224,75,69,0.95)";
    case "GENERAL":
      return "rgba(255,255,255,0.92)";
  }
}

function sortTasksByDateDesc(tasks: TaskRow[]): TaskRow[] {
  return tasks.slice().sort((a, b) => {
    const aKey = (a.referenceDate ?? a.createdAt).slice(0, 19);
    const bKey = (b.referenceDate ?? b.createdAt).slice(0, 19);
    return bKey.localeCompare(aKey);
  });
}

export default function AufgabenPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTaskId, setActionTaskId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [missingWorkEntryAlert, setMissingWorkEntryAlert] =
    useState<MissingWorkEntryAlert | null>(null);
  const [showMissingWorkEntryModal, setShowMissingWorkEntryModal] = useState(false);

  async function loadTasks(): Promise<void> {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : "Aufgaben konnten nicht geladen werden.";
        setError(message);
        setTasks([]);
        setMissingWorkEntryAlert(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("tasks-changed"));
        }
        return;
      }

      if (!isTasksApiResponse(data)) {
        setError("Unerwartete Antwort vom Server.");
        setTasks([]);
        setMissingWorkEntryAlert(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("tasks-changed"));
        }
        return;
      }

      setTasks(data.tasks);
      setMissingWorkEntryAlert(data.missingWorkEntryAlert ?? null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks-changed"));
      }
    } catch {
      setError("Netzwerkfehler beim Laden der Aufgaben.");
      setTasks([]);
      setMissingWorkEntryAlert(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks-changed"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const openTasks = useMemo(
    () => sortTasksByDateDesc(tasks.filter((task) => task.status === "OPEN")),
    [tasks]
  );

  const completedTasks = useMemo(
    () => sortTasksByDateDesc(tasks.filter((task) => task.status === "COMPLETED")),
    [tasks]
  );

  const groupedOpenTasks = useMemo(() => {
    const groups: Record<CategoryGroupKey, TaskRow[]> = {
      WORK_TIME: [],
      VACATION: [],
      SICKNESS: [],
      GENERAL: [],
    };

    for (const task of openTasks) {
      groups[task.category].push(task);
    }

    return groups;
  }, [openTasks]);

  const missingWorkEntryRangeText = useMemo(() => {
    if (!missingWorkEntryAlert) return "";

    const fromText = formatDateLongDE(missingWorkEntryAlert.oldestMissingDate);
    const toText = formatDateLongDE(missingWorkEntryAlert.newestMissingDate);

    return fromText === toText ? fromText : `${fromText} bis ${toText}`;
  }, [missingWorkEntryAlert]);

  async function completeTask(taskId: string): Promise<void> {
    setActionTaskId(taskId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/complete`, {
        method: "POST",
        credentials: "include",
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : "Aufgabe konnte nicht abgeschlossen werden.";
        setError(message);
        return;
      }

      setSuccess("Aufgabe wurde als erledigt markiert.");
      await loadTasks();
    } catch {
      setError("Netzwerkfehler beim Abschließen der Aufgabe.");
    } finally {
      setActionTaskId("");
    }
  }

  function renderTaskCard(task: TaskRow, allowComplete: boolean): React.ReactElement {
    return (
      <div
        key={task.id}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 1000 }}>{task.title}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: categoryAccent(task.category),
            }}
          >
            {categoryLabel(task.category)}
          </div>
        </div>

        <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
          Pflicht: {requiredActionLabel(task.requiredAction)}
        </div>

        <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
          Bezugszeitraum: {formatReferenceRangeDE(
            task.referenceStartDate,
            task.referenceEndDate,
            task.referenceDate
          )}
        </div>

        <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
          Erstellt von: {task.createdByUser.fullName}
        </div>

        {allowComplete ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.86)",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {taskActionText(task)}
          </div>
        ) : null}

        {task.completedAt ? (
          <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
            Erledigt am: {formatDateDE(task.completedAt)}
          </div>
        ) : null}

        {task.description ? (
          <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.92)" }}>
            {task.description}
          </div>
        ) : null}

        {allowComplete ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={taskActionHref(task)}
              style={{
                padding: "9px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.92)",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              {task.category === "WORK_TIME"
                ? "Zur Erfassung"
                : task.category === "VACATION"
                ? "Zum Urlaub"
                : task.category === "SICKNESS"
                ? "Zur Krankheit"
                : "Öffnen"}
            </Link>

            <button
              type="button"
              onClick={() => void completeTask(task.id)}
              disabled={actionTaskId === task.id}
              style={{
                padding: "9px 12px",
                borderRadius: 10,
                border: "1px solid rgba(184,207,58,0.35)",
                background: "rgba(184,207,58,0.12)",
                color: "var(--accent)",
                cursor: actionTaskId === task.id ? "not-allowed" : "pointer",
                fontWeight: 1000,
                opacity: actionTaskId === task.id ? 0.7 : 1,
              }}
            >
              {actionTaskId === task.id ? "Prüfe..." : "Erledigt"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <AppShell activeLabel="Meine Aufgaben">
      <div style={{ display: "grid", gap: 16 }}>
        {missingWorkEntryAlert ? (
          <button
            type="button"
            onClick={() => setShowMissingWorkEntryModal(true)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid rgba(224, 75, 69, 0.45)",
              background: "rgba(224, 75, 69, 0.14)",
              color: "rgba(255,255,255,0.96)",
              cursor: "pointer",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 1000, color: "rgba(255, 120, 120, 0.98)" }}>
              Es fehlen Einträge für {missingWorkEntryAlert.count} Tag
              {missingWorkEntryAlert.count === 1 ? "" : "e"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>
              Fehlende Einträge bis heute – tippe hier für Details.
            </div>
          </button>
        ) : null}
        {error ? (
          <div
            className="card"
            style={{
              padding: 14,
              borderColor: "rgba(224, 75, 69, 0.35)",
            }}
          >
            <div style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>
              {error}
            </div>
          </div>
        ) : null}

        {success ? (
          <div
            className="card"
            style={{
              padding: 14,
              borderColor: "rgba(184,207,58,0.35)",
            }}
          >
            <div style={{ color: "var(--accent)", fontWeight: 900 }}>
              {success}
            </div>
          </div>
        ) : null}

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Zu erledigen
          </div>

          <div
            style={{
              marginBottom: 14,
              color: "var(--muted)",
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            Öffne die jeweilige Aufgabe über den passenden Button und markiere sie erst danach als erledigt.
            Bei datumsbezogenen Aufgaben prüft die App automatisch, ob der erforderliche Eintrag wirklich vorhanden ist.
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Lade...</div>
          ) : openTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>Keine offenen Aufgaben vorhanden.</div>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {(
                [
                  ["WORK_TIME", "Arbeitszeit"],
                  ["VACATION", "Urlaub"],
                  ["SICKNESS", "Krankheit"],
                  ["GENERAL", "Allgemein"],
                ] as Array<[CategoryGroupKey, string]>
              ).map(([groupKey, label]) => {
                const groupTasks = groupedOpenTasks[groupKey];
                return (
                  <div key={groupKey} style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        fontWeight: 1000,
                        color: categoryAccent(groupKey),
                        fontSize: 16,
                      }}
                    >
                      {label}
                    </div>

                    {groupTasks.length === 0 ? (
                      <div style={{ color: "var(--muted)", paddingLeft: 2 }}>
                        Keine offenen Aufgaben.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {groupTasks.map((task) => renderTaskCard(task, true))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Erledigte Aufgaben
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Lade...</div>
          ) : completedTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>Keine erledigten Aufgaben vorhanden.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {completedTasks.map((task) => renderTaskCard(task, false))}
            </div>
          )}
        {showMissingWorkEntryModal && missingWorkEntryAlert ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setShowMissingWorkEntryModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 1000,
            }}
          >
            <div
              onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 460,
                borderRadius: 18,
                border: "1px solid rgba(224, 75, 69, 0.35)",
                background: "rgb(24,24,24)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
                padding: 18,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div
                  style={{
                    fontWeight: 1000,
                    fontSize: 18,
                    color: "rgba(255, 120, 120, 0.98)",
                  }}
                >
                  Fehlende Einträge
                </div>
                <div style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
                  Fehlende Einträge: {missingWorkEntryRangeText}
                </div>
                <div style={{ color: "var(--muted-2)", fontSize: 13, lineHeight: 1.5 }}>
                  Es werden nur vergangene bzw. aktuell bereits fehlende Tage angezeigt.
                  Zukünftige Tage werden hier nicht berücksichtigt.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <Link
                  href={`/erfassung?syncDate=${encodeURIComponent(
                    missingWorkEntryAlert.oldestMissingDate
                  )}`}
                  onClick={() => setShowMissingWorkEntryModal(false)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(184,207,58,0.35)",
                    background: "rgba(184,207,58,0.12)",
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 900,
                  }}
                >
                  Zur Erfassung
                </Link>

                <button
                  type="button"
                  onClick={() => setShowMissingWorkEntryModal(false)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.92)",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </AppShell>
  );
}