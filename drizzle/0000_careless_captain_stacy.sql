CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`severity` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`trigger` text NOT NULL,
	`action` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`recommendation_only` integer DEFAULT true NOT NULL,
	`last_run_at` integer
);
--> statement-breakpoint
CREATE TABLE `control_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text,
	`action` text NOT NULL,
	`source` text NOT NULL,
	`risk_level` text NOT NULL,
	`result` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`integration` text NOT NULL,
	`external_id` text,
	`status` text DEFAULT 'unknown' NOT NULL,
	`risk_level` text DEFAULT 'low' NOT NULL,
	`can_control` integer DEFAULT false NOT NULL,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `latest_states` (
	`device_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT '🏠' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
