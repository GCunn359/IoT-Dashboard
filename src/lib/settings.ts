import { eq, sql } from "drizzle-orm";

import { createDb } from "@/db/client";
import { appSettings } from "@/db/schema";
import { getAppConfig } from "@/lib/config";

export type SettingType = "boolean" | "number" | "password" | "select" | "text";

export type SettingDefinition = {
  description: string;
  key: string;
  label: string;
  options?: Array<{ label: string; value: string }>;
  section: SettingSectionId;
  type: SettingType;
};

export type SettingSectionId =
  | "network"
  | "mqtt"
  | "discovery"
  | "integrations"
  | "safety"
  | "data";

export const settingSections: Array<{
  description: string;
  id: SettingSectionId;
  title: string;
}> = [
  {
    description:
      "How the TrueNAS-hosted dashboard reaches the existing IoT Wi-Fi network without becoming the gateway.",
    id: "network",
    title: "Network & IoT access",
  },
  {
    description:
      "Primary telemetry bridge for devices that publish state through Mosquitto, Tasmota, ESPHome, or another collector.",
    id: "mqtt",
    title: "MQTT broker",
  },
  {
    description:
      "Admin-only onboarding scans used to identify existing Wi-Fi devices before assigning rooms and integrations.",
    id: "discovery",
    title: "Device discovery",
  },
  {
    description:
      "Connection status for vendor or bridge integrations. Credentials should be added only when the integration path is confirmed.",
    id: "integrations",
    title: "Integrations",
  },
  {
    description:
      "Control guardrails for sockets, immersion, heating, alarm/security devices, and other higher-risk actions.",
    id: "safety",
    title: "Control safety",
  },
  {
    description:
      "Database, backup, retention, and operational notes for running the app on TrueNAS Scale.",
    id: "data",
    title: "Data & system",
  },
];

