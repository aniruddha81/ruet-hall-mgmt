CREATE TABLE `seat_allocations` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`roll_number` varchar(20) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`room_id` varchar(36) NOT NULL,
	`bed_id` varchar(36) NOT NULL,
	`allocated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`allocated_by` varchar(36) NOT NULL,
	CONSTRAINT `seat_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seat_applications` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`roll_number` varchar(20) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL'),
	`academic_department` enum('CSE','EEE','ME','CE','IPE','ECE','ETE','BME','MTE','URP','ChE','Arch') NOT NULL,
	`session` varchar(10) NOT NULL,
	`seat_application_status` enum('PENDING','APPROVED','REJECTED','WAITLIST') NOT NULL DEFAULT 'PENDING',
	`reviewed_by` varchar(36),
	`reviewed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `seat_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hall_admins` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`academic_department` enum('CSE','EEE','ME','CE','IPE','ECE','ETE','BME','MTE','URP','ChE','Arch') NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`admin_designation` enum('PROVOST','ASST_FINANCE','FINANCE_SECTION_OFFICER','ASST_DINING','DINING_MANAGER','ASST_INVENTORY','INVENTORY_SECTION_OFFICER') NOT NULL,
	`operational_unit` enum('FINANCE','DINING','INVENTORY','ALL') NOT NULL,
	`reporting_to_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`avatar_url` varchar(512),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `hall_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `hall_admins_email_unique` UNIQUE(`email`)
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
CREATE TABLE `uni_students` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`roll_number` varchar(20) NOT NULL,
	`academic_department` enum('CSE','EEE','ME','CE','IPE','ECE','ETE','BME','MTE','URP','ChE','Arch') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`avatar_url` varchar(512),
	`is_allocated` boolean NOT NULL DEFAULT false,
	`session` varchar(10),
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL'),
	`room_id` varchar(36),
	`student_status` enum('ACTIVE','ALUMNI','SUSPENDED','EXPELLED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `uni_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `uni_students_email_unique` UNIQUE(`email`),
	CONSTRAINT `uni_students_roll_number_unique` UNIQUE(`roll_number`)
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
	CONSTRAINT `meal_menus_id` PRIMARY KEY(`id`)
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
	CONSTRAINT `meal_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`title` varchar(255) NOT NULL,
	`amount` int unsigned NOT NULL,
	`category` varchar(100) NOT NULL,
	`approved_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`due_id` varchar(36),
	`amount` int unsigned NOT NULL,
	`finance_payment_method` enum('CASH','BANK','ONLINE') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_dues` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`due_type` enum('RENT','FINE','OTHER') NOT NULL,
	`amount` int unsigned NOT NULL,
	`due_status` enum('UNPAID','PAID') NOT NULL DEFAULT 'UNPAID',
	`paid_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `student_dues_id` PRIMARY KEY(`id`)
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
	`id` varchar(36) NOT NULL,
	`room_number` smallint unsigned NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`capacity` tinyint unsigned NOT NULL,
	`current_occupancy` smallint unsigned NOT NULL DEFAULT 0,
	`room_status` enum('AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED') NOT NULL DEFAULT 'AVAILABLE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` int unsigned NOT NULL DEFAULT 1,
	`asset_condition` enum('GOOD','FAIR','POOR','DAMAGED') NOT NULL DEFAULT 'GOOD',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beds` (
	`id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`room_id` varchar(36) NOT NULL,
	`bed_label` varchar(10) NOT NULL,
	`bed_status` enum('AVAILABLE','OCCUPIED','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `beds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `damage_reports` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`asset_id` varchar(36) NOT NULL,
	`hall` enum('ZIA_HALL','SHAH_JALAL_HALL','RASHID_HALL','FARUKI_HALL') NOT NULL,
	`description` text NOT NULL,
	`fine_amount` int unsigned,
	`damage_report_status` enum('REPORTED','VERIFIED') NOT NULL DEFAULT 'REPORTED',
	`verified_by` varchar(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `damage_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `seat_allocations` ADD CONSTRAINT `seat_allocations_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_allocations` ADD CONSTRAINT `seat_allocations_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_allocations` ADD CONSTRAINT `seat_allocations_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_allocations` ADD CONSTRAINT `seat_allocations_bed_id_beds_id_fk` FOREIGN KEY (`bed_id`) REFERENCES `beds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_allocations` ADD CONSTRAINT `seat_allocations_allocated_by_hall_admins_id_fk` FOREIGN KEY (`allocated_by`) REFERENCES `hall_admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_applications` ADD CONSTRAINT `seat_applications_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_applications` ADD CONSTRAINT `seat_applications_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seat_applications` ADD CONSTRAINT `seat_applications_reviewed_by_hall_admins_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `hall_admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hall_admins` ADD CONSTRAINT `hall_admins_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hall_admins` ADD CONSTRAINT `hall_admins_reporting_to_id_hall_admins_id_fk` FOREIGN KEY (`reporting_to_id`) REFERENCES `hall_admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uni_students` ADD CONSTRAINT `uni_students_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uni_students` ADD CONSTRAINT `uni_students_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_menus` ADD CONSTRAINT `meal_menus_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_menus` ADD CONSTRAINT `meal_menus_created_by_hall_admins_id_fk` FOREIGN KEY (`created_by`) REFERENCES `hall_admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_payments` ADD CONSTRAINT `meal_payments_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_menu_id_meal_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `meal_menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_tokens` ADD CONSTRAINT `meal_tokens_payment_id_meal_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `meal_payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_approved_by_hall_admins_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `hall_admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_due_id_student_dues_id_fk` FOREIGN KEY (`due_id`) REFERENCES `student_dues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_dues` ADD CONSTRAINT `student_dues_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_dues` ADD CONSTRAINT `student_dues_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beds` ADD CONSTRAINT `beds_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beds` ADD CONSTRAINT `beds_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `damage_reports` ADD CONSTRAINT `damage_reports_student_id_uni_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `uni_students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `damage_reports` ADD CONSTRAINT `damage_reports_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `damage_reports` ADD CONSTRAINT `damage_reports_hall_halls_hall_fk` FOREIGN KEY (`hall`) REFERENCES `halls`(`hall`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `damage_reports` ADD CONSTRAINT `damage_reports_verified_by_hall_admins_id_fk` FOREIGN KEY (`verified_by`) REFERENCES `hall_admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_seat_alloc_student` ON `seat_allocations` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_seat_alloc_room` ON `seat_allocations` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_seat_alloc_hall` ON `seat_allocations` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_seat_alloc_bed` ON `seat_allocations` (`bed_id`);--> statement-breakpoint
CREATE INDEX `idx_seat_app_student` ON `seat_applications` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_seat_app_hall` ON `seat_applications` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_seat_app_status` ON `seat_applications` (`seat_application_status`);--> statement-breakpoint
CREATE INDEX `idx_admins_designation` ON `hall_admins` (`admin_designation`);--> statement-breakpoint
CREATE INDEX `idx_admins_hall` ON `hall_admins` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_admins_reporting_to` ON `hall_admins` (`reporting_to_id`);--> statement-breakpoint
CREATE INDEX `idx_admins_operational_unit` ON `hall_admins` (`operational_unit`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_expires_idx` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_uni_students_department` ON `uni_students` (`academic_department`);--> statement-breakpoint
CREATE INDEX `idx_students_hall` ON `uni_students` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_students_room` ON `uni_students` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_students_status` ON `uni_students` (`student_status`);--> statement-breakpoint
CREATE INDEX `idx_uni_students_allocated` ON `uni_students` (`is_allocated`);--> statement-breakpoint
CREATE INDEX `idx_meal_menus_hall` ON `meal_menus` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_meal_menus_date` ON `meal_menus` (`meal_date`);--> statement-breakpoint
CREATE INDEX `uq_menu_hall_date_type` ON `meal_menus` (`hall`,`meal_date`,`meal_type`);--> statement-breakpoint
CREATE INDEX `idx_meal_payments_student` ON `meal_payments` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_meal_payments_date` ON `meal_payments` (`payment_date`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_student` ON `meal_tokens` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_menu` ON `meal_tokens` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_hall` ON `meal_tokens` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_date` ON `meal_tokens` (`meal_date`);--> statement-breakpoint
CREATE INDEX `idx_meal_tokens_payment` ON `meal_tokens` (`payment_id`);--> statement-breakpoint
CREATE INDEX `idx_expenses_hall` ON `expenses` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_expenses_category` ON `expenses` (`category`);--> statement-breakpoint
CREATE INDEX `idx_payments_student` ON `payments` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_hall` ON `payments` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_dues_student` ON `student_dues` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_dues_hall` ON `student_dues` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_dues_status` ON `student_dues` (`due_status`);--> statement-breakpoint
CREATE INDEX `idx_dues_type` ON `student_dues` (`due_type`);--> statement-breakpoint
CREATE INDEX `idx_room_id` ON `rooms` (`id`);--> statement-breakpoint
CREATE INDEX `idx_rooms_hall` ON `rooms` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_rooms_status` ON `rooms` (`room_status`);--> statement-breakpoint
CREATE INDEX `idx_assets_hall` ON `assets` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_beds_hall` ON `beds` (`hall`);--> statement-breakpoint
CREATE INDEX `idx_beds_room_id` ON `beds` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_beds_status` ON `beds` (`bed_status`);--> statement-breakpoint
CREATE INDEX `idx_damage_student` ON `damage_reports` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_damage_asset` ON `damage_reports` (`asset_id`);--> statement-breakpoint
CREATE INDEX `idx_damage_status` ON `damage_reports` (`damage_report_status`);