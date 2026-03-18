import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

export async function GET(req: Request) {
  const hostHeader = req.headers.get("host") ?? "";
  const host = normalizeHost(hostHeader);

  const parts = host.split(".");
  const subdomain = parts.length >= 3 ? parts[0] : "";

  if (!subdomain) {
    return NextResponse.json({ ok: false });
  }

  const company = await prisma.company.findUnique({
    where: { subdomain },
    select: {
      name: true,
      logoUrl: true,
      primaryColor: true,
    },
  });

  if (!company) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({
    ok: true,
    company,
  });
}