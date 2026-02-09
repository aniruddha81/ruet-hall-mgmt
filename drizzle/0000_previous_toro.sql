CREATE TABLE `admins` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`admin_designation` enum('PROVOST','ASST_FINANCE','FINANCE_SECTION_OFFICER','ASST_DINING','DINING_MANAGER','ASST_INVENTORY','INVENTORY_SECTION_OFFICER') NOT NULL,
	`operational_unit` enum('FINANCE','DINING','INVENTORY','ALL') NOT NULL,
	`reporting_to_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `halls_hall_unique` UNIQUE(`hall`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(512) NOT NULL,
	`jti` varchar(255) NOT NULL,
	`ip` varchar(45),
	`user_agent` varchar(512),
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_hash_unique` UNIQUE(`token_hash`),
	CONSTRAINT `refresh_tokens_jti_unique` UNIQUE(`jti`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`roll_number` int NOT NULL,
	`session` varchar(10),
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`room_id` varchar(36),
	`student_status` enum('ACTIVE','ALUMNI','SUSPENDED','EXPELLED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `students_roll_number_unique` UNIQUE(`roll_number`),
	CONSTRAINT `halls_hall_unique` UNIQUE(`hall`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`user_role` enum('PROVOST','ASST_FINANCE','FINANCE_SECTION_OFFICER','ASST_DINING','DINING_MANAGER','ASST_INVENTORY','INVENTORY_SECTION_OFFICER','STUDENT') NOT NULL DEFAULT 'STUDENT',
	`academic_department` enum('CSE','EEE','ME','CE','IPE','ECE','ETE','BME','MTE','URP','ChE','Arch') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`avatar_url` varchar(512),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `halls` (
	`id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`address` text,
	`contact_number` varchar(20),
	`total_capacity` int NOT NULL DEFAULT 0,
	`total_rooms` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `halls_id` PRIMARY KEY(`id`),
	CONSTRAINT `halls_hall_unique` UNIQUE(`hall`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` varchar(36) NOT NULL,
	`hall_id` varchar(36) NOT NULL,
	`room_number` smallint unsigned NOT NULL,
	`floor` tinyint unsigned NOT NULL,
	`capacity` tinyint unsigned NOT NULL,
	`current_occupancy` smallint unsigned NOT NULL DEFAULT 0,
	`room_status` enum('AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED') NOT NULL DEFAULT 'AVAILABLE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_reporting_to_id_users_id_fk` FOREIGN KEY (`reporting_to_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_hall_id_halls_id_fk` FOREIGN KEY (`hall_id`) REFERENCES `halls`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_admins_hall` ON `admins` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_admins_reporting_to` ON `admins` (`reporting_to_id`);--> statement-breakpoint
CREATE INDEX `idx_admins_operational_unit` ON `admins` (`operational_unit`);--> statement-breakpoint
CREATE INDEX `uq_admin_user_hall` ON `admins` (`user_id`,`hall`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_expires_idx` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_students_hall` ON `students` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_students_room` ON `students` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_students_status` ON `students` (`student_status`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`user_role`);--> statement-breakpoint
CREATE INDEX `uq_room_hall_number` ON `rooms` (`hall_id`,`room_number`);--> statement-breakpoint
CREATE INDEX `idx_rooms_hall` ON `rooms` (`hall_id`);--> statement-breakpoint
CREATE INDEX `idx_rooms_status` ON `rooms` (`room_status`);