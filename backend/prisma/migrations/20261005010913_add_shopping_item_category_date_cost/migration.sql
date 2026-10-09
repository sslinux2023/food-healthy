-- AlterTable
ALTER TABLE `ShoppingItem` ADD COLUMN `category` VARCHAR(32) NULL,
    ADD COLUMN `estimatedCostPerUnit` INTEGER NULL DEFAULT 0,
    ADD COLUMN `forDate` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `ShoppingItem_userId_forDate_idx` ON `ShoppingItem`(`userId`, `forDate`);
