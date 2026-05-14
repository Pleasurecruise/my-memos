CREATE TABLE `memos` (
	`id` text PRIMARY KEY,
	`r2_key` text NOT NULL UNIQUE,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`visibility` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `memos_created_at_idx` ON `memos` (`created_at`);--> statement-breakpoint
CREATE INDEX `memos_archived_idx` ON `memos` (`archived`,`created_at`);--> statement-breakpoint
CREATE INDEX `memos_pinned_idx` ON `memos` (`pinned`,`created_at`);