DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `expenses` ALTER COLUMN "user_id" TO "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ALTER COLUMN "user_id" TO "user_id" text NOT NULL;