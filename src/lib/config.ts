import { z } from "zod";

const configSchema = z.object({
  databaseUrl: z.string().default("file:./data/iot-dashboard.sqlite"),
  iotAccessMode: z
    .enum(["routed", "same-subnet", "mqtt-only"])
    .default("routed"),
  iotSubnetCidr: z.string().default("192.168.30.0/24"),
  iotSubnetNotes: z
    .string()
    .default("TrueNAS/app may initiate restricted connections to IoT devices."),
  mqttHost: z.string().default("localhost"),
  mqttPassword: z.string().default(""),
  mqttPort: z.coerce.number().int().positive().default(1883),
  mqttUsername: z.string().default(""),
  mqttUseTls: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  settingsPin: z.string().default(""),
});

export function getAppConfig() {
  return configSchema.parse({
    databaseUrl: process.env.DATABASE_URL,
    iotAccessMode: process.env.IOT_ACCESS_MODE,
    iotSubnetCidr: process.env.IOT_SUBNET_CIDR,
    iotSubnetNotes: process.env.IOT_SUBNET_NOTES,
    mqttHost: process.env.MQTT_HOST,
    mqttPassword: process.env.MQTT_PASSWORD,
    mqttPort: process.env.MQTT_PORT,
    mqttUsername: process.env.MQTT_USERNAME,
    mqttUseTls: process.env.MQTT_USE_TLS,
    settingsPin: process.env.SETTINGS_PIN,
  });
}
