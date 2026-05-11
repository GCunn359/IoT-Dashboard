CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`section` text NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`updated_at` integer NOT NULL
);
