-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('teacher', 'principal') NOT NULL DEFAULT 'teacher';
