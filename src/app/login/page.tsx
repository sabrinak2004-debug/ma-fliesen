import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin/dashboard");
    }

    redirect("/erfassung");
  }

  return (
    <LoginClient
      initialBrand={{
        displayName: "Mitarbeiterportal",
        subtitle: "Digitale Zeiterfassung & Einsatzplanung",
        badgeText: "Portal",
        logoUrl: null,
        primaryColor: "#3f3b3d",
        companySubdomain: "",
      }}
    />
  );
}