import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.appUser.upsert({
    where: { fullName: "Martin" },
    update: {},
    create: {
      fullName: "Martin",
      role: Role.ADMIN,
    },
  });

  await prisma.appUser.upsert({
    where: { fullName: "Sandra" },
    update: {},
    create: {
      fullName: "Sandra",
      role: Role.ADMIN,
    },
  });

  await prisma.appUser.upsert({
    where: { fullName: "Sabrina" },
    update: {},
    create: {
      fullName: "Sabrina",
      role: Role.EMPLOYEE,
    },
  });

  console.log("Seed erfolgreich 🌱");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());