import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🏠"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  roomId: text("room_id").references(() => rooms.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  integration: text("integration").notNull(),
  externalId: text("external_id"),
  status: text("status").notNull().default("unknown"),
  riskLevel: text("risk_level").notNull().default("low"),
  canControl: integer("can_control", { mode: "boolean" }).notNull().default(false),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const readings = sqliteTable("readings", {
  id: text("id").primaryKey(),
  deviceId: text("device_id")
    .notNull()
    .references(() => devices.id),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
});

export const latestStates = sqliteTable("latest_states", {
  deviceId: text("device_id")
    .primaryKey()
    .references(() => devices.id),
  payload: text("payload", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").references(() => devices.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const automationRules = sqliteTable("automation_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  trigger: text("trigger", { mode: "json" }).notNull(),
  action: text("action", { mode: "json" }).notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  recommendationOnly: integer("recommendation_only", { mode: "boolean" })
    .notNull()
    .default(true),
  lastRunAt: integer("last_run_at", { mode: "timestamp" }),
});

export const controlAuditLog = sqliteTable("control_audit_log", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").references(() => devices.id),
  action: text("action").notNull(),
  source: text("source").notNull(),
  riskLevel: text("risk_level").notNull(),
  result: text("result").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  section: text("section").notNull(),
  value: text("value").notNull().default(""),
  type: text("type").notNull().default("text"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const discoveredDevices = sqliteTable("discovered_devices", {
  id: text("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  hostname: text("hostname"),
  vendor: text("vendor"),
  openPorts: text("open_ports", { mode: "json" }).notNull(),
  likelyType: text("likely_type").notNull(),
  confidence: integer("confidence").notNull().default(0),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  discoveredAt: integer("discovered_at", { mode: "timestamp" }).notNull(),
});
