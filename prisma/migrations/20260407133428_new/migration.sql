/*
  Warnings:

  - The values [PL,FR,ES,NL,DA,AA,AB,AF,AM,AR,HY,AZ,AS,AY,BA,EU,BE,BN,BH,BI,BR,BG,MY,ZH,DZ,IU,EO,ET,FO,FA,FJ,FI,FY,GA,GD,GL,KA,EL,KL,GN,GU,HA,HE,HI,ID,IA,IE,IK,IS,JA,JV,YI,YO,KM,KN,KK,KS,CA,RW,KY,RN,KO,CO,HR,LO,LA,LV,LN,LT,MG,ML,MS,MT,MI,MR,MK,MO,MN,NE,NO,OC,OR,OM,PS,PT,PA,QU,RM,RO,RU,SM,SG,SA,SN,SV,SR,SH,TN,SD,SI,SK,SL,SO,SW,SU,TG,TL,TA,TT,TE,TH,BO,TI,CS,TK,TO,TS,TW,UG,UK,HU,UR,UZ,VI,CY,WO,XH,ZA,ZU] on the enum `AppLanguage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppLanguage_new" AS ENUM ('DE', 'EN', 'IT', 'TR', 'SQ', 'KU');
ALTER TABLE "public"."AppUser" ALTER COLUMN "language" DROP DEFAULT;
ALTER TABLE "AppUser" ALTER COLUMN "language" TYPE "AppLanguage_new" USING ("language"::text::"AppLanguage_new");
ALTER TYPE "AppLanguage" RENAME TO "AppLanguage_old";
ALTER TYPE "AppLanguage_new" RENAME TO "AppLanguage";
DROP TYPE "public"."AppLanguage_old";
ALTER TABLE "AppUser" ALTER COLUMN "language" SET DEFAULT 'DE';
COMMIT;
