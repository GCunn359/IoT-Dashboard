import { revalidatePath } from "next/cache";

import { AppShell } from "@/components/AppShell";
import { DeviceGrid, SummaryGrid } from "@/components/Cards";
import { PageSection } from "@/components/PageSections";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import {
  approveDiscoveredDevice,
  clearMockDiscoveredDevices,
  deleteDiscoveredDevice,
  getDiscoveredDevices,
  runDiscoveryScan,
} from "@/lib/discovery";
import {
  fetchHomeAssistantEntities,
  importHomeAssistantEntities,
} from "@/lib/home-assistant";
import { getSettings } from "@/lib/settings";
import {
  addManualDevice,
  deletePersistedDevice,
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
  const settings = await getSettings();
  const discoveredDevices = (await getDiscoveredDevices()).filter(
    (device) => device.source === (settings.discoveryMode === "live" ? "live" : "mock"),
  );
  const homeAssistantEntities = settings.homeAssistantUrl && settings.homeAssistantToken
    ? await fetchHomeAssistantEntities(settings).catch(() => [])
    : [];
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
    revalidatePath("/settings");
  }

  async function approveDiscovery(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    if (id) {
      await approveDiscoveredDevice(id);
      revalidatePath("/devices");
    }
  }

  async function deleteDiscovery(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    if (id) {
      await deleteDiscoveredDevice(id);
      revalidatePath("/devices");
    }
  }

  async function clearMockDiscovery() {
    "use server";

    await clearMockDiscoveredDevices();
    revalidatePath("/devices");
    revalidatePath("/settings");
  }

  async function deleteDevice(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    if (id) {
      await deletePersistedDevice(id);
      revalidatePath("/", "layout");
      revalidatePath("/devices");
    }
  }

  async function syncHomeAssistantEntities() {
    "use server";

    const currentSettings = await getSettings();
    await importHomeAssistantEntities(currentSettings);
    revalidatePath("/", "layout");
    revalidatePath("/devices");
    revalidatePath("/settings");
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
              <p>
                Last scan: <strong>{settings.diagnosticDiscoveryScan ?? "No scan has run yet"}</strong>
              </p>
            </div>
            <form action={scanForDevices}>
              <PendingSubmitButton
                label={settings.discoveryMode === "live" ? "Run live scan" : "Run mock scan"}
                pendingLabel={settings.discoveryMode === "live" ? "Scanning IoT subnet..." : "Loading mock scan..."}
              />
            </form>
            <form action={clearMockDiscovery}>
              <button className="primary-button compact subtle" type="submit">
                Clear mock results
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
                      <small>
                        Services: {device.metadata.services.join(", ") || "none detected"}
                      </small>
                      <small>
                        Endpoints: {device.metadata.endpoints.join(", ") || "none detected"}
                      </small>
                      {device.metadata.httpTitles.length > 0 ? (
                        <small>
                          Titles: {device.metadata.httpTitles.join(", ")}
                        </small>
                      ) : null}
                      {device.metadata.notes.length > 0 ? (
                        <small>
                          Metadata: {device.metadata.notes.slice(0, 3).join(" | ")}
                        </small>
                      ) : null}
                    </div>
                    {device.status === "added" ? (
                      <div className="discovery-actions">
                        <strong>Added</strong>
                        <form action={deleteDiscovery}>
                          <input name="id" type="hidden" value={device.id} />
                          <button className="primary-button compact subtle" type="submit">
                            Remove result
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="discovery-actions">
                        <form action={approveDiscovery}>
                          <input name="id" type="hidden" value={device.id} />
                          <button className="primary-button compact" type="submit">
                            Add to dashboard
                          </button>
                        </form>
                        <form action={deleteDiscovery}>
                          <input name="id" type="hidden" value={device.id} />
                          <button className="primary-button compact subtle" type="submit">
                            Delete result
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="discovery-empty">
                  No {settings.discoveryMode === "live" ? "live" : "mock"} scan results yet. Run discovery to update this list.
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
          <article className="panel ha-bridge-panel">
            <div className="section-heading">
              <p>Home Assistant bridge</p>
              <h2>Import local HA entities</h2>
              <p>
                Configure the HA URL/token in Settings, then import matching HA
                entities as dashboard devices. Matched entities:{" "}
                <strong>{homeAssistantEntities.length}</strong>
              </p>
            </div>
            <form action={syncHomeAssistantEntities}>
              <PendingSubmitButton
                label="Sync Home Assistant entities"
                pendingLabel="Importing HA entities..."
              />
            </form>
            {homeAssistantEntities.length > 0 ? (
              <div className="ha-entity-preview">
                {homeAssistantEntities.slice(0, 12).map((entity) => (
                  <span key={entity.entity_id}>
                    {entity.entity_id} · {entity.state}
                  </span>
                ))}
              </div>
            ) : (
              <div className="discovery-empty">
                No HA entities matched yet. Add the local HA URL and long-lived
                token in Settings, then test the HA connection.
              </div>
            )}
          </article>
          <article className="panel device-management-panel">
            <div className="section-heading">
              <p>Inventory</p>
              <h2>Saved dashboard devices</h2>
              <p>
                Remove stale mock, test, or unwanted devices from the persistent
                SQLite inventory. Discovery results can be deleted separately
                above.
              </p>
            </div>
            <div className="saved-device-list">
              {devices.map((device) => (
                <article className="saved-device-row" key={device.id}>
                  <div>
                    <strong>{device.name}</strong>
                    <span>
                      {device.room} · {device.integration} · {device.category}
                    </span>
                  </div>
                  <form action={deleteDevice}>
                    <input name="id" type="hidden" value={device.id} />
                    <button className="primary-button compact danger" type="submit">
                      Delete device
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </article>
          <DeviceGrid devices={devices} />
        </section>
      </PageSection>
    </AppShell>
  );
}
