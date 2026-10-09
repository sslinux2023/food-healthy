-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'client',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `country` VARCHAR(191) NOT NULL DEFAULT 'Morocco',
    `age` INTEGER NULL,
    `gender` VARCHAR(191) NULL,
    `height` INTEGER NULL,
    `weight` INTEGER NULL,
    `goal` VARCHAR(191) NULL,
    `lifestyle` VARCHAR(191) NULL,
    `walksRegularly` BOOLEAN NOT NULL DEFAULT false,
    `weeklyBudget` INTEGER NULL,
    `foodPreferences` VARCHAR(191) NULL,
    `foodDislikes` VARCHAR(191) NULL,
    `familyMembersCount` INTEGER NULL DEFAULT 1,
    `bmi` DOUBLE NULL,
    `dailyCalories` INTEGER NULL,
    `tdee` INTEGER NULL,
    `proteinGrams` INTEGER NULL,
    `carbGrams` INTEGER NULL,
    `fatGrams` INTEGER NULL,
    `waterMl` INTEGER NULL,
    `idealWeightMin` DOUBLE NULL,
    `idealWeightMax` DOUBLE NULL,
    `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recipe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `prepTimeMinutes` INTEGER NULL,
    `calories` INTEGER NULL,
    `proteinGrams` INTEGER NULL,
    `carbGrams` INTEGER NULL,
    `fatGrams` INTEGER NULL,
    `servingGrams` INTEGER NOT NULL DEFAULT 250,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `isMoroccan` BOOLEAN NOT NULL DEFAULT false,
    `mealType` VARCHAR(191) NOT NULL,
    `ingredients` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeekPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `weekStart` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeekPlanMeal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weekPlanId` INTEGER NOT NULL,
    `recipeId` INTEGER NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `mealType` VARCHAR(191) NOT NULL,
    `servings` DOUBLE NOT NULL DEFAULT 1,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `waterGlasses` INTEGER NOT NULL DEFAULT 0,
    `vegetableServings` INTEGER NOT NULL DEFAULT 0,
    `sleepHours` DOUBLE NULL,
    `walkedMinutes` INTEGER NOT NULL DEFAULT 0,
    `points` INTEGER NOT NULL DEFAULT 0,
    `mealsEaten` VARCHAR(191) NOT NULL DEFAULT '[]',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShoppingItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `weekPlanId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(64) NOT NULL DEFAULT 'portion',
    `source` VARCHAR(16) NOT NULL DEFAULT 'plan',
    `isChecked` BOOLEAN NOT NULL DEFAULT false,
    `isDismissed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ShoppingItem_userId_weekPlanId_isDismissed_idx`(`userId`, `weekPlanId`, `isDismissed`),
    UNIQUE INDEX `ShoppingItem_userId_weekPlanId_name_unit_source_key`(`userId`, `weekPlanId`, `name`, `unit`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthScore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `score` INTEGER NOT NULL,
    `bmiPoints` INTEGER NOT NULL DEFAULT 0,
    `waterPoints` INTEGER NOT NULL DEFAULT 0,
    `mealsPoints` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HealthScore_userId_date_idx`(`userId`, `date`),
    UNIQUE INDEX `HealthScore_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WeekPlan` ADD CONSTRAINT `WeekPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeekPlanMeal` ADD CONSTRAINT `WeekPlanMeal_weekPlanId_fkey` FOREIGN KEY (`weekPlanId`) REFERENCES `WeekPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeekPlanMeal` ADD CONSTRAINT `WeekPlanMeal_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthLog` ADD CONSTRAINT `HealthLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShoppingItem` ADD CONSTRAINT `ShoppingItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthScore` ADD CONSTRAINT `HealthScore_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
