import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

type PrismaPgPool = ConstructorParameters<typeof PrismaPg>[0];

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt in .env");

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool as unknown as PrismaPgPool),
});

type SeedEmployee = {
  fullName: string;
  employmentStartDate: string | null;
};

// ✅ Mitarbeiter der echten Firma
const MA_FLIESEN_EMPLOYEES: SeedEmployee[] = [
  { fullName: "Max Mustermann", employmentStartDate: "2026-03-01" },
  { fullName: "Ilija Nikic", employmentStartDate: "2026-05-01" },
  { fullName: "Cosmin Alexandroae", employmentStartDate: "2026-05-01" },
  { fullName: "Francesco Cascania", employmentStartDate: "2026-05-01" },
  { fullName: "Elvis Sulejmani", employmentStartDate: "2026-05-01" },
  { fullName: "Leon Meinhold", employmentStartDate: "2026-05-01" },
  { fullName: "Behar Mehmeti", employmentStartDate: "2026-05-01" },
  { fullName: "Kerim Balci", employmentStartDate: "2026-05-01" },
  { fullName: "Kay Bode", employmentStartDate: "2026-05-01" },
];

// ✅ Demo-Firma für neue Kunden
const DEMO_EMPLOYEES: SeedEmployee[] = [
  { fullName: "Mia Becker", employmentStartDate: "2026-03-01" },
  { fullName: "Jonas Wolf", employmentStartDate: "2026-03-01" },
  { fullName: "Leonie Hartmann", employmentStartDate: "2026-03-01" },
];

async function main() {
  const martinPw = process.env.ADMIN_MARTIN_PASSWORD;
  const sandraPw = process.env.ADMIN_SANDRA_PASSWORD;
  const demoAdminPw = process.env.DEMO_ADMIN_PASSWORD;

  if (!martinPw || !sandraPw || !demoAdminPw) {
    throw new Error(
      "ADMIN_MARTIN_PASSWORD, ADMIN_SANDRA_PASSWORD oder DEMO_ADMIN_PASSWORD fehlen in .env"
    );
  }

  const martinHash = await bcrypt.hash(martinPw, 12);
  const sandraHash = await bcrypt.hash(sandraPw, 12);
  const demoAdminHash = await bcrypt.hash(demoAdminPw, 12);

  const maFliesenCompany = await prisma.company.upsert({
    where: { subdomain: "ma-fliesen" },
    update: {
      name: "MA Fliesen",
      primaryColor: "#b8cf3a",
      isDemo: false,
    },
    create: {
      name: "MA Fliesen",
      subdomain: "ma-fliesen",
      primaryColor: "#b8cf3a",
      isDemo: false,
    },
  });

  const demoCompany = await prisma.company.upsert({
    where: { subdomain: "beispielbetrieb" },
    update: {
      name: "Beispielbetrieb",
      primaryColor: "#6b7280",
      isDemo: true,
    },
    create: {
      name: "Beispielbetrieb",
      subdomain: "beispielbetrieb",
      primaryColor: "#6b7280",
      isDemo: true,
    },
  });

  // ✅ Admins (Passwort immer aus ENV)
  await prisma.appUser.upsert({
    where: {
      companyId_fullName: {
        companyId: maFliesenCompany.id,
        fullName: "Martin Meinhold",
      },
    },
    update: {
      role: Role.ADMIN,
      isActive: true,
      passwordHash: martinHash,
    },
    create: {
      companyId: maFliesenCompany.id,
      fullName: "Martin Meinhold",
      role: Role.ADMIN,
      isActive: true,
      passwordHash: martinHash,
    },
  });

  await prisma.appUser.upsert({
    where: {
      companyId_fullName: {
        companyId: maFliesenCompany.id,
        fullName: "Sandra Meinhold",
      },
    },
    update: {
      role: Role.ADMIN,
      isActive: true,
      passwordHash: sandraHash,
    },
    create: {
      companyId: maFliesenCompany.id,
      fullName: "Sandra Meinhold",
      role: Role.ADMIN,
      isActive: true,
      passwordHash: sandraHash,
    },
  });

  // ✅ Mitarbeiter MA-Fliesen
  for (const employee of MA_FLIESEN_EMPLOYEES) {
    await prisma.appUser.upsert({
      where: {
        companyId_fullName: {
          companyId: maFliesenCompany.id,
          fullName: employee.fullName,
        },
      },
      update: {
        role: Role.EMPLOYEE,
        isActive: true,
        employmentStartDate: employee.employmentStartDate
          ? new Date(`${employee.employmentStartDate}T00:00:00.000Z`)
          : null,
      },
      create: {
        companyId: maFliesenCompany.id,
        fullName: employee.fullName,
        role: Role.EMPLOYEE,
        isActive: true,
        employmentStartDate: employee.employmentStartDate
          ? new Date(`${employee.employmentStartDate}T00:00:00.000Z`)
          : null,
      },
    });
  }

  // ✅ Demo-Admins
  await prisma.appUser.upsert({
    where: {
      companyId_fullName: {
        companyId: demoCompany.id,
        fullName: "Demo Admin",
      },
    },
    update: {
      role: Role.ADMIN,
      isActive: true,
      passwordHash: demoAdminHash,
    },
    create: {
      companyId: demoCompany.id,
      fullName: "Demo Admin",
      role: Role.ADMIN,
      isActive: true,
      passwordHash: demoAdminHash,
    },
  });

  // ✅ Demo-Mitarbeiter
  for (const employee of DEMO_EMPLOYEES) {
    await prisma.appUser.upsert({
      where: {
        companyId_fullName: {
          companyId: demoCompany.id,
          fullName: employee.fullName,
        },
      },
      update: {
        role: Role.EMPLOYEE,
        isActive: true,
        employmentStartDate: employee.employmentStartDate
          ? new Date(`${employee.employmentStartDate}T00:00:00.000Z`)
          : null,
      },
      create: {
        companyId: demoCompany.id,
        fullName: employee.fullName,
        role: Role.EMPLOYEE,
        isActive: true,
        employmentStartDate: employee.employmentStartDate
          ? new Date(`${employee.employmentStartDate}T00:00:00.000Z`)
          : null,
      },
    });
  }

  console.log("✅ Seed OK: Firmen + Admins + Mitarbeiter hinterlegt");
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