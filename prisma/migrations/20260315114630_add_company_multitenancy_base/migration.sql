-- 1) Company-Tabelle anlegen
CREATE TABLE "Company" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subdomain" TEXT NOT NULL,
  "logoUrl" TEXT,
  "primaryColor" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE UNIQUE INDEX "Company_subdomain_key" ON "Company"("subdomain");

-- 2) companyId erstmal nullable zu AppUser hinzufügen
ALTER TABLE "AppUser"
ADD COLUMN "companyId" TEXT;

-- 3) Standardfirma für bestehende Daten anlegen
INSERT INTO "Company" (
  "id",
  "name",
  "subdomain",
  "logoUrl",
  "primaryColor",
  "isDemo",
  "createdAt"
)
VALUES (
  'company_ma_fliesen',
  'MA-Fliesen',
  'ma-fliesen',
  NULL,
  '#b8cf3a',
  false,
  CURRENT_TIMESTAMP
);

INSERT INTO "Company" (
  "id",
  "name",
  "subdomain",
  "logoUrl",
  "primaryColor",
  "isDemo",
  "createdAt"
)
VALUES (
  'company_beispielbetrieb',
  'Beispielbetrieb',
  'beispielbetrieb',
  NULL,
  '#6b7280',
  true,
  CURRENT_TIMESTAMP
);

-- 4) Alle bestehenden User auf MA-Fliesen setzen
UPDATE "AppUser"
SET "companyId" = 'company_ma_fliesen'
WHERE "companyId" IS NULL;

-- 5) companyId jetzt auf required setzen
ALTER TABLE "AppUser"
ALTER COLUMN "companyId" SET NOT NULL;

-- 6) alten globalen fullName-Unique-Constraint entfernen
DROP INDEX IF EXISTS "AppUser_fullName_key";

-- 7) neue Indizes / Unique-Regel anlegen
CREATE INDEX "AppUser_companyId_idx" ON "AppUser"("companyId");
CREATE UNIQUE INDEX "AppUser_companyId_fullName_key" ON "AppUser"("companyId", "fullName");

-- 8) Foreign Key setzen
ALTER TABLE "AppUser"
ADD CONSTRAINT "AppUser_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;