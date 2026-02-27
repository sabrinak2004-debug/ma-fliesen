import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;
  if (!userId) return null;

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true },
  });

  return user ?? null;
}

export function isAdmin(user: SessionUser | null) {
  return user?.role === "ADMIN";
}