export const settingDefinitions: SettingDefinition[] = [
  {
    description: "Recommended default: routed access with firewall rules from the app/TrueNAS host to the IoT subnet.",
    key: "iotAccessMode",
    label: "IoT access mode",
    options: [
      { label: "Restricted routed access", value: "routed" },
      { label: "App directly attached to IoT subnet", value: "same-subnet" },
      { label: "MQTT bridge only", value: "mqtt-only" },
    ],
    section: "network",
    type: "select",
  },
  {
    description: "Network range for the IoT Wi-Fi/VLAN.",
    key: "iotSubnetCidr",
    label: "IoT subnet CIDR",
    section: "network",
    type: "text",
  },
  {
    description: "Gateway/router IP for the IoT subnet.",
    key: "iotGatewayIp",
    label: "IoT gateway IP",
    section: "network",
    type: "text",
  },
  {
    description: "Static IP or reserved address for the TrueNAS host or app endpoint, when known.",
    key: "truenasHostIp",
    label: "TrueNAS/app IP",
    section: "network",
    type: "text",
  },
  {
    description: "Plain-language firewall intent shown to admins.",
    key: "firewallNotes",
    label: "Firewall stance",
    section: "network",
    type: "text",
  },
  {
    description: "Broker host reachable by the dashboard container.",
    key: "mqttHost",
    label: "MQTT host",
    section: "mqtt",
    type: "text",
  },
  {
    description: "Broker TCP port.",
    key: "mqttPort",
    label: "MQTT port",
    section: "mqtt",
    type: "number",
  },
  {
    description: "Enable when the broker requires TLS.",
    key: "mqttUseTls",
    label: "Use TLS",
    section: "mqtt",
    type: "boolean",
  },
  {
    description: "Optional broker username.",
    key: "mqttUsername",
    label: "MQTT username",
    section: "mqtt",
    type: "text",
  },
  {
    description: "Leave blank to keep the existing password.",
    key: "mqttPassword",
    label: "MQTT password",
    section: "mqtt",
    type: "password",
  },
  {
    description: "Default root topic for future auto-mapping.",
    key: "mqttTopicPrefix",
    label: "Topic prefix",
    section: "mqtt",
    type: "text",
  },
  {
    description: "Topic filter used by the Settings sampler, for example home/# or tele/+/STATE.",
    key: "mqttSampleTopic",
    label: "Sample topic filter",
    section: "mqtt",
    type: "text",
  },
  {
    description: "Enables the discovery controls. Scans should remain admin-only.",
    key: "discoveryEnabled",
    label: "Discovery enabled",
    section: "discovery",
    type: "boolean",
  },
  {
    description: "Use mock results on test servers. Switch to live only on the TrueNAS deployment that can reach the IoT subnet.",
    key: "discoveryMode",
    label: "Discovery mode",
    options: [
      { label: "Mock/test scan", value: "mock" },
      { label: "Live network scan", value: "live" },
    ],
    section: "discovery",
    type: "select",
  },
  {
    description: "Probe known IP ranges for hosts and common smart-home ports.",
    key: "ipScanEnabled",
    label: "IP scan",
    section: "discovery",
    type: "boolean",
  },
  {
    description: "Comma-separated TCP ports to probe during live discovery.",
    key: "scanPorts",
    label: "Live scan ports",
    section: "discovery",
    type: "text",
  },
  {
    description: "Timeout per TCP port probe in milliseconds. Increase this for routed VLAN scans.",
    key: "scanTimeoutMs",
    label: "Port timeout ms",
    section: "discovery",
    type: "number",
  },
  {
    description: "Maximum IP addresses to scan in one run. Keep this moderate until routing is confirmed.",
    key: "scanAddressLimit",
    label: "Address limit",
    section: "discovery",
    type: "number",
  },
  {
    description: "Also test host reachability with the system ping command so devices with closed TCP ports can still appear.",
    key: "scanPingEnabled",
    label: "Ping reachable hosts",
    section: "discovery",
    type: "boolean",
  },
  {
    description: "Use mDNS where routing/reflection supports it.",
    key: "mdnsEnabled",
    label: "mDNS discovery",
    section: "discovery",
    type: "boolean",
  },
  {
    description: "Use SSDP/UPnP where routing/reflection supports it.",
    key: "ssdpEnabled",
    label: "SSDP discovery",
    section: "discovery",
    type: "boolean",
  },
  {
    description: "First IP address to probe in the IoT subnet.",
    key: "scanStartIp",
    label: "Scan start IP",
    section: "discovery",
    type: "text",
  },
  {
    description: "Last IP address to probe in the IoT subnet.",
    key: "scanEndIp",
    label: "Scan end IP",
    section: "discovery",
    type: "text",
  },
  ...["tuya", "sonoff", "nest", "ajax", "esolar"].map((integration) => ({
    description: `${integration.toUpperCase()} connector state for future integration setup.`,
    key: `${integration}Status`,
    label: `${integration.toUpperCase()} status`,
    options: [
      { label: "Not configured", value: "not-configured" },
      { label: "Planned", value: "planned" },
      { label: "Ready to configure", value: "ready" },
      { label: "Connected", value: "connected" },
    ],
    section: "integrations" as const,
    type: "select" as const,
  })),
  {
    description: "Require confirmation before critical socket, immersion, heating, or alarm-adjacent controls.",
    key: "requireCriticalConfirmation",
    label: "Confirm critical controls",
    section: "safety",
    type: "boolean",
  },
  {
    description: "Keep alarm/security actions disabled until a safe integration and approval model exists.",
    key: "securityControlsEnabled",
    label: "Security controls enabled",
    section: "safety",
    type: "boolean",
  },
  {
    description: "Require a local admin PIN for high-risk actions in future control flows.",
    key: "requireAdminPin",
    label: "Require admin PIN",
    section: "safety",
    type: "boolean",
  },
  {
    description: "Persistent SQLite database location.",
    key: "databaseUrl",
    label: "Database URL",
    section: "data",
    type: "text",
  },
  {
    description: "Suggested TrueNAS dataset path or mounted folder for future exports.",
    key: "backupPath",
    label: "Backup path",
    section: "data",
    type: "text",
  },
  {
    description: "How long to keep high-frequency readings before pruning or rollups.",
    key: "retentionDays",
    label: "Reading retention days",
    section: "data",
    type: "number",
  },
];

