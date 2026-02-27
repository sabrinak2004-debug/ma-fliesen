import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { fullName } = await req.json();
  const name = String(fullName ?? "").trim();

  if (name.length < 3) {
    return NextResponse.json({ error: "Name ungültig" }, { status: 400 });
  }

  const user =
    (await prisma.appUser.findUnique({ where: { fullName: name } })) ??
    (await prisma.appUser.create({
      data: { fullName: name, role: "EMPLOYEE" },
    }));

  if (!user.isActive) {
    return NextResponse.json({ error: "User ist deaktiviert" }, { status: 403 });
  }

  const res = NextResponse.json({
    id: user.id,
    fullName: user.fullName,
    role: user.role,
  });

  res.cookies.set("session_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}