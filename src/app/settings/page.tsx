import { revalidatePath } from "next/cache";
import net from "node:net";

import { AppShell } from "@/components/AppShell";
import { sampleMqttTopic } from "@/lib/mqtt";
import {
  getSettings,
  setSettingValue,
  settingDefinitions,
  settingSections,
  updateSettings,
  type SettingDefinition,
  type SettingsMap,
} from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SettingsPage() {
  const settings = await getSettings();
  const statusCards = getStatusCards(settings);

  async function saveSettings(formData: FormData) {
    "use server";

    const currentSettings = await getSettings();
    const nextSettings: SettingsMap = {};
    const savedSection = String(formData.get("__section") ?? "settings");

    for (const definition of settingDefinitions) {
      const values = formData.getAll(definition.key);
      const value = values.at(-1);

      if (definition.type === "password" && value === "") {
        nextSettings[definition.key] = currentSettings[definition.key] ?? "";
        continue;
      }

      if (typeof value === "string") {
        nextSettings[definition.key] = value.trim();
      }
    }

    await updateSettings(nextSettings);
    await setSettingValue({
      key: "diagnosticSettingsSave",
      label: "Settings save",
      section: "diagnostics",
      value: `${new Date().toLocaleString("en-IE")}: Saved ${savedSection} section${
        savedSection === "discovery" && nextSettings.discoveryMode
          ? ` - discovery mode is ${nextSettings.discoveryMode}`
          : ""
      }.`,
    });
    revalidatePath("/", "layout");
    revalidatePath("/settings");
    revalidatePath("/devices");
  }

  async function checkMqttConnection() {
    "use server";

    const currentSettings = await getSettings();
    const host = currentSettings.mqttHost;
    const port = Number.parseInt(currentSettings.mqttPort ?? "1883", 10);
    const checkedAt = new Date().toLocaleString("en-IE");
    const result =
      host && Number.isFinite(port)
        ? await probeTcpPort(host, port)
        : { ok: false, message: "MQTT host or port is missing." };

    await setSettingValue({
      key: "diagnosticMqtt",
      label: "MQTT diagnostic",
      section: "diagnostics",
      value: `${checkedAt}: ${result.ok ? "OK" : "Failed"} - ${result.message}`,
    });
    revalidatePath("/settings");
  }

  async function checkGatewayReachability() {
    "use server";

    const currentSettings = await getSettings();
    const gateway = currentSettings.iotGatewayIp;
    const checkedAt = new Date().toLocaleString("en-IE");
    const ports = [80, 443, 53];
    const results = await Promise.all(
      ports.map(async (port) => ({
        port,
        result: await probeTcpPort(gateway, port),
      })),
    );
    const openPort = results.find(({ result }) => result.ok);
    const message = openPort
      ? `Gateway responded on TCP ${openPort.port}.`
      : "No response on TCP 80, 443, or 53. Gateway may still be reachable but not listening on those ports.";

    await setSettingValue({
      key: "diagnosticGateway",
      label: "Gateway diagnostic",
      section: "diagnostics",
      value: `${checkedAt}: ${openPort ? "OK" : "Warning"} - ${message}`,
    });
    revalidatePath("/settings");
  }

  async function sampleMqttMessages() {
    "use server";

    const currentSettings = await getSettings();
    const checkedAt = new Date().toLocaleString("en-IE");
    const result = await sampleMqttTopic(currentSettings);

    await setSettingValue({
      key: "diagnosticMqttSample",
      label: "MQTT sample",
      section: "diagnostics",
      value: `${checkedAt}: ${result.ok ? "Message" : "No sample"} - ${result.message}`,
    });
    revalidatePath("/settings");
  }

  return (
    <AppShell
      description="Admin configuration for networking, discovery, integrations, control safety, and local data."
      title="Settings"
    >
      <section className="settings-status-grid" aria-label="Settings overview">
        {statusCards.map((card) => (
          <article className="settings-status-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="settings-admin-layout">
        <article className="panel network-approach-panel">
          <div>
            <p className="muted">Recommended network model</p>
            <h2>TrueNAS app reaches IoT devices through controlled routing</h2>
            <p>
              Keep TrueNAS as the application host, not the router. Allow the
              dashboard or its container IP to initiate selected traffic to the
              IoT Wi-Fi subnet, keep IoT-to-LAN access blocked except
              established replies, and use DHCP reservations for stable device
              addresses.
            </p>
          </div>
          <div className="network-rule-grid">
            <span>LAN users → Dashboard UI</span>
            <span>Dashboard → IoT subnet</span>
            <span>IoT → LAN blocked</span>
            <span>MQTT broker optional</span>
          </div>
        </article>

        <article className="settings-section diagnostics">
          <div className="settings-section-heading">
            <div>
              <p>diagnostics</p>
              <h2>Connectivity checks</h2>
              <span>
                Run safe one-off checks from the dashboard host to confirm the
                configured MQTT broker and IoT gateway path.
              </span>
            </div>
          </div>
          <div className="diagnostic-grid">
            <form action={checkMqttConnection} className="diagnostic-card">
              <span>MQTT broker</span>
              <strong>{settings.diagnosticMqtt ?? "Not checked yet"}</strong>
              <button className="primary-button compact" type="submit">
                Test MQTT
              </button>
            </form>
            <form action={sampleMqttMessages} className="diagnostic-card">
              <span>MQTT topic sampler</span>
              <strong>{settings.diagnosticMqttSample ?? "No sample captured yet"}</strong>
              <button className="primary-button compact" type="submit">
                Sample topic
              </button>
            </form>
            <form action={checkGatewayReachability} className="diagnostic-card">
              <span>IoT gateway</span>
              <strong>{settings.diagnosticGateway ?? "Not checked yet"}</strong>
              <button className="primary-button compact" type="submit">
                Check gateway
              </button>
            </form>
            <div className="diagnostic-card">
              <span>Last settings save</span>
              <strong>{settings.diagnosticSettingsSave ?? "No save yet"}</strong>
            </div>
          </div>
        </article>

        {settingSections.map((section) => (
          <SettingsSection
            action={saveSettings}
            key={section.id}
            section={section}
            settings={settings}
          />
        ))}
      </section>
    </AppShell>
  );
}

function SettingsSection({
  action,
  section,
  settings,
}: {
  action: (formData: FormData) => Promise<void>;
  section: (typeof settingSections)[number];
  settings: SettingsMap;
}) {
  const fields = settingDefinitions.filter(
    (definition) => definition.section === section.id,
  );

  return (
    <form action={action} className={`settings-section ${section.id}`}>
      <input name="__section" type="hidden" value={section.id} />
      <div className="settings-section-heading">
        <div>
          <p>{section.id}</p>
          <h2>{section.title}</h2>
          <span>{section.description}</span>
        </div>
        <button className="primary-button compact" type="submit">
          Save section
        </button>
      </div>
      <div className="settings-field-grid">
        {fields.map((definition) => (
          <SettingField
            definition={definition}
            key={definition.key}
            value={settings[definition.key] ?? ""}
          />
        ))}
      </div>
    </form>
  );
}

function SettingField({
  definition,
  value,
}: {
  definition: SettingDefinition;
  value: string;
}) {
  return (
    <label className={`settings-field ${definition.type}`}>
      <span>{definition.label}</span>
      {renderFieldControl(definition, value)}
      <small>{definition.description}</small>
    </label>
  );
}

function renderFieldControl(definition: SettingDefinition, value: string) {
  if (definition.type === "select") {
    return (
      <select defaultValue={value} name={definition.key}>
        {definition.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (definition.type === "boolean") {
    return (
      <span className="settings-toggle">
        <input name={definition.key} type="hidden" value="false" />
        <input
          defaultChecked={value === "true"}
          name={definition.key}
          type="checkbox"
          value="true"
        />
        <i aria-hidden="true" />
        <strong>{value === "true" ? "Enabled" : "Disabled"}</strong>
      </span>
    );
  }

  return (
    <input
      defaultValue={definition.type === "password" ? "" : value}
      min={definition.type === "number" ? 0 : undefined}
      name={definition.key}
      placeholder={
        definition.type === "password" && value
          ? "Password configured"
          : definition.label
      }
      type={definition.type === "password" ? "password" : definition.type}
    />
  );
}

function getStatusCards(settings: SettingsMap) {
  return [
    {
      detail: `${settings.iotGatewayIp} gateway · ${settings.iotAccessMode}`,
      label: "IoT network",
      value: settings.iotSubnetCidr,
    },
    {
      detail: settings.mqttUseTls === "true" ? "TLS enabled" : "Plain TCP",
      label: "MQTT",
      value: `${settings.mqttHost}:${settings.mqttPort}`,
    },
    {
      detail: `${settings.discoveryEnabled === "true" ? "Enabled" : "Disabled"} · ${settings.scanStartIp} → ${settings.scanEndIp}`,
      label: "Discovery range",
      value: settings.discoveryMode === "live" ? "Live scan" : "Mock scan",
    },
    {
      detail: settings.securityControlsEnabled === "true"
        ? "Security actions allowed"
        : "Security actions blocked",
      label: "Control safety",
      value:
        settings.requireCriticalConfirmation === "true"
          ? "Confirm critical"
          : "Fast controls",
    },
  ];
}

async function probeTcpPort(host: string, port: number) {
  return new Promise<{ message: string; ok: boolean }>((resolve) => {
    const socket = net.createConnection({ host, port });
    const timeout = windowlessTimeout(() => {
      socket.destroy();
      resolve({ message: `No TCP response from ${host}:${port}.`, ok: false });
    }, 2500);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolve({ message: `Connected to ${host}:${port}.`, ok: true });
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      resolve({ message: error.message, ok: false });
    });
  });
}

function windowlessTimeout(callback: () => void, milliseconds: number) {
  return setTimeout(callback, milliseconds);
}
