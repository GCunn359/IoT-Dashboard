import mqtt from "mqtt";

import { getAppConfig } from "./config";
import type { SettingsMap } from "./settings";

export function getMqttBrokerUrl() {
  const config = getAppConfig();
  const protocol = config.mqttUseTls ? "mqtts" : "mqtt";

  return `${protocol}://${config.mqttHost}:${config.mqttPort}`;
}

export function createMqttClient() {
  const config = getAppConfig();

  return mqtt.connect(getMqttBrokerUrl(), {
    password: config.mqttPassword || undefined,
    username: config.mqttUsername || undefined,
  });
}

export function getMqttBrokerUrlFromSettings(settings: SettingsMap) {
  const protocol = settings.mqttUseTls === "true" ? "mqtts" : "mqtt";
  const host = settings.mqttHost || "localhost";
  const port = settings.mqttPort || "1883";

  return `${protocol}://${host}:${port}`;
}

export async function sampleMqttTopic(settings: SettingsMap) {
  const topic = settings.mqttSampleTopic || `${settings.mqttTopicPrefix || "home"}/#`;

  return new Promise<{ message: string; ok: boolean }>((resolve) => {
    const client = mqtt.connect(getMqttBrokerUrlFromSettings(settings), {
      connectTimeout: 3500,
      password: settings.mqttPassword || undefined,
      reconnectPeriod: 0,
      username: settings.mqttUsername || undefined,
    });
    const timeout = setTimeout(() => {
      client.end(true);
      resolve({
        message: `No MQTT message received on ${topic} within 5 seconds.`,
        ok: false,
      });
    }, 5000);

    client.once("connect", () => {
      client.subscribe(topic, (error) => {
        if (error) {
          clearTimeout(timeout);
          client.end(true);
          resolve({ message: error.message, ok: false });
        }
      });
    });

    client.once("message", (receivedTopic, payload) => {
      clearTimeout(timeout);
      client.end(true);
      resolve({
        message: `${receivedTopic}: ${payload.toString("utf8").slice(0, 240)}`,
        ok: true,
      });
    });

    client.once("error", (error) => {
      clearTimeout(timeout);
      client.end(true);
      resolve({ message: error.message, ok: false });
    });
  });
}
