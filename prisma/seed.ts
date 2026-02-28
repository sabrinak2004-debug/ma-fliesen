import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt in .env");

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ✅ hier trägst du alle Mitarbeiter ein, die Zugriff haben sollen
const EMPLOYEES: string[] = [
  "Max Mustermann",
  "Ilija Nikic",
  "Coco",
  "Francesco",
  "Elvis",
  "Leon",
  "Behar",
  "Kerim",
  "Marko",
  "Cedric",
  "Kay",
  // "Vorname Nachname",
];

async function main() {
  const martinPw = process.env.ADMIN_MARTIN_PASSWORD;
  const sandraPw = process.env.ADMIN_SANDRA_PASSWORD;

  if (!martinPw || !sandraPw) {
    throw new Error("ADMIN_MARTIN_PASSWORD oder ADMIN_SANDRA_PASSWORD fehlen in .env");
  }

  const martinHash = await bcrypt.hash(martinPw, 12);
  const sandraHash = await bcrypt.hash(sandraPw, 12);

  // ✅ Admins (Passwort immer aus ENV)
  await prisma.appUser.upsert({
    where: { fullName: "Martin Meinhold" },
    update: { role: Role.ADMIN, isActive: true, passwordHash: martinHash },
    create: { fullName: "Martin Meinhold", role: Role.ADMIN, isActive: true, passwordHash: martinHash },
  });

  await prisma.appUser.upsert({
    where: { fullName: "Sandra Meinhold" },
    update: { role: Role.ADMIN, isActive: true, passwordHash: sandraHash },
    create: { fullName: "Sandra Meinhold", role: Role.ADMIN, isActive: true, passwordHash: sandraHash },
  });

  // ✅ Mitarbeiter: ohne Passwort anlegen (Passwort wird beim ersten Login gesetzt)
  for (const fullName of EMPLOYEES) {
    await prisma.appUser.upsert({
      where: { fullName },
      update: {
        role: Role.EMPLOYEE,
        isActive: true,
        // ✅ passwordHash NICHT überschreiben!
      },
      create: {
        fullName,
        role: Role.EMPLOYEE,
        isActive: true,
        // passwordHash bleibt null
      },
    });
  }

  console.log("✅ Seed OK: Admins + Mitarbeiter hinterlegt");
}

main()
  .catch((e) => {
    console.error("❌ Seed Fehler:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });