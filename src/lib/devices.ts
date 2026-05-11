import { eq, sql } from "drizzle-orm";

import { createDb } from "@/db/client";
import {
  devices as deviceTable,
  latestStates,
  rooms as roomTable,
} from "@/db/schema";
import { devices as demoDevices } from "@/lib/demo-data";
import type {
  Device,
  DeviceCategory,
  DeviceStatus,
  RiskLevel,
  SummaryCard,
} from "@/lib/types";

const deviceCategories: DeviceCategory[] = [
  "automation",
  "display",
  "environment",
  "heating",
  "lighting",
  "radiator",
  "security",
  "socket",
  "solar",
  "utility",
  "water",
];
const deviceStatuses: DeviceStatus[] = ["offline", "online", "unknown", "warning"];
const riskLevels: RiskLevel[] = ["high", "low", "medium", "security"];

type DeviceStatePayload = {
  lastSeen?: string;
  metrics?: Device["metrics"];
  mqttCommandTopic?: string;
  mqttStateTopic?: string;
  notes?: string;
};

type NewDeviceInput = {
  canControl: boolean;
  category: DeviceCategory;
  integration: string;
  name: string;
  riskLevel: RiskLevel;
  room: string;
  status: DeviceStatus;
};

type DeviceDetail = Device & {
  externalId: string;
  mqttCommandTopic: string;
  mqttStateTopic: string;
  notes: string;
};

type EditableDeviceInput = NewDeviceInput & {
  externalId: string;
  mqttCommandTopic: string;
  mqttStateTopic: string;
  notes: string;
};