export type SettingsMap = Record<string, string>;

function getDefaultSettings(): SettingsMap {
  const config = getAppConfig();

  return {
    ajaxStatus: "planned",
    backupPath: "/data/backups",
    databaseUrl: config.databaseUrl,
    discoveryEnabled: "true",
    discoveryMode: "mock",
    esolarStatus: "ready",
    firewallNotes: config.iotSubnetNotes,
    iotAccessMode: config.iotAccessMode,
    iotGatewayIp: "192.168.30.1",
    iotSubnetCidr: config.iotSubnetCidr,
    ipScanEnabled: "true",
    mdnsEnabled: "true",
    mqttHost: config.mqttHost,
    mqttPassword: config.mqttPassword,
    mqttPort: config.mqttPort.toString(),
    mqttSampleTopic: "home/#",
    mqttTopicPrefix: "home",
    mqttUsername: config.mqttUsername,
    mqttUseTls: config.mqttUseTls ? "true" : "false",
    nestStatus: "planned",
    requireAdminPin: "true",
    requireCriticalConfirmation: "true",
    retentionDays: "365",
    scanEndIp: "192.168.30.254",
    scanAddressLimit: "32",
    scanPingEnabled: "true",
    scanPorts: "80,443,1883,502,8081,6668",
    scanStartIp: "192.168.30.2",
    scanTimeoutMs: "1200",
    securityControlsEnabled: "false",
    sonoffStatus: "planned",
    ssdpEnabled: "true",
    truenasHostIp: "",
    tuyaStatus: "planned",
  };
}

async function ensureSettingsTable() {
  const db = createDb();
  db.run(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      section TEXT NOT NULL,
      value TEXT DEFAULT '' NOT NULL,
      type TEXT DEFAULT 'text' NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}

export async function getSettings() {
  await ensureSettingsTable();

  const db = createDb();
  const now = new Date();
  const defaults = getDefaultSettings();
  const existingRows = await db.select().from(appSettings);
  const existing = new Set(existingRows.map((row) => row.key));

  for (const definition of settingDefinitions) {
    if (!existing.has(definition.key)) {
      await db.insert(appSettings).values({
        key: definition.key,
        label: definition.label,
        section: definition.section,
        type: definition.type,
        updatedAt: now,
        value: defaults[definition.key] ?? "",
      });
    }
  }

  const rows = await db.select().from(appSettings);

  return rows.reduce<SettingsMap>(
    (settings, row) => ({
      ...settings,
      [row.key]: row.value,
    }),
    {},
  );
}

export async function updateSettings(values: SettingsMap) {
  await ensureSettingsTable();

  const db = createDb();
  const now = new Date();

  for (const definition of settingDefinitions) {
    const nextValue = values[definition.key];

    if (nextValue === undefined) {
      continue;
    }

    await db
      .update(appSettings)
      .set({
        label: definition.label,
        section: definition.section,
        type: definition.type,
        updatedAt: now,
        value: nextValue,
      })
      .where(eq(appSettings.key, definition.key));
  }
}

export async function setSettingValue({
  key,
  label,
  section,
  type = "text",
  value,
}: {
  key: string;
  label: string;
  section: string;
  type?: SettingType;
  value: string;
}) {
  await ensureSettingsTable();

  const db = createDb();
  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key));
  const nextValue = {
    key,
    label,
    section,
    type,
    updatedAt: new Date(),
    value,
  };

  if (existing.length > 0) {
    await db
      .update(appSettings)
      .set(nextValue)
      .where(eq(appSettings.key, key));
    return;
  }

  await db.insert(appSettings).values(nextValue);
}
