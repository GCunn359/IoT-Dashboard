import { eq, sql } from "drizzle-orm";
import net from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { createDb } from "@/db/client";
import {
  discoveredDevices,
  devices as deviceTable,
  latestStates,
  rooms as roomTable,
} from "@/db/schema";
import { getSettings, setSettingValue } from "@/lib/settings";
import type { DeviceCategory, RiskLevel } from "@/lib/types";

const execFileAsync = promisify(execFile);

type DiscoveredDevice = {
  confidence: number;
  discoveredAt: Date;
  hostname: string | null;
  id: string;
  ipAddress: string;
  likelyType: DeviceCategory;
  openPorts: number[];
  source: "live" | "mock";
  status: "added" | "ignored" | "new";
  vendor: string | null;
};

type LiveScanResult = {
  devices: DiscoveredDevice[];
  summary: {
    addressesScanned: number;
    pingErrors: string[];
    pingReachable: number;
    portReachable: number;
    ports: number[];
    timeoutMs: number;
  };
};

const mockDiscoveredDevices: Array<Omit<DiscoveredDevice, "discoveredAt" | "status">> = [
  {
    confidence: 88,
    hostname: "tuya-kitchen-light.local",
    id: "mock-192-168-30-21",
    ipAddress: "192.168.30.21",
    likelyType: "lighting",
    openPorts: [6668, 80],
    source: "mock",
    vendor: "Tuya",
  },
  {
    confidence: 84,
    hostname: "sonoff-washer.local",
    id: "mock-192-168-30-37",
    ipAddress: "192.168.30.37",
    likelyType: "socket",
    openPorts: [8081, 1883],
    source: "mock",
    vendor: "Sonoff",
  },
  {
    confidence: 76,
    hostname: "esolar-aio3.local",
    id: "mock-192-168-30-45",
    ipAddress: "192.168.30.45",
    likelyType: "solar",
    openPorts: [80, 502],
    source: "mock",
    vendor: "eSolar",
  },
  {
    confidence: 72,
    hostname: "ajax-hub.local",
    id: "mock-192-168-30-60",
    ipAddress: "192.168.30.60",
    likelyType: "security",
    openPorts: [443],
    source: "mock",
    vendor: "AJAX",
  },
];

