import React, { Suspense } from "react";
import KalenderPage from "@/app/kalender/page";

export default function AdminAppointmentsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 16,
            color: "var(--muted)",
          }}
        >
          Kalender lädt...
        </div>
      }
    >
      <KalenderPage forceAdminOwnCalendar />
    </Suspense>
  );
}
