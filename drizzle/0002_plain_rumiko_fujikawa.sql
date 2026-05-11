CREATE TABLE `discovered_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`ip_address` text NOT NULL,
	`hostname` text,
	`vendor` text,
	`open_ports` text NOT NULL,
	`likely_type` text NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`discovered_at` integer NOT NULL
);
