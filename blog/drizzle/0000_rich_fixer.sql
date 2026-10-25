CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `posts_status_published` ON `blog_posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_owner` ON `blog_posts` (`owner_id`);