// src/lib/auth.ts
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mafliesen_session";

function hmac(input: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET fehlt in .env");
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

export type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

type SessionPayload = SessionData & { iat: number };

function isSessionPayload(v: unknown): v is SessionPayload {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;

  const role = r.role;
  return (
    typeof r.userId === "string" &&
    typeof r.fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN") &&
    typeof r.iat === "number"
  );
}

export async function setSession(data: SessionData) {
  const payloadObj: SessionPayload = { ...data, iat: Date.now() };
  const payload = JSON.stringify(payloadObj);
  const sig = hmac(payload);
  const value = Buffer.from(payload, "utf8").toString("base64") + "." + sig;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return null;
  }

  const expected = hmac(payload);
  if (sig !== expected) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    return null;
  }

  if (!isSessionPayload(parsed)) return null;

  return {
    userId: parsed.userId,
    fullName: parsed.fullName,
    role: parsed.role,
  };
}