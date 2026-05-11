"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AutomationRule, Device, SummaryCard } from "@/lib/types";

export function SummaryGrid({ cards }: { cards: SummaryCard[] }) {
  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article className={`summary-card ${card.tone}`} key={card.title}>
          <div className="summary-icon" aria-hidden="true">
            {card.icon}
          </div>
          <div>
            <p>{card.title}</p>
            <strong>{card.value}</strong>
            <span>{card.detail}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export function DeviceGrid({ devices }: { devices: Device[] }) {
  return (
    <section className="device-grid">
      {devices.map((device) => (
        <DeviceCard device={device} key={device.id} />
      ))}
    </section>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const controlHref = getControlHref(device);

  return (
    <article className={`device-card ${device.category}`}>
      <div className="device-card-top">
        <div className={`device-visual ${device.category}`} aria-hidden="true">
          <span>{getDeviceIcon(device.category)}</span>
        </div>
        <div className="device-title-block">
          <p>{device.room}</p>
          <h2>{device.name}</h2>
          <span>{device.integration}</span>
        </div>
        <span className={`pill ${device.status}`}>{device.status}</span>
      </div>
      <div className="device-meta-row">
        <span>{formatCategory(device.category)}</span>
        <span>Risk: {device.riskLevel}</span>
        <span>{device.canControl ? "Control ready" : "Monitor only"}</span>
      </div>
      <div className="metric-list">
        {device.metrics.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="device-footer-row">
        <span>Last seen</span>
        <span>{device.lastSeen}</span>
      </div>
      <div className="device-action-row">
        {controlHref ? (
          <Link className="control-button" href={controlHref}>
            Open smart controls
          </Link>
        ) : (
          <span className="monitor-only-note">Monitor-only device</span>
        )}
        <Link className="secondary-button" href={`/devices/${device.id}`}>
          Details
        </Link>
      </div>
    </article>
  );
}

function getControlHref(device: Device) {
  if (!device.canControl) {
    return null;
  }

  const hrefs: Partial<Record<Device["category"], string>> = {
    heating: "/heating",
    lighting: "/lighting",
    radiator: "/heating",
    security: "/security",
    socket: "/sockets",
    water: "/heating",
  };

  return hrefs[device.category] ?? `/devices/${device.id}`;
}

function formatCategory(category: Device["category"]) {
  return category.replace("-", " ");
}

export function HomeDeviceStrip({ devices }: { devices: Device[] }) {
  const groups = getDeviceGroups(devices);
  const initialControls = useMemo(
    () =>
      Object.fromEntries(
        devices.map((device) => [
          device.id,
          {
            isOn: getInitialPowerState(device),
            targetTemp: getInitialTargetTemp(device),
          },
        ]),
      ),
    [devices],
  );
  const [controls, setControls] = useState(initialControls);

  function setPowerState(deviceId: string, isOn: boolean) {
    setControls((current) => ({
      ...current,
      [deviceId]: {
        ...current[deviceId],
        isOn,
      },
    }));
  }

  function adjustTargetTemp(deviceId: string, adjustment: number) {
    setControls((current) => {
      const currentControl = current[deviceId];
      const nextTarget = Math.min(
        30,
        Math.max(5, (currentControl?.targetTemp ?? 19) + adjustment),
      );

      return {
        ...current,
        [deviceId]: {
          ...currentControl,
          targetTemp: nextTarget,
        },
      };
    });
  }

  return (
    <section className="home-device-strip">
      {groups.map((group) => (
        <div className="home-device-group" key={group.label}>
          <div className="home-device-group-header">
            <span aria-hidden="true">{group.icon}</span>
            <h3>{group.label}</h3>
          </div>
          <div className="home-device-row">
            {group.devices.map((device) => {
              const primaryMetric = device.metrics[0];
              const secondaryMetric = device.metrics[1];
              const control = controls[device.id];
              const isSwitchable =
                device.category === "lighting" ||
                device.category === "socket" ||
                device.category === "water";
              const isThermostat =
                device.category === "heating" || device.category === "radiator";
              const isSolar = device.category === "solar";
              const solarHouseLoad = isSolar
                ? device.metrics.find((metric) => metric.label === "House load")
                : undefined;

              return (
                <article
                  className={`home-device-tile ${device.category}`}
                  key={device.id}
                >
                  <div className="home-device-top">
                    <span className="home-device-icon" aria-hidden="true">
                      {getDeviceIcon(device.category)}
                    </span>
                    <div className="home-device-title">
                      <p>{device.room}</p>
                      <h2>{device.name}</h2>
                    </div>
                    <span className={`mini-status ${device.status}`} />
                  </div>
                  <div className="home-device-body">
                    <div className="home-device-metric">
                      <strong>{primaryMetric?.value ?? "Ready"}</strong>
                      <span>{primaryMetric?.label ?? device.integration}</span>
                      {solarHouseLoad ? (
                        <small className="home-solar-load">
                          Household usage {solarHouseLoad.value}
                        </small>
                      ) : null}
                    </div>
                    {isSolar ? (
                      <div className="home-solar-metrics">
                        {device.metrics
                          .slice(1)
                          .filter((metric) => metric.label !== "House load")
                          .map((metric) => (
                            <div key={metric.label}>
                              <span>{metric.label}</span>
                              <strong>{metric.value}</strong>
                            </div>
                          ))}
                      </div>
                    ) : isSwitchable ? (
                      <HomePowerSlider
                        isOn={control?.isOn ?? false}
                        label={
                          device.category === "socket"
                            ? "Socket power"
                            : device.category === "water"
                              ? "Immersion smart MCB"
                            : "Light power"
                        }
                        onToggle={(nextState) =>
                          setPowerState(device.id, nextState)
                        }
                      />
                    ) : isThermostat ? (
                      <HomeThermostatControl
                        current={primaryMetric?.value ?? "Room ready"}
                        onAdjust={(adjustment) =>
                          adjustTargetTemp(device.id, adjustment)
                        }
                        target={control?.targetTemp ?? getInitialTargetTemp(device)}
                      />
                    ) : secondaryMetric ? (
                      <small className="home-device-secondary">
                        {secondaryMetric.label}: {secondaryMetric.value}
                      </small>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function HomePowerSlider({
  isOn,
  label,
  onToggle,
}: {
  isOn: boolean;
  label: string;
  onToggle: (isOn: boolean) => void;
}) {
  return (
    <button
      aria-label={`${label}: ${isOn ? "on" : "off"}`}
      aria-pressed={isOn}
      className={`home-power-slider ${isOn ? "on" : "off"}`}
      onClick={() => onToggle(!isOn)}
      type="button"
    >
      <span>{isOn ? "ON" : "OFF"}</span>
      <i aria-hidden="true" />
    </button>
  );
}

function HomeThermostatControl({
  current,
  onAdjust,
  target,
}: {
  current: string;
  onAdjust: (adjustment: number) => void;
  target: number;
}) {
  return (
    <div className="home-thermostat-control" aria-label="Target temperature">
      <button
        aria-label="Decrease target temperature"
        onClick={() => onAdjust(-0.5)}
        type="button"
      >
        -
      </button>
      <div>
        <span>Target</span>
        <strong>{target.toFixed(1)}°C</strong>
        <small>Current {current.replace(" C", "°C")}</small>
      </div>
      <button
        aria-label="Increase target temperature"
        onClick={() => onAdjust(0.5)}
        type="button"
      >
        +
      </button>
    </div>
  );
}

export function RoomSceneGrid() {
  const scenes = [
    {
      detail: "Lights on · TRV 19.5 C · secure",
      icon: "🛋️",
      name: "Living room",
      tone: "warm",
    },
    {
      detail: "Solar charging · washer socket off",
      icon: "🧺",
      name: "Utility",
      tone: "green",
    },
    {
      detail: "Desk socket on · no alerts",
      icon: "💻",
      name: "Office",
      tone: "blue",
    },
  ];

  return (
    <section className="room-scene-grid">
      {scenes.map((scene) => (
        <article className={`room-scene-card ${scene.tone}`} key={scene.name}>
          <span aria-hidden="true">{scene.icon}</span>
          <div>
            <h2>{scene.name}</h2>
            <p>{scene.detail}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function getDeviceIcon(category: Device["category"]) {
  const icons: Record<Device["category"], string> = {
    automation: "✨",
    display: "🖥️",
    environment: "🌿",
    heating: "🔥",
    lighting: "💡",
    radiator: "🌡️",
    security: "🛡️",
    socket: "🔌",
    solar: "☀️",
    utility: "⚡",
    water: "💧",
  };

  return icons[category];
}

function getInitialPowerState(device: Device) {
  const stateMetric = device.metrics.find((metric) => metric.label === "State");

  return stateMetric?.value.toLowerCase() === "on";
}

function getInitialTargetTemp(device: Device) {
  const targetMetric = device.metrics.find((metric) => metric.label === "Target");
  const target = Number.parseFloat(targetMetric?.value ?? "");

  return Number.isFinite(target) ? target : 19;
}

function getDeviceGroups(devices: Device[]) {
  const groupDefinitions: Array<{
    categories: Device["category"][];
    icon: string;
    label: string;
  }> = [
    {
      categories: ["solar", "utility"],
      icon: "⚡",
      label: "Energy",
    },
    {
      categories: ["heating", "radiator", "water"],
      icon: "🌡️",
      label: "Climate",
    },
    {
      categories: ["lighting"],
      icon: "💡",
      label: "Lighting",
    },
    {
      categories: ["socket"],
      icon: "🔌",
      label: "Sockets",
    },
    {
      categories: ["security"],
      icon: "🛡️",
      label: "Security",
    },
  ];

  return groupDefinitions
    .map((group) => ({
      ...group,
      devices: devices.filter((device) => group.categories.includes(device.category)),
    }))
    .filter((group) => group.devices.length > 0);
}

export function AutomationList({ rules }: { rules: AutomationRule[] }) {
  return (
    <section className="stack">
      {rules.map((rule) => (
        <article className="panel" key={rule.id}>
          <div className="card-row">
            <div>
              <h2>{rule.name}</h2>
              <p>{rule.description}</p>
            </div>
            <span className={`pill ${rule.enabled ? "online" : "unknown"}`}>
              {rule.enabled ? "Enabled" : "Paused"}
            </span>
          </div>
          <div className="card-row footer-row">
            <span>
              Mode: {rule.recommendationOnly ? "Recommendation" : "Control"}
            </span>
            <span>Last run: {rule.lastRun}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
