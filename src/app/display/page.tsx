import Link from "next/link";

import { devices, summaryCards } from "@/lib/demo-data";

const displayRules = [
  "Large touch targets for Nest Hub Max and tablet use",
  "Read-only by default for shared displays",
  "Critical controls stay behind Settings PIN and confirmations",
  "Auto-refresh friendly layout for always-on room screens",
];

const roomStatus = [
  {
    detail: "Lights on · TRV 19.5°C · AJAX clear",
    icon: "🛋️",
    name: "Living room",
    state: "Comfort",
  },
  {
    detail: "Solar 3.8 kW · battery charging · washer off",
    icon: "⚡",
    name: "Utility",
    state: "Generating",
  },
  {
    detail: "Desk socket on · no alerts",
    icon: "💻",
    name: "Office",
    state: "Active",
  },
];

export default function DisplayPage() {
  const priorityDevices = devices.filter((device) =>
    ["solar", "heating", "water", "security"].includes(device.category),
  );

  return (
    <main className="display-page">
      <header className="display-hero">
        <div>
          <p>Nest Hub Max display mode</p>
          <h1>Home at a glance</h1>
          <span>
            A shared, touch-friendly dashboard for the kitchen, hallway, or wall
            display.
          </span>
        </div>
        <div className="display-clock-card" aria-label="Display behaviour">
          <span>Display profile</span>
          <strong>Read-only</strong>
          <small>Controls require full dashboard</small>
        </div>
      </header>

      <section className="display-grid" aria-label="Home status summary">
        {summaryCards.map((card) => (
          <article className={`display-card ${card.tone}`} key={card.title}>
            <i aria-hidden="true">{card.icon}</i>
            <p>{card.title}</p>
            <strong>{card.value}</strong>
            <span>{card.detail}</span>
          </article>
        ))}
      </section>

      <section className="display-main-layout">
        <article className="display-focus-card">
          <div className="display-section-heading">
            <p>Priority systems</p>
            <h2>Live home essentials</h2>
          </div>
          <div className="display-priority-grid">
            {priorityDevices.map((device) => {
              const primaryMetric = device.metrics[0];
              const secondaryMetric = device.metrics[1];

              return (
                <article className={`display-device ${device.category}`} key={device.id}>
                  <span className="display-device-icon" aria-hidden="true">
                    {getDisplayIcon(device.category)}
                  </span>
                  <div>
                    <p>{device.room}</p>
                    <h3>{device.name}</h3>
                    <strong>{primaryMetric?.value ?? device.status}</strong>
                    <small>
                      {primaryMetric?.label ?? device.integration}
                      {secondaryMetric
                        ? ` · ${secondaryMetric.label} ${secondaryMetric.value}`
                        : ""}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <aside className="display-side-panel">
          <div className="display-section-heading">
            <p>Display rules</p>
            <h2>Safe shared mode</h2>
          </div>
          <div className="display-rule-list">
            {displayRules.map((rule) => (
              <span key={rule}>{rule}</span>
            ))}
          </div>
          <Link className="primary-button" href="/">
            Open full dashboard
          </Link>
        </aside>
      </section>

      <section className="display-room-dock" aria-label="Room status">
        {roomStatus.map((room) => (
          <article key={room.name}>
            <i aria-hidden="true">{room.icon}</i>
            <div>
              <span>{room.state}</span>
              <strong>{room.name}</strong>
              <p>{room.detail}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function getDisplayIcon(category: string) {
  const icons: Record<string, string> = {
    heating: "🌡️",
    security: "🛡️",
    solar: "☀️",
    water: "💧",
  };

  return icons[category] ?? "●";
}
