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
	`room_number` smallint unsigned,
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
	`phone` varchar(20) NOT NULL,
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
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`address` text,
	`contact_number` varchar(20),
	`total_capacity` int NOT NULL DEFAULT 0,
	`total_rooms` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `halls_hall` PRIMARY KEY(`hall`),
	CONSTRAINT `halls_hall_unique` UNIQUE(`hall`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`room_number` smallint unsigned NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`capacity` tinyint unsigned NOT NULL,
	`current_occupancy` smallint unsigned NOT NULL DEFAULT 0,
	`room_status` enum('AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED') NOT NULL DEFAULT 'AVAILABLE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_room_number` PRIMARY KEY(`room_number`)
);
--> statement-breakpoint
CREATE TABLE `meal_menus` (
	`id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`meal_date` date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL 1 DAY),
	`meal_type` enum('LUNCH','DINNER') NOT NULL,
	`menu_description` text,
	`price` tinyint unsigned NOT NULL DEFAULT 40,
	`total_tokens` int unsigned NOT NULL,
	`booked_tokens` int unsigned NOT NULL DEFAULT 0,
	`available_tokens` int unsigned GENERATED ALWAYS AS ((`total_tokens` - `booked_tokens`)) STORED NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `meal_menus_id` PRIMARY KEY(`id`),
	CONSTRAINT `halls_hall_unique` UNIQUE(`hall`)
);
--> statement-breakpoint
CREATE TABLE `meal_payments` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`amount` int unsigned NOT NULL,
	`total_quantity` tinyint unsigned NOT NULL,
	`payment_method` enum('BKASH','NAGAD','ROCKET','BANK','CASH') NOT NULL,
	`transaction_id` varchar(255),
	`payment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`refunded_at` datetime,
	`refund_amount` int unsigned,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `meal_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `meal_payments_transaction_id_unique` UNIQUE(`transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `meal_tokens` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`menu_id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`meal_date` date NOT NULL,
	`meal_type` enum('LUNCH','DINNER') NOT NULL,
	`quantity` tinyint unsigned NOT NULL DEFAULT 1,
	`total_amount` int unsigned NOT NULL,
	`payment_id` varchar(36) NOT NULL,
	`booking_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`cancelled_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `meal_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `halls_hall_unique` UNIQUE(`hall`)
);
--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_reporting_to_id_users_id_fk` FOREIGN KEY (`reporting_to_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_room_number_rooms_room_number_fk` FOREIGN KEY (`room_number`) REFERENCES `rooms`(`room_number`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `halls` ADD CONSTRAINT `halls_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_menus` ADD CONSTRAINT `meal_menus_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_menus` ADD CONSTRAINT `meal_menus_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_payments` ADD CONSTRAINT `meal_payments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_menu_id_meal_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `meal_menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_payment_id_meal_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `meal_payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_admins_hall` ON `admins` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_admins_reporting_to` ON `admins` (`reporting_to_id`);--> statement-breakpoint
CREATE INDEX `idx_admins_operational_unit` ON `admins` (`operational_unit`);--> statement-breakpoint
CREATE INDEX `uq_admin_user_hall` ON `admins` (`user_id`,`hall`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_expires_idx` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_students_hall` ON `students` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_students_room` ON `students` (`room_number`);--> statement-breakpoint
CREATE INDEX `idx_students_status` ON `students` (`student_status`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`user_role`);--> statement-breakpoint
CREATE INDEX `uq_room_hall_number` ON `rooms` (`hall`,`room_number`);--> statement-breakpoint
CREATE INDEX `idx_rooms_hall` ON `rooms` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_rooms_status` ON `rooms` (`room_status`);--> statement-breakpoint
CREATE INDEX `idx_meal_menus_hall` ON `meal_menus` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_meal_menus_date` ON `meal_menus` (`meal_date`);--> statement-breakpoint
CREATE INDEX `uq_menu_hall_date_type` ON `meal_menus` (`hall`,`meal_date`,`meal_type`);--> statement-breakpoint
CREATE INDEX `idx_meal_payments_student` ON `meal_payments` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_meal_payments_date` ON `meal_payments` (`payment_date`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_student` ON `meal_tokens` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_menu` ON `meal_tokens` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_hall` ON `meal_tokens` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_date` ON `meal_tokens` (`meal_date`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_payment` ON `meal_tokens` (`payment_id`);