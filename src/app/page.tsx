// src/app/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TenantEntryClient from "./TenantEntryClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin/dashboard");
    }

    redirect("/erfassung");
  }

  return <TenantEntryClient />;
}