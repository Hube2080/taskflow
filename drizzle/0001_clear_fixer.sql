CREATE TABLE `projectFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` varchar(128) NOT NULL,
	`taskId` varchar(128),
	`fileKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectFiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `projectFiles_fileKey_unique` UNIQUE(`fileKey`)
);
