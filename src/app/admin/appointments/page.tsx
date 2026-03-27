import React from "react";
import KalenderPage from "@/app/kalender/page";

export default function AdminAppointmentsPage(): React.ReactElement {
  return <KalenderPage forceAdminOwnCalendar />;
}