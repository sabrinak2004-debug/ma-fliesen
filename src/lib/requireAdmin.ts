import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

type AdminUser = {
  id: string;
  role: Role;
  isActive: boolean;
  fullName: string;
  companyId: string;
};

export async function requireAdmin(): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "ADMIN") return null;

  const dbUser = await prisma.appUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      fullName: true,
      companyId: true,
    },
  });

  if (!dbUser || !dbUser.isActive) return null;
  if (dbUser.role !== Role.ADMIN) return null;
  if (!dbUser.companyId) return null;

  return {
    id: dbUser.id,
    role: dbUser.role,
    isActive: dbUser.isActive,
    fullName: dbUser.fullName,
    companyId: dbUser.companyId,
  };
}