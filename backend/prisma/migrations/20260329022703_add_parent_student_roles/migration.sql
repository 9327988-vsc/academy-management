-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('teacher', 'principal', 'parent', 'student') NOT NULL DEFAULT 'teacher';