async function ensureDiscoveryTable() {
  const db = createDb();
  db.run(sql`
    CREATE TABLE IF NOT EXISTS discovered_devices (
      id TEXT PRIMARY KEY NOT NULL,
      ip_address TEXT NOT NULL,
      hostname TEXT,
      vendor TEXT,
      open_ports TEXT NOT NULL,
      likely_type TEXT NOT NULL,
      confidence INTEGER DEFAULT 0 NOT NULL,
      source TEXT NOT NULL,
      status TEXT DEFAULT 'new' NOT NULL,
      discovered_at INTEGER NOT NULL
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

function inferIntegration(device: DiscoveredDevice) {
  return device.vendor ?? (device.source === "mock" ? "Mock discovery" : "Network discovery");
}

function inferRiskLevel(category: DeviceCategory): RiskLevel {
  if (category === "security") {
    return "security";
  }

  if (category === "socket" || category === "water" || category === "heating") {
    return "medium";
  }

  return "low";
}

function inferRoom(device: DiscoveredDevice) {
  const text = `${device.hostname ?? ""} ${device.vendor ?? ""}`.toLowerCase();

  if (text.includes("kitchen")) return "Kitchen";
  if (text.includes("washer") || text.includes("solar") || text.includes("esolar")) {
    return "Utility";
  }
  if (text.includes("ajax")) return "Hall";

  return "Unassigned";
}

function inferName(device: DiscoveredDevice) {
  if (device.hostname) {
    return device.hostname.replace(".local", "").replace(/-/g, " ");
  }

  return `${device.vendor ?? "IoT"} device ${device.ipAddress}`;
}

function parsePositiveInteger(value: string | undefined, fallback: number, maximum?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;

  return maximum ? Math.min(safeValue, maximum) : safeValue;
}

function parseScanPorts(value: string | undefined) {
  const ports = (value ?? "")
    .split(",")
    .map((port) => Number.parseInt(port.trim(), 10))
    .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535);

  return ports.length > 0 ? Array.from(new Set(ports)) : [80, 443, 1883, 502, 8081, 6668];
}

async function probeTcpPort(host: string, port: number, timeoutMs: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolve(true);
    });

    socket.once("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function pingHost(host: string, timeoutMs: number) {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const args =
    process.platform === "win32"
      ? ["-n", "1", "-w", String(timeoutMs), host]
      : ["-c", "1", "-W", String(timeoutSeconds), host];

  try {
    await execFileAsync("ping", args, { timeout: timeoutMs + 750 });
    return { error: null, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ping error";
    return { error: message, ok: false };
  }
}

function getIpRange(startIp: string, endIp: string) {
  const start = Number.parseInt(startIp.split(".").at(-1) ?? "2", 10);
  const end = Number.parseInt(endIp.split(".").at(-1) ?? "254", 10);
  const prefix = startIp.split(".").slice(0, 3).join(".");
  const safeStart = Number.isFinite(start) ? Math.max(2, start) : 2;
  const safeEnd = Number.isFinite(end) ? Math.min(254, end) : 254;

  return Array.from({ length: safeEnd - safeStart + 1 }, (_, index) => {
    return `${prefix}.${safeStart + index}`;
  });
}

async function runLiveScan(): Promise<LiveScanResult> {
  const settings = await getSettings();
  const ports = parseScanPorts(settings.scanPorts);
  const timeoutMs = parsePositiveInteger(settings.scanTimeoutMs, 1200, 10000);
  const addressLimit = parsePositiveInteger(settings.scanAddressLimit, 32, 254);
  const pingEnabled = settings.scanPingEnabled === "true";
  const addresses = getIpRange(settings.scanStartIp, settings.scanEndIp).slice(0, addressLimit);
  const found: DiscoveredDevice[] = [];
  const pingErrors = new Set<string>();
  let pingReachable = 0;
  let portReachable = 0;

  async function scanAddress(ipAddress: string): Promise<DiscoveredDevice | null> {
    const openPorts = (
      await Promise.all(
        ports.map(async (port) => ({
          open: await probeTcpPort(ipAddress, port, timeoutMs),
          port,
        })),
      )
    )
      .filter((result) => result.open)
      .map((result) => result.port);
    const pingResult = openPorts.length === 0 && pingEnabled
      ? await pingHost(ipAddress, timeoutMs)
      : { error: null, ok: false };

    if (pingResult.error) {
      pingErrors.add(pingResult.error);
    }

    const reachable = openPorts.length > 0 || pingResult.ok;

    if (reachable) {
      if (openPorts.length > 0) {
        portReachable += 1;
      } else {
        pingReachable += 1;
      }

      return {
        confidence: openPorts.length > 0 ? Math.min(95, 45 + openPorts.length * 12) : 40,
        discoveredAt: new Date(),
        hostname: null,
        id: `live-${ipAddress.replaceAll(".", "-")}`,
        ipAddress,
        likelyType: openPorts.includes(1883) ? "utility" : "environment",
        openPorts,
        source: "live",
        status: "new",
        vendor: null,
      };
    }

    return null;
  }

  const batchSize = 8;
  for (let index = 0; index < addresses.length; index += batchSize) {
    const batch = addresses.slice(index, index + batchSize);
    const results = await Promise.all(batch.map(scanAddress));
    found.push(...results.filter((device): device is DiscoveredDevice => Boolean(device)));
  }

  return {
    devices: found,
    summary: {
      addressesScanned: addresses.length,
      pingErrors: Array.from(pingErrors).slice(0, 3),
      pingReachable,
      portReachable,
      ports,
      timeoutMs,
    },
  };
}

async function persistDiscoveryResults(results: DiscoveredDevice[]) {
  await ensureDiscoveryTable();

  const db = createDb();

  for (const device of results) {
    const existing = await db
      .select()
      .from(discoveredDevices)
      .where(eq(discoveredDevices.id, device.id));
    const values = {
      confidence: device.confidence,
      discoveredAt: device.discoveredAt,
      hostname: device.hostname,
      id: device.id,
      ipAddress: device.ipAddress,
      likelyType: device.likelyType,
      openPorts: device.openPorts,
      source: device.source,
      status: existing[0]?.status ?? "new",
      vendor: device.vendor,
    };

    if (existing.length > 0) {
      await db
        .update(discoveredDevices)
        .set(values)
        .where(eq(discoveredDevices.id, device.id));
    } else {
      await db.insert(discoveredDevices).values(values);
    }
  }
}

export async function runDiscoveryScan() {
  const settings = await getSettings();
  const mode = settings.discoveryMode === "live" ? "live" : "mock";
  const now = new Date();
  const liveScan = mode === "live" ? await runLiveScan() : null;
  const results =
    liveScan?.devices ??
    mockDiscoveredDevices.map((device) => ({
           ...device,
           discoveredAt: now,
           status: "new" as const,
        }));
  const liveSummary = liveScan
    ? ` Scanned ${liveScan.summary.addressesScanned} address${liveScan.summary.addressesScanned === 1 ? "" : "es"}; ${liveScan.summary.portReachable} with open TCP ports; ${liveScan.summary.pingReachable} ping-only reachable. ${
        liveScan.summary.pingErrors.length > 0
          ? `Ping probe errors: ${liveScan.summary.pingErrors.join(" | ")}.`
          : ""
      }`
    : "";

  await persistDiscoveryResults(results);
  await setSettingValue({
    key: "diagnosticDiscoveryScan",
    label: "Discovery scan",
    section: "diagnostics",
    value: `${new Date().toLocaleString("en-IE")}: ${mode === "live" ? "Live" : "Mock"} scan completed. ${results.length} device${results.length === 1 ? "" : "s"} found across ${mode === "live" ? `${settings.scanStartIp}-${settings.scanEndIp} using ports ${settings.scanPorts}, ${settings.scanTimeoutMs}ms timeout, ping ${settings.scanPingEnabled === "true" ? "on" : "off"}. ${liveSummary}` : "mock fixtures"}.`,
  });

  return {
    mode,
    resultCount: results.length,
  };
}

export async function getDiscoveredDevices() {
  await ensureDiscoveryTable();

  const db = createDb();
  const rows = await db.select().from(discoveredDevices);

  return rows.map((row) => ({
    confidence: row.confidence,
    discoveredAt: row.discoveredAt,
    hostname: row.hostname,
    id: row.id,
    ipAddress: row.ipAddress,
    likelyType: row.likelyType as DeviceCategory,
    openPorts: Array.isArray(row.openPorts) ? (row.openPorts as number[]) : [],
    source: row.source as "live" | "mock",
    status: row.status as "added" | "ignored" | "new",
    vendor: row.vendor,
  }));
}

export async function approveDiscoveredDevice(id: string) {
  await ensureDiscoveryTable();

  const db = createDb();
  const matches = await db
    .select()
    .from(discoveredDevices)
    .where(eq(discoveredDevices.id, id));
  const discovered = matches[0];

  if (!discovered) {
    throw new Error("Discovered device not found.");
  }

  const device = {
    confidence: discovered.confidence,
    discoveredAt: discovered.discoveredAt,
    hostname: discovered.hostname,
    id: discovered.id,
    ipAddress: discovered.ipAddress,
    likelyType: discovered.likelyType as DeviceCategory,
    openPorts: Array.isArray(discovered.openPorts)
      ? (discovered.openPorts as number[])
      : [],
    source: discovered.source as "live" | "mock",
    status: discovered.status as "new",
    vendor: discovered.vendor,
  };
  const roomName = inferRoom(device);
  const roomId = slugify(roomName) || "unassigned";
  const deviceId = slugify(`${roomName}-${inferName(device)}`) || id;
  const now = new Date();

  await db
    .insert(roomTable)
    .values({
      icon: getRoomIcon(roomName),
      id: roomId,
      name: roomName,
      sortOrder: 99,
    })
    .onConflictDoNothing();
  await db
    .insert(deviceTable)
    .values({
      canControl: false,
      category: device.likelyType,
      createdAt: now,
      externalId: device.ipAddress,
      id: deviceId,
      integration: inferIntegration(device),
      name: inferName(device),
      riskLevel: inferRiskLevel(device.likelyType),
      roomId,
      status: "unknown",
    })
    .onConflictDoNothing();
  await db
    .insert(latestStates)
    .values({
      deviceId,
      payload: {
        lastSeen: `Discovered at ${device.ipAddress}`,
        metrics: [
          { label: "IP", value: device.ipAddress },
          { label: "Ports", value: device.openPorts.join(", ") || "Unknown" },
        ],
      },
      updatedAt: now,
    })
    .onConflictDoNothing();
  await db
    .update(discoveredDevices)
    .set({ status: "added" })
    .where(eq(discoveredDevices.id, id));
}
