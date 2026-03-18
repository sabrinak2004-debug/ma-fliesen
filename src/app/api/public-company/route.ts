import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PublicCompanyDto = {
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("query") ?? "";
  const query = normalizeQuery(rawQuery);

  if (!query) {
    return NextResponse.json(
      { ok: false, error: "Fehlender Suchbegriff." },
      { status: 400 }
    );
  }

  const companyBySubdomain = await prisma.company.findUnique({
    where: { subdomain: query },
    select: {
      name: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
    },
  });

  if (companyBySubdomain) {
    const company: PublicCompanyDto = companyBySubdomain;

    return NextResponse.json({
      ok: true,
      company,
    });
  }

  const companiesByName = await prisma.company.findMany({
    where: {
      name: {
        equals: query,
        mode: "insensitive",
      },
    },
    select: {
      name: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
    },
    take: 1,
  });

  const companyByName = companiesByName[0];

  if (!companyByName) {
    return NextResponse.json(
      { ok: false, error: "Firma nicht gefunden." },
      { status: 404 }
    );
  }

  const company: PublicCompanyDto = companyByName;

  return NextResponse.json({
    ok: true,
    company,
  });
}