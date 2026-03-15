// src/lib/auth.ts
import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "mafliesen_session";

function hmac(input: string): string {
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

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function createSessionCookieValue(data: SessionData): string {
  const payloadObj: SessionPayload = { ...data, iat: Date.now() };
  const payload = JSON.stringify(payloadObj);
  const sig = hmac(payload);
  return `${toBase64Url(payload)}.${sig}`;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;

  let payload: string;
  try {
    payload = fromBase64Url(b64);
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
