import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(): Promise<Response> {
  const session = await getSession();

  if (
    !session ||
    typeof session.userId !== "string" ||
    session.userId.trim() === "" ||
    typeof session.companyId !== "string" ||
    session.companyId.trim() === ""
  ) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";

  if (publicKey === "") {
    return NextResponse.json(
      { ok: false, error: "VAPID_PUBLIC_KEY fehlt." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      publicKey,
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