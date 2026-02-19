ALTER TABLE `seat_allocations` RENAME COLUMN `room_number` TO `room_id`;--> statement-breakpoint
ALTER TABLE `beds` RENAME COLUMN `room_number` TO `room_id`;--> statement-breakpoint
DROP INDEX `idx_room_number` ON `rooms`;--> statement-breakpoint
DROP INDEX `idx_beds_room` ON `beds`;--> statement-breakpoint
ALTER TABLE `seat_allocations` MODIFY COLUMN `room_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `beds` MODIFY COLUMN `room_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `seat_allocations` ADD CONSTRAINT `seat_allocations_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beds` ADD CONSTRAINT `beds_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_seat_alloc_room` ON `seat_allocations` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_room_id` ON `rooms` (`id`);--> statement-breakpoint
CREATE INDEX `idx_beds_room_id` ON `beds` (`room_id`);