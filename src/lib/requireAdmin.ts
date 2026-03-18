import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "ADMIN") return null;

  const dbUser = await prisma.appUser.findFirst({
    where: {
      id: session.userId,
      companyId: session.companyId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
      fullName: true,
      companyId: true,
    },
  });

  if (!dbUser || !dbUser.isActive) return null;
  if (dbUser.role !== "ADMIN") return null;

  return dbUser;
}