// src/app/api/auth/precheck/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function normalizeHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

function extractCompanySubdomainFromRequest(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = req.headers.get("host");

  const host = normalizeHost(forwardedHost ?? hostHeader ?? "");

  if (!host) return "";

  if (host.endsWith(".vercel.app")) {
    return "";
  }

  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "";
  }

  const parts = host.split(".");
  if (parts.length < 3) {
    return "";
  }

  return parts[0] ?? "";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fullName = (url.searchParams.get("fullName") ?? "").trim();
  const companySubdomainFromQuery = (url.searchParams.get("companySubdomain") ?? "")
    .trim()
    .toLowerCase();

  const companySubdomain =
    companySubdomainFromQuery || extractCompanySubdomainFromRequest(req);

  // Für Live-Search im UI: leere Eingabe => kein Fehler, sondern "nicht erlaubt"
  if (!fullName) {
    return NextResponse.json({ ok: true, allowed: false }, { status: 200 });
  }

  const matchingUsers = await prisma.appUser.findMany({
    where: {
      fullName: {
        equals: fullName,
        mode: "insensitive",
      },
      ...(companySubdomain
        ? {
            company: {
              subdomain: companySubdomain,
            },
          }
        : {}),
    },
    select: {
      id: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
    take: 10,
  });

  if (matchingUsers.length === 0) {
    return NextResponse.json({ ok: true, allowed: false }, { status: 200 });
  }

  if (!companySubdomain && matchingUsers.length > 1) {
    return NextResponse.json(
      {
        ok: false,
        error: "AUTH_PRECHECK_AMBIGUOUS_NAME",
      },
      { status: 200 }
    );
  }

  const user = matchingUsers[0];

  if (!user || !user.isActive) {
    return NextResponse.json({ ok: true, allowed: false }, { status: 200 });
  }

  const needsPasswordSetup = user.role === Role.EMPLOYEE && !user.passwordHash;

  return NextResponse.json(
    {
      ok: true,
      allowed: true,
      role: user.role,
      needsPasswordSetup,
    },
    { status: 200 }
  );
}