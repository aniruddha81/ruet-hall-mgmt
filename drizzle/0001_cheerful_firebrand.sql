ALTER TABLE `meal_payments` DROP FOREIGN KEY `meal_payments_student_id_hall_students_id_fk`;
--> statement-breakpoint
ALTER TABLE `meal_tokens` DROP FOREIGN KEY `meal_tokens_student_id_hall_students_id_fk`;
--> statement-breakpoint
ALTER TABLE `meal_payments` ADD CONSTRAINT `meal_payments_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;