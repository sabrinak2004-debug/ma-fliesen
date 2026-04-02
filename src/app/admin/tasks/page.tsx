"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type EmployeeOption = {
  id: string;
  fullName: string;
};

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
  assignedToUser: {
    id: string;
    fullName: string;
    isActive?: boolean;
  };
  createdByUser: {
    id: string;
    fullName: string;
  };
  completedByUser: {
    id: string;
    fullName: string;
  } | null;
};

type AdminTasksApiResponse = {
  tasks: TaskRow[];
  employees: EmployeeOption[];
};

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isAdminSessionDTO(v: unknown): v is AdminSessionDTO {
  return (
    isRecord(v) &&
    isString(v["userId"]) &&
    isString(v["fullName"]) &&
    (v["role"] === "ADMIN" || v["role"] === "EMPLOYEE") &&
    isString(v["companyId"]) &&
    isString(v["companyName"]) &&
    isString(v["companySubdomain"]) &&
    (isString(v["companyLogoUrl"]) || v["companyLogoUrl"] === null) &&
    (isString(v["primaryColor"]) || v["primaryColor"] === null)
  );
}

function parseMeSession(v: unknown): AdminSessionDTO | null {
  if (!isRecord(v)) return null;
  const session = v["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

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

function isEmployeeOption(v: unknown): v is EmployeeOption {
  return isRecord(v) && isString(v["id"]) && isString(v["fullName"]);
}

function isTaskRow(v: unknown): v is TaskRow {
  if (!isRecord(v)) return false;
  const assignedToUser = v["assignedToUser"];
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
    isRecord(assignedToUser) &&
    isString(assignedToUser["id"]) &&
    isString(assignedToUser["fullName"]) &&
    isRecord(createdByUser) &&
    isString(createdByUser["id"]) &&
    isString(createdByUser["fullName"]) &&
    (completedByUser === null ||
      (isRecord(completedByUser) &&
        isString(completedByUser["id"]) &&
        isString(completedByUser["fullName"])))
  );
}

function isAdminTasksApiResponse(v: unknown): v is AdminTasksApiResponse {
  if (!isRecord(v)) return false;
  const tasks = v["tasks"];
  const employees = v["employees"];
  return (
    Array.isArray(tasks) &&
    Array.isArray(employees) &&
    tasks.every(isTaskRow) &&
    employees.every(isEmployeeOption)
  );
}

function formatDateDE(value: string | null): string {
  if (!value) return "—";

  const normalized = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return "—";

  const [y, m, d] = normalized.split("-");
  return `${d}.${m}.${y}`;
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
      return "Keine Pflichtprüfung";
    case "WORK_ENTRY_FOR_DATE":
      return "Arbeitszeit-Eintrag erforderlich";
    case "VACATION_ENTRY_FOR_DATE":
      return "Urlaubs-Eintrag erforderlich";
    case "SICK_ENTRY_FOR_DATE":
      return "Krankheits-Eintrag erforderlich";
  }
}

function sortTasksByDateDesc(tasks: TaskRow[]): TaskRow[] {
  return tasks.slice().sort((a, b) => {
    const aPrimary =
      a.referenceStartDate ??
      a.referenceDate ??
      a.referenceEndDate ??
      a.completedAt ??
      a.createdAt;

    const bPrimary =
      b.referenceStartDate ??
      b.referenceDate ??
      b.referenceEndDate ??
      b.completedAt ??
      b.createdAt;

    const byPrimary = bPrimary.slice(0, 19).localeCompare(aPrimary.slice(0, 19));
    if (byPrimary !== 0) {
      return byPrimary;
    }

    return b.createdAt.slice(0, 19).localeCompare(a.createdAt.slice(0, 19));
  });
}

