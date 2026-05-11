import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import * as schema from "./schema";

function getSqlitePath() {
  const url = process.env.DATABASE_URL ?? "file:./data/iot-dashboard.sqlite";

  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a file: SQLite URL.");
  }

  return url.replace("file:", "");
}

function openSqlite() {
  const sqlitePath = getSqlitePath();

  if (sqlitePath !== ":memory:") {
    mkdirSync(dirname(sqlitePath), { recursive: true });
  }

  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);
  return sqlite;
}

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      icon text DEFAULT '🏠' NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id text PRIMARY KEY NOT NULL,
      room_id text REFERENCES rooms(id),
      name text NOT NULL,
      category text NOT NULL,
      integration text NOT NULL,
      external_id text,
      status text DEFAULT 'unknown' NOT NULL,
      risk_level text DEFAULT 'low' NOT NULL,
      can_control integer DEFAULT 0 NOT NULL,
      last_seen_at integer,
      created_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS latest_states (
      device_id text PRIMARY KEY NOT NULL REFERENCES devices(id),
      payload text NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS readings (
      id text PRIMARY KEY NOT NULL,
      device_id text NOT NULL REFERENCES devices(id),
      metric text NOT NULL,
      value real NOT NULL,
      unit text NOT NULL,
      recorded_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id text PRIMARY KEY NOT NULL,
      device_id text REFERENCES devices(id),
      title text NOT NULL,
      message text NOT NULL,
      severity text NOT NULL,
      status text DEFAULT 'active' NOT NULL,
      created_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      description text NOT NULL,
      trigger text NOT NULL,
      action text NOT NULL,
      enabled integer DEFAULT 0 NOT NULL,
      recommendation_only integer DEFAULT 1 NOT NULL,
      last_run_at integer
    );

    CREATE TABLE IF NOT EXISTS control_audit_log (
      id text PRIMARY KEY NOT NULL,
      device_id text REFERENCES devices(id),
      action text NOT NULL,
      source text NOT NULL,
      risk_level text NOT NULL,
      result text NOT NULL,
      created_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY NOT NULL,
      label text NOT NULL,
      section text NOT NULL,
      value text DEFAULT '' NOT NULL,
      type text DEFAULT 'text' NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discovered_devices (
      id text PRIMARY KEY NOT NULL,
      ip_address text NOT NULL,
      hostname text,
      vendor text,
      open_ports text NOT NULL,
      likely_type text NOT NULL,
      confidence integer DEFAULT 0 NOT NULL,
      source text NOT NULL,
      status text DEFAULT 'new' NOT NULL,
      discovered_at integer NOT NULL
    );
  `);
}

export function createDb() {
  const sqlite = openSqlite();
  return drizzle(sqlite, { schema });
}

export function verifyDbConnection() {
  const sqlite = openSqlite();
  sqlite.prepare("select 1").get();
  sqlite.close();
}

export type DbClient = ReturnType<typeof createDb>;
