"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  ADMIN_TASKS_UI_TEXTS,
  toHtmlLang,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";

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
  | "SICK_ENTRY_FOR_DATE"
  | "CONFIRM_MONTHLY_WORK_ENTRIES";

type AttachmentDTO = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

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
  completionNote: string | null;
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
  attachments: AttachmentDTO[];
};

type AdminTasksApiResponse = {
  tasks: TaskRow[];
  employees: EmployeeOption[];
};

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: "DE" | "EN" | "IT" | "TR" | "SQ" | "KU" | "RO";
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
    (v["language"] === "DE" ||
      v["language"] === "EN" ||
      v["language"] === "IT" ||
      v["language"] === "TR" ||
      v["language"] === "SQ" ||
      v["language"] === "KU" ||
      v["language"] === "RO") &&
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
    v === "SICK_ENTRY_FOR_DATE" ||
    v === "CONFIRM_MONTHLY_WORK_ENTRIES"
  );
}

function isEmployeeOption(v: unknown): v is EmployeeOption {
  return isRecord(v) && isString(v["id"]) && isString(v["fullName"]);
}

function isAttachmentDTO(v: unknown): v is AttachmentDTO {
  if (!isRecord(v)) return false;

  return (
    isString(v["id"]) &&
    isString(v["fileName"]) &&
    isString(v["mimeType"]) &&
    typeof v["sizeBytes"] === "number" &&
    isString(v["url"]) &&
    isString(v["createdAt"])
  );
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
    (v["completionNote"] === null || isString(v["completionNote"])) &&
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
        isString(completedByUser["fullName"]))) &&
    Array.isArray(v["attachments"]) &&
    v["attachments"].every(isAttachmentDTO)
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

function formatDate(value: string | null, language: AppUiLanguage): string {
  if (!value) {
    return translate(language, "dash", ADMIN_TASKS_UI_TEXTS);
  }

  const normalized = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return translate(language, "dash", ADMIN_TASKS_UI_TEXTS);
  }

  const [y, m, d] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));

  return new Intl.DateTimeFormat(toHtmlLang(language), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "0 KB";
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

function isImageAttachment(attachment: AttachmentDTO): boolean {
  return attachment.mimeType.startsWith("image/");
}

function AttachmentLinks({
  attachments,
  title,
}: {
  attachments: AttachmentDTO[];
  title: string;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div
      className="tenant-soft-panel-strong"
      style={{
        display: "grid",
        gap: 8,
      }}
    >
      <strong>{title}</strong>

      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="tenant-action-link"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {isImageAttachment(attachment) ? "🖼️ " : "📎 "}
            {attachment.fileName}
          </span>
          <span style={{ flexShrink: 0, opacity: 0.8 }}>
            {formatFileSize(attachment.sizeBytes)}
          </span>
        </a>
      ))}
    </div>
  );
}

function formatReferenceRange(
  startDate: string | null,
  endDate: string | null,
  fallbackDate: string | null,
  language: AppUiLanguage
): string {
  const start = startDate ?? fallbackDate;
  const end = endDate ?? startDate ?? fallbackDate;

  if (!start) {
    return translate(language, "dash", ADMIN_TASKS_UI_TEXTS);
  }

  if (!end) {
    return formatDate(start, language);
  }

  if (start === end) {
    return formatDate(start, language);
  }

  return `${formatDate(start, language)} ${translate(
    language,
    "until",
    ADMIN_TASKS_UI_TEXTS
  )} ${formatDate(end, language)}`;
}

function categoryLabel(category: TaskCategory, language: AppUiLanguage): string {
  switch (category) {
    case "WORK_TIME":
      return translate(language, "categoryWorkTime", ADMIN_TASKS_UI_TEXTS);
    case "VACATION":
      return translate(language, "categoryVacation", ADMIN_TASKS_UI_TEXTS);
    case "SICKNESS":
      return translate(language, "categorySickness", ADMIN_TASKS_UI_TEXTS);
    case "GENERAL":
      return translate(language, "categoryGeneral", ADMIN_TASKS_UI_TEXTS);
  }
}

