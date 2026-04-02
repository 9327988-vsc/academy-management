-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'TEACHER', 'PARENT', 'STUDENT') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teacher` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `education` TEXT NULL,
    `career` TEXT NULL,
    `subjects` JSON NULL,
    `introduction` TEXT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `hireDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employmentType` VARCHAR(191) NOT NULL DEFAULT '정규직',
    `hourlyRate` INTEGER NULL,
    `salary` INTEGER NULL,
    `totalStudents` INTEGER NOT NULL DEFAULT 0,
    `totalClasses` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Teacher_userId_key`(`userId`),
    INDEX `Teacher_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `grade` VARCHAR(191) NULL,
    `school` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `address` TEXT NULL,
    `parentId` INTEGER NULL,
    `registrationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ACTIVE', 'WITHDRAWN', 'SUSPENDED', 'GRADUATED') NOT NULL DEFAULT 'ACTIVE',
    `totalEnrollments` INTEGER NOT NULL DEFAULT 0,
    `attendanceRate` DOUBLE NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Student_userId_key`(`userId`),
    INDEX `Student_parentId_idx`(`parentId`),
    INDEX `Student_phone_idx`(`phone`),
    INDEX `Student_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Parent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `relation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Parent_userId_key`(`userId`),
    UNIQUE INDEX `Parent_phone_key`(`phone`),
    INDEX `Parent_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `teacherId` INTEGER NOT NULL,
    `schedule` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `room` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 15,
    `tuitionFee` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `currentStudents` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Class_teacherId_idx`(`teacherId`),
    INDEX `Class_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `tuitionFee` INTEGER NOT NULL,
    `discount` INTEGER NOT NULL DEFAULT 0,
    `finalFee` INTEGER NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Enrollment_studentId_idx`(`studentId`),
    INDEX `Enrollment_classId_idx`(`classId`),
    INDEX `Enrollment_status_idx`(`status`),
    UNIQUE INDEX `Enrollment_studentId_classId_key`(`studentId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL,
    `checkInTime` DATETIME(3) NULL,
    `checkOutTime` DATETIME(3) NULL,
    `note` TEXT NULL,
    `recordedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Attendance_studentId_idx`(`studentId`),
    INDEX `Attendance_classId_idx`(`classId`),
    INDEX `Attendance_date_idx`(`date`),
    UNIQUE INDEX `Attendance_studentId_classId_date_key`(`studentId`, `classId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `month` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `method` VARCHAR(191) NULL,
    `receiptUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_studentId_idx`(`studentId`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consultation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `teacherId` INTEGER NOT NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `actualDate` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `type` ENUM('INITIAL', 'REGULAR', 'EMERGENCY', 'PARENT') NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `topic` TEXT NULL,
    `content` TEXT NULL,
    `outcome` TEXT NULL,
    `attendees` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Consultation_studentId_idx`(`studentId`),
    INDEX `Consultation_teacherId_idx`(`teacherId`),
    INDEX `Consultation_scheduledDate_idx`(`scheduledDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassHomework` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClassHomework_classId_idx`(`classId`),
    INDEX `ClassHomework_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Homework` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classHomeworkId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'LATE', 'GRADED') NOT NULL DEFAULT 'PENDING',
    `submittedDate` DATETIME(3) NULL,
    `content` TEXT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL,
    `feedback` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Homework_studentId_idx`(`studentId`),
    INDEX `Homework_status_idx`(`status`),
    UNIQUE INDEX `Homework_classHomeworkId_studentId_key`(`classHomeworkId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `examName` VARCHAR(191) NOT NULL,
    `examDate` DATETIME(3) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `maxScore` DOUBLE NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `rank` INTEGER NULL,
    `grade` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Grade_studentId_idx`(`studentId`),
    INDEX `Grade_examDate_idx`(`examDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `type` ENUM('CLASS', 'MEETING', 'CONSULTATION', 'BREAK', 'OTHER') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeacherSchedule_teacherId_idx`(`teacherId`),
    INDEX `TeacherSchedule_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `originalDate` DATETIME(3) NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClassSchedule_classId_idx`(`classId`),
    INDEX `ClassSchedule_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalaryRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `workHours` DOUBLE NOT NULL,
    `hourlyRate` INTEGER NULL,
    `baseSalary` INTEGER NOT NULL,
    `bonus` INTEGER NOT NULL DEFAULT 0,
    `deduction` INTEGER NOT NULL DEFAULT 0,
    `totalSalary` INTEGER NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `detail` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SalaryRecord_teacherId_idx`(`teacherId`),
    INDEX `SalaryRecord_month_idx`(`month`),
    UNIQUE INDEX `SalaryRecord_teacherId_month_key`(`teacherId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademySettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `academyName` VARCHAR(191) NULL,
    `ownerName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `businessNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Teacher` ADD CONSTRAINT `Teacher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parent` ADD CONSTRAINT `Parent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassHomework` ADD CONSTRAINT `ClassHomework_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Homework` ADD CONSTRAINT `Homework_classHomeworkId_fkey` FOREIGN KEY (`classHomeworkId`) REFERENCES `ClassHomework`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Homework` ADD CONSTRAINT `Homework_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grade` ADD CONSTRAINT `Grade_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSchedule` ADD CONSTRAINT `TeacherSchedule_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSchedule` ADD CONSTRAINT `ClassSchedule_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalaryRecord` ADD CONSTRAINT `SalaryRecord_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
