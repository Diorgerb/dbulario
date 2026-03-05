DROP INDEX `idx_name` ON `medications`;--> statement-breakpoint
ALTER TABLE `medications` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `medications` MODIFY COLUMN `holder` varchar(255);