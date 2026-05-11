export type DeviceCategory =
  | "environment"
  | "utility"
  | "solar"
  | "lighting"
  | "heating"
  | "water"
  | "radiator"
  | "socket"
  | "security"
  | "automation"
  | "display";

export type DeviceStatus = "online" | "offline" | "warning" | "unknown";

export type RiskLevel = "low" | "medium" | "high" | "security";

export type SummaryCard = {
  title: string;
  value: string;
  detail: string;
  icon: string;
  tone: "good" | "info" | "warning" | "critical";
};

export type Device = {
  id: string;
  name: string;
  room: string;
  category: DeviceCategory;
  integration: string;
  status: DeviceStatus;
  lastSeen: string;
  canControl: boolean;
  riskLevel: RiskLevel;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

export type AutomationRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  recommendationOnly: boolean;
  lastRun: string;
};