async function ensureDeviceTables() {
  const db = createDb();

  db.run(sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🏠' NOT NULL,
      sort_order INTEGER DEFAULT 0 NOT NULL
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY NOT NULL,
      room_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      integration TEXT NOT NULL,
      external_id TEXT,
      status TEXT DEFAULT 'unknown' NOT NULL,
      risk_level TEXT DEFAULT 'low' NOT NULL,
      can_control INTEGER DEFAULT false NOT NULL,
      last_seen_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS latest_states (
      device_id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeCategory(value: string): DeviceCategory {
  return deviceCategories.includes(value as DeviceCategory)
    ? (value as DeviceCategory)
    : "environment";
}

function normalizeStatus(value: string): DeviceStatus {
  return deviceStatuses.includes(value as DeviceStatus)
    ? (value as DeviceStatus)
    : "unknown";
}

function normalizeRiskLevel(value: string): RiskLevel {
  return riskLevels.includes(value as RiskLevel) ? (value as RiskLevel) : "low";
}

async function seedDevicesIfEmpty() {
  await ensureDeviceTables();

  const db = createDb();
  const existingDevices = await db.select({ id: deviceTable.id }).from(deviceTable);

  if (existingDevices.length > 0) {
    return;
  }

  const now = new Date();
  const roomNames = Array.from(new Set(demoDevices.map((device) => device.room)));

  for (const [index, room] of roomNames.entries()) {
    await db
      .insert(roomTable)
      .values({
        icon: getRoomIcon(room),
        id: slugify(room),
        name: room,
        sortOrder: index,
      })
      .onConflictDoNothing();
  }

  for (const device of demoDevices) {
    await db
      .insert(deviceTable)
      .values({
        canControl: device.canControl,
        category: device.category,
        createdAt: now,
        id: device.id,
        integration: device.integration,
        name: device.name,
        riskLevel: device.riskLevel,
        roomId: slugify(device.room),
        status: device.status,
      })
      .onConflictDoNothing();
    await db
      .insert(latestStates)
      .values({
        deviceId: device.id,
        payload: {
          lastSeen: device.lastSeen,
          metrics: device.metrics,
        },
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}

function getRoomIcon(room: string) {
  const icons: Record<string, string> = {
    Hall: "🚪",
    "Hot water": "💧",
    Kitchen: "🍳",
    "Living room": "🛋️",
    Office: "💻",
    Utility: "⚡",
  };

  return icons[room] ?? "🏠";
}

function formatLastSeen(payload: DeviceStatePayload, lastSeenAt: Date | null) {
  if (payload.lastSeen) {
    return payload.lastSeen;
  }

  if (!lastSeenAt) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(lastSeenAt);
}

function parsePayload(payload: unknown): DeviceStatePayload {
  if (payload && typeof payload === "object") {
    const state = payload as DeviceStatePayload;

    return {
      lastSeen: typeof state.lastSeen === "string" ? state.lastSeen : undefined,
      metrics: Array.isArray(state.metrics) ? state.metrics : [],
      mqttCommandTopic:
        typeof state.mqttCommandTopic === "string"
          ? state.mqttCommandTopic
          : undefined,
      mqttStateTopic:
        typeof state.mqttStateTopic === "string"
          ? state.mqttStateTopic
          : undefined,
      notes: typeof state.notes === "string" ? state.notes : undefined,
    };
  }

  return { metrics: [] };
}

export async function getPersistedDevices(): Promise<Device[]> {
  await seedDevicesIfEmpty();

  const db = createDb();
  const rows = await db
    .select({
      canControl: deviceTable.canControl,
      category: deviceTable.category,
      id: deviceTable.id,
      integration: deviceTable.integration,
      lastSeenAt: deviceTable.lastSeenAt,
      name: deviceTable.name,
      payload: latestStates.payload,
      riskLevel: deviceTable.riskLevel,
      roomName: roomTable.name,
      status: deviceTable.status,
    })
    .from(deviceTable)
    .leftJoin(roomTable, eq(deviceTable.roomId, roomTable.id))
    .leftJoin(latestStates, eq(deviceTable.id, latestStates.deviceId));

  return rows.map((row) => {
    const payload = parsePayload(row.payload);

    return {
      canControl: row.canControl,
      category: normalizeCategory(row.category),
      id: row.id,
      integration: row.integration,
      lastSeen: formatLastSeen(payload, row.lastSeenAt),
      metrics: payload.metrics ?? [],
      name: row.name,
      riskLevel: normalizeRiskLevel(row.riskLevel),
      room: row.roomName ?? "Unassigned",
      status: normalizeStatus(row.status),
    };
  });
}

export async function getPersistedDevice(id: string) {
  await seedDevicesIfEmpty();

  const db = createDb();
  const rows = await db
    .select({
      canControl: deviceTable.canControl,
      category: deviceTable.category,
      externalId: deviceTable.externalId,
      id: deviceTable.id,
      integration: deviceTable.integration,
      lastSeenAt: deviceTable.lastSeenAt,
      name: deviceTable.name,
      payload: latestStates.payload,
      riskLevel: deviceTable.riskLevel,
      roomName: roomTable.name,
      status: deviceTable.status,
    })
    .from(deviceTable)
    .leftJoin(roomTable, eq(deviceTable.roomId, roomTable.id))
    .leftJoin(latestStates, eq(deviceTable.id, latestStates.deviceId))
    .where(eq(deviceTable.id, id));
  const row = rows[0];

  if (!row) {
    return null;
  }

  const payload = parsePayload(row.payload);

  return {
    canControl: row.canControl,
    category: normalizeCategory(row.category),
    externalId: row.externalId ?? "",
    id: row.id,
    integration: row.integration,
    lastSeen: formatLastSeen(payload, row.lastSeenAt),
    metrics: payload.metrics ?? [],
    mqttCommandTopic: payload.mqttCommandTopic ?? "",
    mqttStateTopic: payload.mqttStateTopic ?? "",
    name: row.name,
    notes: payload.notes ?? "",
    riskLevel: normalizeRiskLevel(row.riskLevel),
    room: row.roomName ?? "Unassigned",
    status: normalizeStatus(row.status),
  } satisfies DeviceDetail;
}

export function getDeviceSummaryCards(devices: Device[]): SummaryCard[] {
  return [
    {
      detail: "SQLite-backed inventory across energy, climate, lighting, sockets, and security",
      icon: "📟",
      title: "Known devices",
      tone: "good",
      value: devices.length.toString(),
    },
    {
      detail: "Sockets, lighting, heating, TRVs, and immersion controls",
      icon: "◉",
      title: "Controllable",
      tone: "info",
      value: devices.filter((device) => device.canControl).length.toString(),
    },
    {
      detail: "Devices needing attention or active guard states",
      icon: "●",
      title: "Alerts",
      tone: "warning",
      value: devices.filter((device) => device.status !== "online").length.toString(),
    },
  ];
}

export async function addManualDevice(input: NewDeviceInput) {
  await ensureDeviceTables();

  const db = createDb();
  const now = new Date();
  const roomId = slugify(input.room) || "unassigned";
  const baseId = slugify(`${input.room}-${input.name}`) || `device-${Date.now()}`;
  let id = baseId;
  let suffix = 1;

  while ((await db.select().from(deviceTable).where(eq(deviceTable.id, id))).length > 0) {
    suffix += 1;
    id = `${baseId}-${suffix}`;
  }

  await db
    .insert(roomTable)
    .values({
      icon: getRoomIcon(input.room),
      id: roomId,
      name: input.room.trim() || "Unassigned",
      sortOrder: 99,
    })
    .onConflictDoNothing();

  await db.insert(deviceTable).values({
    canControl: input.canControl,
    category: input.category,
    createdAt: now,
    id,
    integration: input.integration,
    name: input.name,
    riskLevel: input.riskLevel,
    roomId,
    status: input.status,
  });

  await db.insert(latestStates).values({
    deviceId: id,
    payload: {
      lastSeen: "Manual entry",
      metrics: [{ label: "State", value: "Awaiting integration" }],
    },
    updatedAt: now,
  });
}

export function parseManualDeviceForm(formData: FormData): NewDeviceInput {
  const canControl = formData.get("canControl") === "true";
  const name = String(formData.get("name") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const integration = String(formData.get("integration") ?? "").trim();

  if (!name) {
    throw new Error("Device name is required.");
  }

  if (!room) {
    throw new Error("Room is required.");
  }

  if (!integration) {
    throw new Error("Integration is required.");
  }

  return {
    canControl,
    category: normalizeCategory(String(formData.get("category") ?? "")),
    integration,
    name,
    riskLevel: normalizeRiskLevel(String(formData.get("riskLevel") ?? "")),
    room,
    status: normalizeStatus(String(formData.get("status") ?? "")),
  };
}

export async function updateDevice(id: string, input: EditableDeviceInput) {
  await ensureDeviceTables();

  const db = createDb();
  const roomId = slugify(input.room) || "unassigned";
  const existing = await getPersistedDevice(id);

  if (!existing) {
    throw new Error("Device not found.");
  }

  await db
    .insert(roomTable)
    .values({
      icon: getRoomIcon(input.room),
      id: roomId,
      name: input.room.trim() || "Unassigned",
      sortOrder: 99,
    })
    .onConflictDoNothing();
  await db
    .update(deviceTable)
    .set({
      canControl: input.canControl,
      category: input.category,
      externalId: input.externalId,
      integration: input.integration,
      name: input.name,
      riskLevel: input.riskLevel,
      roomId,
      status: input.status,
    })
    .where(eq(deviceTable.id, id));
  await db
    .update(latestStates)
    .set({
      payload: {
        lastSeen: existing.lastSeen,
        metrics: existing.metrics,
        mqttCommandTopic: input.mqttCommandTopic,
        mqttStateTopic: input.mqttStateTopic,
        notes: input.notes,
      },
      updatedAt: new Date(),
    })
    .where(eq(latestStates.deviceId, id));
}

export function parseEditableDeviceForm(formData: FormData): EditableDeviceInput {
  const base = parseManualDeviceForm(formData);

  return {
    ...base,
    externalId: String(formData.get("externalId") ?? "").trim(),
    mqttCommandTopic: String(formData.get("mqttCommandTopic") ?? "").trim(),
    mqttStateTopic: String(formData.get("mqttStateTopic") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export { deviceCategories, deviceStatuses, riskLevels };
