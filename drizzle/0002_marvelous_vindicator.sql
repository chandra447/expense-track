CREATE TABLE `credit_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`function_calls_used` integer DEFAULT 0 NOT NULL,
	`messages_used` integer DEFAULT 0 NOT NULL,
	`function_calls_limit` integer DEFAULT 10 NOT NULL,
	`messages_limit` integer DEFAULT 10 NOT NULL,
	`is_premium` integer DEFAULT 0 NOT NULL,
	`last_reset_date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_credits_user_id_unique` ON `user_credits` (`user_id`);