function getTaskCategoryBadgeStyle(
  category: TaskCategory
): React.CSSProperties {
  switch (category) {
    case "WORK_TIME":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--brand-work-border)",
        background: "var(--brand-work-bg)",
        color: "var(--text-soft)",
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1,
      };
    case "VACATION":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--brand-vacation-border)",
        background: "var(--brand-vacation-bg)",
        color: "var(--info-text)",
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1,
      };
    case "SICKNESS":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--brand-sick-border)",
        background: "var(--brand-sick-bg)",
        color: "var(--danger-text)",
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1,
      };
    case "GENERAL":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--surface-strong)",
        color: "var(--text-soft)",
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1,
      };
  }
}

function requiredActionLabel(
  requiredAction: TaskRequiredAction,
  language: AppUiLanguage
): string {
  switch (requiredAction) {
    case "NONE":
      return translate(language, "noReviewRequired", ADMIN_TASKS_UI_TEXTS);
    case "WORK_ENTRY_FOR_DATE":
      return translate(language, "workEntryRequired", ADMIN_TASKS_UI_TEXTS);
    case "VACATION_ENTRY_FOR_DATE":
      return translate(language, "vacationEntryRequired", ADMIN_TASKS_UI_TEXTS);
    case "SICK_ENTRY_FOR_DATE":
      return translate(language, "sickEntryRequired", ADMIN_TASKS_UI_TEXTS);
    case "CONFIRM_MONTHLY_WORK_ENTRIES":
      return translate(
        language,
        "monthlyWorkConfirmationRequired",
        ADMIN_TASKS_UI_TEXTS
      );
  }
}

