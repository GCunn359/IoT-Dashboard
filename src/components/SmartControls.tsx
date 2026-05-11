import type { Device } from "@/lib/types";

function getMetric(device: Device, label: string) {
  return device.metrics.find((metric) => metric.label === label)?.value ?? "Unknown";
}

function isOn(device: Device) {
  return getMetric(device, "State").toLowerCase() === "on";
}

export function SocketControlGrid({ devices }: { devices: Device[] }) {
  return (
    <section className="socket-grid">
      {devices.map((device) => {
        const on = isOn(device);

        return (
          <article className={`uk-socket-card ${on ? "on" : "off"}`} key={device.id}>
            <div className="socket-faceplate">
              <div className="socket-switch-row">
                <span className={`socket-status ${on ? "on" : "off"}`}>
                  {on ? "ON" : "OFF"}
                </span>
                <button
                  aria-label={`${on ? "Turn off" : "Turn on"} ${device.name}`}
                  className={`rocker-switch ${on ? "on" : "off"}`}
                  type="button"
                >
                  <span />
                </button>
              </div>
              <div className="socket-outlet" aria-hidden="true">
                <span className="slot left" />
                <span className="slot right" />
                <span className="slot earth" />
              </div>
            </div>
            <div className="control-copy">
              <p>{device.room}</p>
              <h2>{device.name}</h2>
              <span>
                {device.integration} · {getMetric(device, "Power")}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function LightSwitchGrid({ devices }: { devices: Device[] }) {
  return (
    <section className="light-grid">
      {devices.map((device) => {
        const on = isOn(device);

        return (
          <article className={`light-switch-card ${on ? "on" : "off"}`} key={device.id}>
            <div className="light-glow" aria-hidden="true" />
            <div className="switch-plate">
              <button
                aria-label={`${on ? "Turn off" : "Turn on"} ${device.name}`}
                className={`wall-switch ${on ? "on" : "off"}`}
                type="button"
              >
                <span className="switch-top" />
                <span className="switch-bottom" />
              </button>
            </div>
            <div className="control-copy">
              <p>{device.room}</p>
              <h2>{device.name}</h2>
              <span>
                {on ? "Lights on" : "Lights off"} · {getMetric(device, "Brightness")}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function SecurityConsole({ devices }: { devices: Device[] }) {
  const hub = devices[0];

  return (
    <section className="security-console">
      <div className="alarm-screen">
        <div className="alarm-topline">
          <span className="scanner-dot" />
          AJAX live monitor
        </div>
        <div className="alarm-state">
          <span className="shield-mark" aria-hidden="true">
            🛡️
          </span>
          <div>
            <p>Current mode</p>
            <strong>{hub ? getMetric(hub, "Mode") : "Unknown"}</strong>
          </div>
        </div>
        <div className="alarm-grid">
          <div>
            <span>Hub</span>
            <strong>{hub?.status ?? "unknown"}</strong>
          </div>
          <div>
            <span>Events</span>
            <strong>{hub ? getMetric(hub, "Events") : "Unknown"}</strong>
          </div>
          <div>
            <span>Last sync</span>
            <strong>{hub?.lastSeen ?? "Unknown"}</strong>
          </div>
          <div>
            <span>Control</span>
            <strong>Monitor only</strong>
          </div>
        </div>
      </div>
      <div className="zone-list">
        {[
          ["Front door", "Closed", "secure"],
          ["Kitchen PIR", "Clear", "secure"],
          ["Garage contact", "Closed", "secure"],
          ["Landing keypad", "Battery 91%", "warning"],
        ].map(([zone, state, tone]) => (
          <article className={`zone-card ${tone}`} key={zone}>
            <span className="zone-light" />
            <div>
              <h2>{zone}</h2>
              <p>{state}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
