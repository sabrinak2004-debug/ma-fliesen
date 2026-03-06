import { NextResponse } from "next/server";

export async function GET() {
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