-- AlterTable
ALTER TABLE `Recipe` ADD COLUMN `isCalorieDense` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isLight` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `suitableFor` VARCHAR(16) NOT NULL DEFAULT 'all';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `constitutionType` VARCHAR(16) NULL;
