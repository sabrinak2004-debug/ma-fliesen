import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session?.userId || !session.companyId) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey || publicKey.trim() === "") {
    return NextResponse.json(
      { ok: false, error: "VAPID_PUBLIC_KEY fehlt." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    publicKey,
  });
}