function adminTaskOpenHref(task: TaskRow): string | null {
  if (task.category === "GENERAL") {
    return null;
  }

  const params = new URLSearchParams();
  params.set("employeeId", task.assignedToUser.id);
  params.set("taskCategory", task.category);

  const referenceDate =
    task.referenceStartDate ||
    task.referenceDate ||
    task.referenceEndDate;

  if (referenceDate) {
    params.set("date", referenceDate.slice(0, 10));
  }

  return `/admin/dashboard?${params.toString()}`;
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
  const language: AppUiLanguage = session?.language ?? "DE";

  function t(key: keyof typeof ADMIN_TASKS_UI_TEXTS): string {
    return translate(language, key, ADMIN_TASKS_UI_TEXTS);
  }

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
            : t("loadError");
        setError(message);
        setTasks([]);
        setEmployees([]);
        return;
      }

      if (!isAdminTasksApiResponse(data)) {
        setError(t("unexpectedServerResponse"));
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
      setError(t("networkLoadError"));
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
        categoryLabel(task.category, language).toLowerCase().includes(q)
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
            : t("createTaskError");
        setError(message);
        return;
      }

      setSuccess(t("createTaskSuccess"));
      setTitle("");
      setDescription("");
      setCategory("GENERAL");
      setRequiredAction("NONE");
      setReferenceStartDate("");
      setReferenceEndDate("");
      await loadData();
    } catch {
      setError(t("networkCreateError"));
    } finally {
      setSubmitLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel={t("adminTasksActiveLabel")}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel={t("adminTasksActiveLabel")}>
      <div style={{ display: "grid", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            {t("createTaskTitle")}
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            style={{ display: "grid", gap: 12 }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("employee")}</div>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                required
                className="select"
              >
                <option value="" style={{ color: "black" }}>
                  {t("pleaseChoose")}
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id} style={{ color: "black" }}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("title")}</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={160}
                className="input"
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("description")}</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="textarea"
              />
            </div>

            <div className="admin-task-form-grid">
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("category")}</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="select"
                >
                  <option value="WORK_TIME" style={{ color: "black" }}>{t("categoryWorkTime")}</option>
                  <option value="VACATION" style={{ color: "black" }}>{t("categoryVacation")}</option>
                  <option value="SICKNESS" style={{ color: "black" }}>{t("categorySickness")}</option>
                  <option value="GENERAL" style={{ color: "black" }}>{t("categoryGeneral")}</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("requiredAction")}</div>
                <input
                  value={requiredActionLabel(requiredAction, language)}
                  readOnly
                  className="input"
                  style={{
                    background: "var(--surface-strong)",
                    color: "var(--text-faint)",
                  }}
                />
              </div>

              <div className="admin-task-date-field">
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("referenceStart")}</div>
                <input
                  type="date"
                  value={referenceStartDate}
                  onChange={(e) => {
                    setReferenceStartDate(e.target.value);
                    if (!referenceEndDate) {
                      setReferenceEndDate(e.target.value);
                    }
                  }}
                  className="admin-task-date-input input"
                />
              </div>

              <div className="admin-task-date-field">
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("referenceEnd")}</div>
                <input
                  type="date"
                  value={referenceEndDate}
                  onChange={(e) => setReferenceEndDate(e.target.value)}
                  className="admin-task-date-input input"
                />
              </div>
            </div>

            {error ? (
              <div className="tenant-status-text-danger">{error}</div>
            ) : null}

            {success ? (
              <div className="tenant-status-text-success">{success}</div>
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
                {submitLoading ? t("createTaskSubmitting") : t("createTaskSubmit")}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            {t("tasksOverview")}
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
              placeholder={t("searchPlaceholder")}
              className="app-filter-input"
            />

            <select
              value={taskCategoryFilter}
              onChange={(e) =>
                setTaskCategoryFilter(e.target.value as "ALL" | TaskCategory)
              }
              className="app-filter-select"
            >
              <option value="ALL" style={{ color: "black" }}>
                {t("allCategories")}
              </option>
              <option value="WORK_TIME" style={{ color: "black" }}>
                {t("categoryWorkTime")}
              </option>
              <option value="VACATION" style={{ color: "black" }}>
                {t("categoryVacation")}
              </option>
              <option value="SICKNESS" style={{ color: "black" }}>
                {t("categorySickness")}
              </option>
              <option value="GENERAL" style={{ color: "black" }}>
                {t("categoryGeneral")}
              </option>
            </select>
          </div>

          <div className="section-title" style={{ marginBottom: 12 }}>
            {t("openTasks")}
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
          ) : openTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>{t("noOpenTasks")}</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {openTasks.map((task) => (
                <div
                  key={task.id}
                  className="tenant-soft-panel"
                  style={{
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontWeight: 1000 }}>{task.title}</div>
                    <div style={getTaskCategoryBadgeStyle(task.category)}>
                      {categoryLabel(task.category, language)}
                    </div>
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    {t("employeePrefix")} {task.assignedToUser.fullName}
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    {t("requiredPrefix")} {requiredActionLabel(task.requiredAction, language)}
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    {t("referenceRangePrefix")}{" "}
                      {formatReferenceRange(
                        task.referenceStartDate,
                        task.referenceEndDate,
                        task.referenceDate,
                        language
                      )}
                  </div>

                  {task.description ? (
                    <div style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>
                      {task.description}
                    </div>
                  ) : null}

                  {(() => {
                    const openHref = adminTaskOpenHref(task);

                    if (!openHref) {
                      return null;
                    }

                    return (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Link
                          href={openHref}
                          className="tenant-action-link"
                        >
                          {t("open")}
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          <div className="section-title" style={{ marginTop: 22, marginBottom: 12 }}>
            {t("completedTasks")}
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
          ) : completedTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>{t("noCompletedTasks")}</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="tenant-status-card tenant-status-card-success"
                  style={{
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontWeight: 1000 }}>{task.title}</div>
                    <div style={getTaskCategoryBadgeStyle(task.category)}>
                      {categoryLabel(task.category, language)}
                    </div>
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    {t("employeePrefix")} {task.assignedToUser.fullName}
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    {t("completedAt")} {formatDate(task.completedAt, language)}
                  </div>

                  <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                    {t("completedBy")}{" "}
                    {task.completedByUser?.fullName ?? t("dash")}
                  </div>

                  {task.completionNote ? (
                    <div
                      className="tenant-soft-panel-strong"
                      style={{
                        color: "var(--text-soft)",
                        fontSize: 13,
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <strong>{t("completionNote")}</strong>{" "}
                      {task.completionNote}
                    </div>
                  ) : null}

                  <AttachmentLinks
                    attachments={task.attachments}
                    title="Hochgeladene Dateien"
                  />

                  {task.description ? (
                    <div style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>
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