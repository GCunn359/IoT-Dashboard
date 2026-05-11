import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import {
  deviceCategories,
  deviceStatuses,
  getPersistedDevice,
  parseEditableDeviceForm,
  riskLevels,
  updateDevice,
} from "@/lib/devices";

export const dynamic = "force-dynamic";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const device = await getPersistedDevice(id);

  if (!device) {
    notFound();
  }

  async function saveDevice(formData: FormData) {
    "use server";

    await updateDevice(id, parseEditableDeviceForm(formData));
    revalidatePath(`/devices/${id}`);
    revalidatePath("/devices");
  }

  const controlHref = getControlHref(device.category);

  return (
    <AppShell
      description="Device metadata, telemetry, safety profile, and integration routing."
      title={device.name}
    >
      <section className="device-detail-layout">
        <article className="panel device-detail-hero">
          <div>
            <p className="muted">{device.room}</p>
            <h2>{device.integration}</h2>
            <span className={`pill ${device.status}`}>{device.status}</span>
          </div>
          <div className="device-meta-row">
            <span>{device.category}</span>
            <span>Risk: {device.riskLevel}</span>
            <span>{device.canControl ? "Control ready" : "Monitor only"}</span>
            <span>Last seen: {device.lastSeen}</span>
          </div>
          <div className="device-action-row">
            {device.canControl && controlHref ? (
              <Link className="control-button" href={controlHref}>
                Open smart controls
              </Link>
            ) : (
              <span className="monitor-only-note">No controls enabled</span>
            )}
            <Link className="secondary-button" href="/devices">
              Back to devices
            </Link>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p>Configuration</p>
            <h2>Edit device details</h2>
            <p>
              Update the dashboard metadata used for rooms, integration routing,
              MQTT mapping, safety controls, and display grouping.
            </p>
          </div>
          <form action={saveDevice} className="device-edit-form">
            <label>
              <span>Friendly name</span>
              <input defaultValue={device.name} name="name" required />
            </label>
            <label>
              <span>Room</span>
              <input defaultValue={device.room} name="room" required />
            </label>
            <label>
              <span>Integration</span>
              <input defaultValue={device.integration} name="integration" required />
            </label>
            <label>
              <span>IP / external ID</span>
              <input
                defaultValue={device.externalId}
                name="externalId"
                placeholder="192.168.30.x or vendor ID"
              />
            </label>
            <label>
              <span>MQTT state topic</span>
              <input
                defaultValue={device.mqttStateTopic}
                name="mqttStateTopic"
                placeholder="home/kitchen/light/state"
              />
            </label>
            <label>
              <span>MQTT command topic</span>
              <input
                defaultValue={device.mqttCommandTopic}
                name="mqttCommandTopic"
                placeholder="home/kitchen/light/set"
              />
            </label>
            <label>
              <span>Category</span>
              <select defaultValue={device.category} name="category">
                {deviceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={device.status} name="status">
                {deviceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Risk level</span>
              <select defaultValue={device.riskLevel} name="riskLevel">
                {riskLevels.map((riskLevel) => (
                  <option key={riskLevel} value={riskLevel}>
                    {riskLevel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Control support</span>
              <select defaultValue={device.canControl ? "true" : "false"} name="canControl">
                <option value="false">Monitor only</option>
                <option value="true">Control ready</option>
              </select>
            </label>
            <label className="device-notes-field">
              <span>Notes</span>
              <textarea
                defaultValue={device.notes}
                name="notes"
                placeholder="Pairing notes, DHCP reservation, local key notes, or safety notes"
              />
            </label>
            <button className="primary-button compact" type="submit">
              Save device
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p>Telemetry</p>
            <h2>Latest state</h2>
            <p>
              These values currently come from the latest stored state. MQTT and
              integration ingestion will update this automatically later.
            </p>
          </div>
          <div className="metric-list">
            {device.metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}

function getControlHref(category: string) {
  const hrefs: Record<string, string> = {
    heating: "/heating",
    lighting: "/lighting",
    radiator: "/heating",
    security: "/security",
    socket: "/sockets",
    water: "/heating",
  };

  return hrefs[category];
}
