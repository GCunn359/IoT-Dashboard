import { NextResponse } from "next/server";

import { verifyDbConnection } from "@/db/client";
import { getAppConfig } from "@/lib/config";
import { getMqttBrokerUrl } from "@/lib/mqtt";

export function GET() {
  const config = getAppConfig();
  verifyDbConnection();

  return NextResponse.json({
    database: {
      configured: config.databaseUrl.startsWith("file:"),
      type: "sqlite",
    },
    mqtt: {
      brokerUrl: getMqttBrokerUrl(),
      configured: Boolean(config.mqttHost),
      usernameConfigured: Boolean(config.mqttUsername),
    },
    status: "ok",
  });
}
