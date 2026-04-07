-- CreateEnum
CREATE TYPE "AppLanguage" AS ENUM ('DE', 'EN', 'PL', 'TR', 'FR', 'IT', 'ES', 'SQ', 'NL', 'DA', 'AA', 'AB', 'AF', 'AM', 'AR', 'HY', 'AZ', 'AS', 'AY', 'BA', 'EU', 'BE', 'BN', 'BH', 'BI', 'BR', 'BG', 'MY', 'ZH', 'DZ', 'IU', 'EO', 'ET', 'FO', 'FA', 'FJ', 'FI', 'FY', 'GA', 'GD', 'GL', 'KA', 'EL', 'KL', 'GN', 'GU', 'HA', 'HE', 'HI', 'ID', 'IA', 'IE', 'IK', 'IS', 'JA', 'JV', 'YI', 'YO', 'KM', 'KN', 'KK', 'KS', 'CA', 'RW', 'KY', 'RN', 'KO', 'CO', 'HR', 'KU', 'LO', 'LA', 'LV', 'LN', 'LT', 'MG', 'ML', 'MS', 'MT', 'MI', 'MR', 'MK', 'MO', 'MN', 'NE', 'NO', 'OC', 'OR', 'OM', 'PS', 'PT', 'PA', 'QU', 'RM', 'RO', 'RU', 'SM', 'SG', 'SA', 'SN', 'SV', 'SR', 'SH', 'TN', 'SD', 'SI', 'SK', 'SL', 'SO', 'SW', 'SU', 'TG', 'TL', 'TA', 'TT', 'TE', 'TH', 'BO', 'TI', 'CS', 'TK', 'TO', 'TS', 'TW', 'UG', 'UK', 'HU', 'UR', 'UZ', 'VI', 'CY', 'WO', 'XH', 'ZA', 'ZU');

-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "language" "AppLanguage" NOT NULL DEFAULT 'DE';
