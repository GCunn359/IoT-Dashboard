import { createDb } from "@/db/client";
import {
  devices as deviceTable,
  latestStates,
  rooms as roomTable,
} from "@/db/schema";
import type { DeviceCategory, DeviceStatus, RiskLevel } from "@/lib/types";
import type { SettingsMap } from "./settings";

type HomeAssistantState = {
  attributes?: Record<string, unknown>;
  entity_id: string;
  last_updated?: string;
  state: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getHomeAssistantConfig(settings: SettingsMap) {
  const baseUrl = settings.homeAssistantUrl?.trim().replace(/\/+$/, "");
  const token = settings.homeAssistantToken?.trim();

  if (!baseUrl) {
    throw new Error("Home Assistant URL is not configured.");
  }

  if (!token) {
    throw new Error("Home Assistant token is not configured.");
  }

  return { baseUrl, token };
}

async function requestHomeAssistant<T>(settings: SettingsMap, path: string) {
  const { baseUrl, token } = getHomeAssistantConfig(settings);
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Home Assistant returned HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function testHomeAssistantConnection(settings: SettingsMap) {
  const result = await requestHomeAssistant<{ message?: string }>(settings, "/api/");
  return result.message ?? "Connected to Home Assistant API.";
}

function getFriendlyName(entity: HomeAssistantState) {
  const friendlyName = entity.attributes?.friendly_name;

  return typeof friendlyName === "string" && friendlyName.trim()
    ? friendlyName.trim()
    : entity.entity_id.replaceAll(".", " ").replaceAll("_", " ");
}

function getEntityDomain(entityId: string) {
  return entityId.split(".")[0] ?? "sensor";
}

function mapCategory(entity: HomeAssistantState): DeviceCategory {
  const domain = getEntityDomain(entity.entity_id);
  const deviceClass = String(entity.attributes?.device_class ?? "").toLowerCase();
  const text = `${entity.entity_id} ${getFriendlyName(entity)} ${deviceClass}`.toLowerCase();

  if (domain === "climate" || text.includes("thermostat")) return "heating";
  if (domain === "light") return "lighting";
  if (domain === "switch") return "socket";
  if (domain === "binary_sensor" && ["motion", "door", "window", "opening", "lock"].includes(deviceClass)) return "security";
  if (text.includes("solar") || text.includes("inverter") || text.includes("battery")) return "solar";
  if (text.includes("water") || text.includes("humidity")) return "water";

  return "environment";
}

function mapStatus(entity: HomeAssistantState): DeviceStatus {
  if (entity.state === "unavailable" || entity.state === "unknown") return "unknown";
  if (entity.state === "problem") return "warning";
  return "online";
}

function mapRiskLevel(category: DeviceCategory): RiskLevel {
  if (category === "security") return "security";
  if (category === "socket" || category === "heating" || category === "water") return "medium";
  return "low";
}

function getRoomName(entity: HomeAssistantState) {
  const area = entity.attributes?.area_id ?? entity.attributes?.room;

  return typeof area === "string" && area.trim() ? area.trim() : "Home Assistant";
}

function formatMetricValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Unknown";
  if (typeof value === "number") return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return String(value);
}

function getEntityMetrics(entity: HomeAssistantState) {
  const unit = typeof entity.attributes?.unit_of_measurement === "string" ? entity.attributes.unit_of_measurement : "";
  const metrics = [{ label: "State", value: `${entity.state}${unit ? ` ${unit}` : ""}` }];
  const usefulAttributes = [
    "current_temperature",
    "temperature",
    "target_temp_high",
    "target_temp_low",
    "hvac_mode",
    "preset_mode",
    "battery_level",
    "humidity",
    "device_class",
  ];

  for (const key of usefulAttributes) {
    const value = entity.attributes?.[key];
    if (value !== undefined && value !== null && value !== "") {
      metrics.push({ label: key.replaceAll("_", " "), value: formatMetricValue(value) });
    }
  }

  return metrics.slice(0, 8);
}

function entityMatchesSettings(entity: HomeAssistantState, settings: SettingsMap) {
  const domains = (settings.homeAssistantDomains ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  const domain = getEntityDomain(entity.entity_id);
  const filter = (settings.homeAssistantEntityFilter ?? "").trim().toLowerCase();
  const text = `${entity.entity_id} ${getFriendlyName(entity)}`.toLowerCase();

  return (domains.length === 0 || domains.includes(domain)) && (!filter || text.includes(filter));
}

export async function fetchHomeAssistantEntities(settings: SettingsMap) {
  const entities = await requestHomeAssistant<HomeAssistantState[]>(settings, "/api/states");

  return entities.filter((entity) => entityMatchesSettings(entity, settings));
}

export async function importHomeAssistantEntities(settings: SettingsMap) {
  const entities = await fetchHomeAssistantEntities(settings);
  const db = createDb();
  const now = new Date();
  let imported = 0;

  for (const entity of entities) {
    const roomName = getRoomName(entity);
    const roomId = slugify(roomName) || "home-assistant";
    const deviceId = `ha-${slugify(entity.entity_id)}`;
    const category = mapCategory(entity);
    const canControl = ["climate", "light", "switch"].includes(getEntityDomain(entity.entity_id));
    const payload = {
      lastSeen: entity.last_updated
        ? `Home Assistant updated ${new Date(entity.last_updated).toLocaleString("en-IE")}`
        : "Home Assistant import",
      metrics: getEntityMetrics(entity),
      notes: `Imported from Home Assistant entity ${entity.entity_id}`,
    };

    await db
      .insert(roomTable)
      .values({ icon: "🏠", id: roomId, name: roomName, sortOrder: 90 })
      .onConflictDoNothing();

    await db
      .insert(deviceTable)
      .values({
        canControl,
        category,
        createdAt: now,
        externalId: entity.entity_id,
        id: deviceId,
        integration: "Home Assistant",
        lastSeenAt: entity.last_updated ? new Date(entity.last_updated) : now,
        name: getFriendlyName(entity),
        riskLevel: mapRiskLevel(category),
        roomId,
        status: mapStatus(entity),
      })
      .onConflictDoUpdate({
        set: {
          canControl,
          category,
          externalId: entity.entity_id,
          integration: "Home Assistant",
          lastSeenAt: entity.last_updated ? new Date(entity.last_updated) : now,
          name: getFriendlyName(entity),
          riskLevel: mapRiskLevel(category),
          roomId,
          status: mapStatus(entity),
        },
        target: deviceTable.id,
      });

    await db
      .insert(latestStates)
      .values({ deviceId, payload, updatedAt: now })
      .onConflictDoUpdate({
        set: { payload, updatedAt: now },
        target: latestStates.deviceId,
      });

    imported += 1;
  }

  return {
    imported,
    matched: entities.length,
    message: `Imported ${imported} of ${entities.length} matching Home Assistant entities.`,
  };
}
