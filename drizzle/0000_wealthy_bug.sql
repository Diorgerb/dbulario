CREATE TABLE `adminLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`details` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicationId` int NOT NULL,
	`previousName` text,
	`updateType` enum('nome_alterado','status_alterado','novo_registro','bula_atualizada') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`details` json,
	CONSTRAINT `medicationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`registrationNumber` varchar(20) NOT NULL,
	`holder` varchar(255),
	`category` enum('medicamento','vacina','biológico','fitoterápico','homeopático','outro') DEFAULT 'medicamento',
	`status` enum('ativo','inativo','atualizado') DEFAULT 'ativo',
	`lastUpdate` timestamp DEFAULT (now()),
	`dataSource` varchar(255) DEFAULT 'ANVISA',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`),
	CONSTRAINT `medications_registrationNumber_unique` UNIQUE(`registrationNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('novo_medicamento','atualizacao_detectada','alerta_sistema') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`isRead` boolean DEFAULT false,
	`medicationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`query` text NOT NULL,
	`resultsCount` int DEFAULT 0,
	`filters` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `idx_userId` ON `adminLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `adminLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_medicationId` ON `medicationHistory` (`medicationId`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `medicationHistory` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_registrationNumber` ON `medications` (`registrationNumber`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `medications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_lastUpdate` ON `medications` (`lastUpdate`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `searchHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `searchHistory` (`timestamp`);