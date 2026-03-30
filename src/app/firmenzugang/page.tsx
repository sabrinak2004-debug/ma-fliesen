import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TenantEntryClient from "../TenantEntryClient";

export const dynamic = "force-dynamic";

export default async function FirmenzugangPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin/dashboard");
    }

    redirect("/erfassung");
  }

  return <TenantEntryClient />;
}