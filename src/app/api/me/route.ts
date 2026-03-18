import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: true,
        session: null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: {
      logoUrl: true,
      primaryColor: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      session: {
        userId: session.userId,
        fullName: session.fullName,
        role: session.role,
        companyId: session.companyId,
        companyName: session.companyName,
        companySubdomain: session.companySubdomain,
        companyLogoUrl: company?.logoUrl ?? null,
        primaryColor: company?.primaryColor ?? null,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}