export default function AdminTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("GENERAL");
  const [requiredAction, setRequiredAction] = useState<TaskRequiredAction>("NONE");
  const [referenceStartDate, setReferenceStartDate] = useState("");
  const [referenceEndDate, setReferenceEndDate] = useState("");

  const [taskQuery, setTaskQuery] = useState("");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<"ALL" | TaskCategory>("ALL");

  async function loadData(): Promise<void> {
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/tasks", {
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
        setEmployees([]);
        return;
      }

      if (!isAdminTasksApiResponse(data)) {
        setError("Unerwartete Antwort vom Server.");
        setTasks([]);
        setEmployees([]);
        return;
      }

      setTasks(data.tasks);
      const uniqueEmployees = data.employees.filter(
        (employee, index, arr) => arr.findIndex((x) => x.id === employee.id) === index
      );

      setEmployees(uniqueEmployees);
    } catch {
      setError("Netzwerkfehler beim Laden der Aufgaben.");
      setTasks([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json().catch(() => ({}));

        if (!alive) return;

        const parsed = parseMeSession(data);

        if (!parsed) {
          setSession(null);
          return;
        }

        if (parsed.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        setSession(parsed);
      } catch {
        if (!alive) return;
        router.replace("/login");
        return;
      } finally {
        if (alive) {
          setSessionChecked(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!session || session.role !== "ADMIN") return;
    void loadData();
  }, [sessionChecked, session?.role, session?.companyId]);

  useEffect(() => {
    if (category === "WORK_TIME") {
      setRequiredAction("WORK_ENTRY_FOR_DATE");
      return;
    }
    if (category === "VACATION") {
      setRequiredAction("VACATION_ENTRY_FOR_DATE");
      return;
    }
    if (category === "SICKNESS") {
      setRequiredAction("SICK_ENTRY_FOR_DATE");
      return;
    }
    setRequiredAction("NONE");
  }, [category]);

  const filteredTasks = useMemo(() => {
    const q = taskQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      if (taskCategoryFilter !== "ALL" && task.category !== taskCategoryFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        task.title.toLowerCase().includes(q) ||
        (task.description ?? "").toLowerCase().includes(q) ||
        task.assignedToUser.fullName.toLowerCase().includes(q) ||
        categoryLabel(task.category).toLowerCase().includes(q)
      );
    });
  }, [tasks, taskCategoryFilter, taskQuery]);

  const openTasks = useMemo(
    () => sortTasksByDateDesc(filteredTasks.filter((task) => task.status === "OPEN")),
    [filteredTasks]
  );

  const completedTasks = useMemo(
    () => sortTasksByDateDesc(filteredTasks.filter((task) => task.status === "COMPLETED")),
    [filteredTasks]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedToUserId,
          title,
          description,
          category,
          requiredAction,
          referenceStartDate: referenceStartDate || null,
          referenceEndDate: referenceEndDate || referenceStartDate || null,
        }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : "Aufgabe konnte nicht erstellt werden.";
        setError(message);
        return;
      }

      setSuccess("Aufgabe wurde erstellt.");
      setTitle("");
      setDescription("");
      setCategory("GENERAL");
      setRequiredAction("NONE");
      setReferenceStartDate("");
      setReferenceEndDate("");
      await loadData();
    } catch {
      setError("Netzwerkfehler beim Erstellen der Aufgabe.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel="Aufgaben verwalten">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)" }}>Lade...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="Aufgaben verwalten">
      <div style={{ display: "grid", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Neue Aufgabe erstellen
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Mitarbeiter</div>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "var(--input-bg)",
                  color: "rgba(255,255,255,0.92)",
                  outline: "none",
                }}
              >
                <option value="" style={{ color: "black" }}>
                  — Bitte wählen —
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id} style={{ color: "black" }}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Titel</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={160}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "var(--input-bg)",
                  color: "rgba(255,255,255,0.92)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Beschreibung</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "var(--input-bg)",
                  color: "rgba(255,255,255,0.92)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="admin-task-form-grid">
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Kategorie</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "var(--input-bg)",
                    color: "rgba(255,255,255,0.92)",
                    outline: "none",
                  }}
                >
                  <option value="WORK_TIME" style={{ color: "black" }}>Arbeitszeit</option>
                  <option value="VACATION" style={{ color: "black" }}>Urlaub</option>
                  <option value="SICKNESS" style={{ color: "black" }}>Krankheit</option>
                  <option value="GENERAL" style={{ color: "black" }}>Allgemein</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Pflichtaktion</div>
                <input
                  value={requiredActionLabel(requiredAction)}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "var(--surface-strong)",
                    color: "rgba(255,255,255,0.72)",
                    outline: "none",
                  }}
                />
              </div>

              <div className="admin-task-date-field">
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Bezugszeitraum von</div>
                <input
                  type="date"
                  value={referenceStartDate}
                  onChange={(e) => {
                    setReferenceStartDate(e.target.value);
                    if (!referenceEndDate) {
                      setReferenceEndDate(e.target.value);
                    }
                  }}
                  className="admin-task-date-input"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "var(--input-bg)",
                    color: "rgba(255,255,255,0.92)",
                    outline: "none",
                  }}
                />
              </div>

              <div className="admin-task-date-field">
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Bezugszeitraum bis</div>
                <input
                  type="date"
                  value={referenceEndDate}
                  onChange={(e) => setReferenceEndDate(e.target.value)}
                  className="admin-task-date-input"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "var(--input-bg)",
                    color: "rgba(255,255,255,0.92)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {error ? (
              <div style={{ color: "rgba(224,75,69,0.95)", fontWeight: 900 }}>
                {error}
              </div>
            ) : null}

            {success ? (
              <div style={{ color: "var(--accent)", fontWeight: 900 }}>
                {success}
              </div>
            ) : null}

            <div className="admin-task-submit-row">
              <button
                type="submit"
                disabled={submitLoading}
                className="admin-task-submit-btn"
                style={{
                  cursor: submitLoading ? "not-allowed" : "pointer",
                  opacity: submitLoading ? 0.7 : 1,
                }}
              >
                {submitLoading ? "Erstelle..." : "Aufgabe erstellen"}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Aufgabenübersicht
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(220px, 260px)",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <input
              value={taskQuery}
              onChange={(e) => setTaskQuery(e.target.value)}
              placeholder="Titel, Beschreibung oder Mitarbeiter suchen…"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "var(--input-bg)",
                color: "rgba(255,255,255,0.92)",
                outline: "none",
              }}
            />

            <select
              value={taskCategoryFilter}
              onChange={(e) =>
                setTaskCategoryFilter(e.target.value as "ALL" | TaskCategory)
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "var(--input-bg)",
                color: "rgba(255,255,255,0.92)",
                outline: "none",
              }}
            >
              <option value="ALL" style={{ color: "black" }}>
                Alle Kategorien
              </option>
              <option value="WORK_TIME" style={{ color: "black" }}>
                Arbeitszeit
              </option>
              <option value="VACATION" style={{ color: "black" }}>
                Urlaub
              </option>
              <option value="SICKNESS" style={{ color: "black" }}>
                Krankheit
              </option>
              <option value="GENERAL" style={{ color: "black" }}>
                Allgemein
              </option>
            </select>
          </div>

          <div className="section-title" style={{ marginBottom: 12 }}>
            Offene Aufgaben
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Lade...</div>
          ) : openTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>Keine offenen Aufgaben vorhanden.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {openTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "var(--surface)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 1000 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 900 }}>
                      {categoryLabel(task.category)}
                    </div>
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    Mitarbeiter: {task.assignedToUser.fullName}
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

                  {task.description ? (
                    <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.92)" }}>
                      {task.description}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link
                      href={
                        task.category === "WORK_TIME"
                          ? "/erfassung"
                          : task.category === "VACATION" || task.category === "SICKNESS"
                          ? "/kalender"
                          : "/admin/tasks"
                      }
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "var(--surface-strong)",
                        color: "rgba(255,255,255,0.92)",
                        textDecoration: "none",
                        fontWeight: 900,
                      }}
                    >
                      Öffnen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-title" style={{ marginTop: 22, marginBottom: 12 }}>
            Erledigte Aufgaben
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Lade...</div>
          ) : completedTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>Keine erledigten Aufgaben vorhanden.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(184,207,58,0.18)",
                    background: "var(--brand-panel-soft)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 1000 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 900 }}>
                      {categoryLabel(task.category)}
                    </div>
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    Mitarbeiter: {task.assignedToUser.fullName}
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    Erledigt am: {formatDateDE(task.completedAt)}
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    Erledigt von: {task.completedByUser?.fullName ?? "—"}
                  </div>

                  {task.description ? (
                    <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.92)" }}>
                      {task.description}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}