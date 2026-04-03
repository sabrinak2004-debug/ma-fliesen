import React, { Suspense } from "react";
import KalenderPage from "@/app/kalender/page";

export default function AdminAppointmentsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="card" style={{ padding: 16 }}>
          <div style={{ color: "var(--muted)" }}>Kalender lädt...</div>
        </div>
      }
    >
      <KalenderPage forceAdminOwnCalendar />
    </Suspense>
  );
}
