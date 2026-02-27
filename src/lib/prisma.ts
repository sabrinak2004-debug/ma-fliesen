import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function getPool() {
  if (!globalForPrisma.pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL fehlt in .env");
    globalForPrisma.pool = new Pool({ connectionString: url });
  }
  return globalForPrisma.pool;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(getPool()),
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}