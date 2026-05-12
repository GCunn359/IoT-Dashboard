import { revalidatePath } from "next/cache";

import { AppShell } from "@/components/AppShell";
import { DeviceGrid, SummaryGrid } from "@/components/Cards";
import { PageSection } from "@/components/PageSections";
import {
  approveDiscoveredDevice,
  getDiscoveredDevices,
  runDiscoveryScan,
} from "@/lib/discovery";
import { getSettings } from "@/lib/settings";
import {
  addManualDevice,
  deviceCategories,
  deviceStatuses,
  getDeviceSummaryCards,
  getPersistedDevices,
  parseManualDeviceForm,
  riskLevels,
} from "@/lib/devices";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const devices = await getPersistedDevices();
  const discoveredDevices = await getDiscoveredDevices();
  const settings = await getSettings();
  const cards = getDeviceSummaryCards(devices);

  async function addDevice(formData: FormData) {
    "use server";

    await addManualDevice(parseManualDeviceForm(formData));
    revalidatePath("/devices");
  }

  async function scanForDevices() {
    "use server";

    await runDiscoveryScan();
    revalidatePath("/devices");
  }

  async function approveDiscovery(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    if (id) {
      await approveDiscoveredDevice(id);
      revalidatePath("/devices");
    }
  }

  return (
    <AppShell
      description="A complete device inventory with rooms, integrations, status, capabilities, and risk levels."
      title="Devices"
    >
      <SummaryGrid cards={cards} />
      <PageSection
        description="A persistent SQLite inventory for friendly names, integrations, live state, controls, risk levels, and future MQTT topics."
        title="Device command centre"
      >
        <section className="device-admin-layout">
          <article className="panel device-discovery-panel">
            <div className="section-heading">
              <p>Discovery</p>
              <h2>Find existing IoT Wi-Fi devices</h2>
              <p>
                Current mode: <strong>{settings.discoveryMode === "live" ? "Live network scan" : "Mock/test scan"}</strong>.
                Live discovery should only run on the TrueNAS host that can reach
                the IoT subnet.
              </p>
            </div>
            <form action={scanForDevices}>
              <button className="primary-button compact" type="submit">
                Run discovery scan
              </button>
            </form>
            <div className="discovery-result-grid">
              {discoveredDevices.length > 0 ? (
                discoveredDevices.map((device) => (
                  <article className={`discovery-result ${device.status}`} key={device.id}>
                    <div>
                      <span>{device.source} scan · {device.confidence}% match</span>
                      <h3>{device.hostname ?? device.ipAddress}</h3>
                      <p>
                        {device.vendor ?? "Unknown vendor"} · likely {device.likelyType}
                      </p>
                      <small>
                        {device.ipAddress} · ports {device.openPorts.join(", ") || "none"}
                      </small>
                    </div>
                    {device.status === "added" ? (
                      <strong>Added</strong>
                    ) : (
                      <form action={approveDiscovery}>
                        <input name="id" type="hidden" value={device.id} />
                        <button className="primary-button compact" type="submit">
                          Add to dashboard
                        </button>
                      </form>
                    )}
                  </article>
                ))
              ) : (
                <div className="discovery-empty">
                  No scan results yet. Run a mock scan to preview the onboarding flow.
                </div>
              )}
            </div>
          </article>

          <article className="panel device-onboarding-panel">
            <div className="section-heading">
              <p>Manual onboarding</p>
              <h2>Add a known Wi-Fi device</h2>
              <p>
                Use this for devices that already exist on the IoT network. A
                future scan flow will pre-fill these fields from discovery
                results.
              </p>
            </div>
            <form action={addDevice} className="device-onboarding-form">
              <label>
                <span>Device name</span>
                <input name="name" placeholder="Kitchen light switch" required />
              </label>
              <label>
                <span>Room</span>
                <input name="room" placeholder="Kitchen" required />
              </label>
              <label>
                <span>Integration</span>
                <input name="integration" placeholder="Tuya, Sonoff, MQTT..." required />
              </label>
              <label>
                <span>Category</span>
                <select defaultValue="lighting" name="category">
                  {deviceCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select defaultValue="unknown" name="status">
                  {deviceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Risk level</span>
                <select defaultValue="low" name="riskLevel">
                  {riskLevels.map((riskLevel) => (
                    <option key={riskLevel} value={riskLevel}>
                      {riskLevel}
                    </option>
                  ))}
                </select>
              </label>
              <label className="device-control-toggle">
                <span>Control support</span>
                <select defaultValue="false" name="canControl">
                  <option value="false">Monitor only</option>
                  <option value="true">Control ready</option>
                </select>
              </label>
              <button className="primary-button compact" type="submit">
                Add device
              </button>
            </form>
          </article>
          <DeviceGrid devices={devices} />
        </section>
      </PageSection>
    </AppShell>
  );
}
