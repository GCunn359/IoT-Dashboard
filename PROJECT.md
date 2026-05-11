# IoT Dashboard Project Concept

## Purpose

IoT Dashboard is a self-hosted local web app for monitoring home sensors, smart-home devices, and utility usage from a TrueNAS Scale server. The app should be very user friendly, with a clear room/category layout, simple status cards, helpful charts, and plain-language alerts so a homeowner can understand what is happening without needing technical knowledge.

The first version should focus on home and environmental monitoring, while the design should be flexible enough to expand into utility smart meter usage, solar generation, heating, lighting, sockets, and other smart-home controls over time.

Google Nest Hub Max should be treated as a key display and control surface for the system. The app should provide a touch-friendly kiosk/display mode that works well on the Hub where possible, while still being usable from phones, tablets, and laptops.

## Target Deployment

The app should be designed to run locally in Docker or a similar container setup on TrueNAS Scale. It should work on the home network first, with no public internet dependency required for normal dashboard usage.

TrueNAS should be treated as the application host, not the IoT network router or gateway. IoT devices already live on a dedicated IoT Wi-Fi network/VLAN/subnet. The preferred deployment is controlled routed access from the dashboard app or TrueNAS host to the IoT subnet, with firewall rules allowing dashboard-initiated traffic and blocking IoT devices from initiating access to the normal LAN.

The app should support this network model explicitly:

- Store the IoT subnet/CIDR and access mode in configuration.
- Prefer DHCP reservations or known static IPs for existing Wi-Fi devices.
- Use optional discovery only as an admin onboarding tool, not as a daily dependency.
- Use MQTT as a clean bridge for devices that support it.
- Keep vendor integrations such as Tuya, Sonoff/eWeLink, Nest, AJAX, and eSolar separate from generic network discovery.
- Never assume a visible Wi-Fi device is safely controllable until the user confirms the integration and risk level.

## Initial Scope

The first version should include:

- Live sensor readings from connected home/environment devices.
- Device status, including last seen time and whether a device appears offline.
- Historical charts for readings such as temperature, humidity, air quality, battery level, and other MQTT sensor values.
- Basic alerts for offline devices, high/low thresholds, or unusual readings.
- A responsive dashboard UI suitable for laptop, tablet, and phone use on the local network.
- A simple navigation structure for major home areas such as utility power, lighting, heating, water heating, radiator valves, and sockets.
- A design that can show both monitoring-only devices and controllable devices when supported.
- Monitoring for an AJAX alarm system, including alarm state, device health, and recent security events where integration allows.
- A future-safe automation layer that can connect systems together with clear safeguards and manual override.
- Google Nest Hub Max friendly display/control mode.
- Sonoff and Tuya smart lighting/socket support through the safest practical local or bridge-based integration.

## Out of Scope for the First Version

The first version should avoid:

- Public cloud hosting requirements.
- Complex automation rules.
- User management beyond a simple local admin/password option if needed.
- Direct device firmware management.
- Advanced integrations until the core MQTT dashboard is working.
- Security-critical automation that could arm/disarm alarms or unlock access without explicit user approval and strong safeguards.

## Suggested Architecture

### Components

1. **Web dashboard**
   - Displays current readings, charts, device status, and alerts.
   - Should be responsive and easy to use from a browser.
   - Should prioritize user-friendly labels, icons, traffic-light statuses, and clear "what needs attention" summaries.
   - Should include a kiosk/display mode for Google Nest Hub Max with large touch targets, auto-refreshing status, and simplified navigation.

2. **Backend/API**
   - Receives or reads sensor data.
   - Stores readings.
   - Calculates device health and alert states.

3. **MQTT ingestion**
   - Connects to a local MQTT broker such as Mosquitto.
   - Subscribes to configured sensor topics.
   - Normalizes messages into device readings.

4. **Database**
   - Stores devices, latest readings, reading history, and alert configuration.
   - Should use SQLite by default for easiest TrueNAS Scale deployment.
   - Should store the SQLite database in a persistent Docker volume, such as `/data`, so data survives container restarts and is easy to back up.

5. **Docker deployment**
   - Provide a Dockerfile and Docker Compose configuration.
   - Compose should support running the dashboard with a database and optionally Mosquitto.

## Recommended Technology Direction

A good starting approach is:

- **App:** Next.js or another full-stack TypeScript web framework.
- **MQTT:** MQTT.js client connected to Mosquitto.
- **Database:** SQLite by default for easiest TrueNAS Scale deployment.
- **Database layer:** Drizzle ORM with migrations.
- **Charts:** A lightweight React charting library.
- **Deployment:** Docker Compose for TrueNAS Scale.

PostgreSQL can remain a future option if the dashboard grows beyond what SQLite comfortably handles, but the first version should avoid a separate database service unless it becomes necessary.

## Example MQTT Data Model

Devices can publish JSON messages to predictable topics, for example:

```text
home/living-room/temperature
home/living-room/humidity
home/garage/air-quality
home/greenhouse/soil-moisture
```

Example payload:

```json
{
  "value": 21.4,
  "unit": "C",
  "battery": 87,
  "timestamp": "2026-05-11T12:00:00Z"
}
```

The app should support a clear mapping between MQTT topics and dashboard devices/sensors.

## Core Screens

### Dashboard

Shows a quick overview of:

- Current sensor readings.
- Offline devices.
- Active alerts.
- Recently updated devices.
- Utility power snapshot.
- Heating and hot water status.
- Lighting and socket status.
- AJAX alarm status and recent security events.

The dashboard should be easy to understand at a glance, using friendly cards rather than dense technical tables.

### Utility Power

Dedicated page for household utility energy monitoring. This should support future smart meter usage and include solar information from an eSolar AIO3 inverter.

Shows:

- Current grid import.
- Current grid export.
- Current solar generation/input.
- Battery charge level for the 10 kWh battery system.
- Battery charge/discharge power if available.
- Household consumption estimate where available.
- Daily, weekly, and monthly usage charts.
- Solar generation versus import/export charts.
- Cost estimates if tariff values are configured.
- Alerts for unusual consumption, high export, inverter offline, or missing smart meter data.

The eSolar AIO3 inverter integration should be treated as a named target integration. The app should be designed so inverter readings can come from MQTT, an API bridge, Home Assistant, or another local collector depending on what the inverter supports.

The current solar setup includes an eSolar AIO3 inverter with 2 x 5 kWh battery modules, giving 10 kWh total battery capacity. The first version should monitor the inverter and batteries only. It should not control inverter/battery behavior such as force charging, reserve level, export settings, or charge windows until a later phase.

Irish utility smart meter/provider data should be supported as a future/additional source. For now, the inverter is the first energy source of truth.

### Lighting

Dedicated page for smart lighting.

Shows:

- Lights grouped by room or area.
- On/off status.
- Brightness and colour/temperature where supported.
- Offline or unreachable lights.
- Direct on/off control where the integration supports reliable control.
- Brightness, colour/temperature, and scene controls where supported.
- Optional scenes or presets in a later version.

Target lighting ecosystems include Sonoff and Tuya. The implementation should prefer local/MQTT bridges where practical, but can support cloud/API bridges if local control is not available for a specific device. The first controllable version should allow direct light on/off control.

### Heating and Water Heating

Dedicated page for central heating, water heating, Nest heating, smart thermostats, and radiator valves.

Shows:

- Current indoor temperatures.
- Target temperatures.
- Heating mode and schedule status.
- Hot water status if available.
- Nest heating status if integrated.
- Smart thermostat status.
- Radiator valve status by room.
- Tuya TRV604 target temperature controls.
- Tuya TRV604 schedules where integration allows.
- Tuya TRV604 summer/hot-water mode options.
- Battery/offline warnings for radiator valves.
- Temperature history charts by room.

Current heating setup includes a Google Nest Thermostat with a boiler on/off module. Smart radiator valves are installed separately and currently work in isolation from the boiler.

The smart radiator valves are Tuya TRV604 devices. The Heating and Water Heating page should show Nest heating state and Tuya TRV604 room/valve state together, but it should not assume they are coordinated unless automation is configured later. The app should allow Tuya TRV604 target temperature and schedule control where integration support is reliable.

The app should support a summer/hot-water mode option for Tuya TRV604 valves. When the boiler is running for hot water only, selected radiator valves should be able to automatically close or stay closed so radiators do not heat unnecessarily. This should be configurable per valve/room, with a clear override option.

Nest/boiler control should be introduced carefully once the supported integration path is known. Future automations can suggest or coordinate behavior, such as highlighting when a room valve is calling for heat but the Nest/boiler is off.

### Sockets

Dedicated page for smart plugs and sockets.

Shows:

- Socket status grouped by room.
- On/off state.
- Power draw where supported.
- Energy usage over time where supported.
- Offline sockets.
- Direct on/off control where the integration supports reliable control.

Target socket ecosystems include Sonoff and Tuya. The first controllable version should allow direct socket on/off control. Individual sockets should be configurable as normal or critical. Normal sockets can be controlled without a PIN; critical sockets should require confirmation or admin protection.

### Security / AJAX Alarm

Dedicated page for monitoring an AJAX alarm system.

Shows:

- Overall alarm state, such as armed, disarmed, night mode, alarm active, or unknown.
- Hub connection status.
- Recent alarm/security events.
- Sensor/device status, such as doors, motion sensors, keypads, sirens, and leak/fire sensors if available.
- Battery warnings.
- Tamper warnings.
- Offline or unreachable alarm devices.
- Last event time and last successful sync time.

AJAX alarm integration should start as monitoring-only unless a safe and officially supported local/API integration is confirmed. Any future control actions, such as arming or disarming, must require explicit confirmation, clear audit logging, and optional disabling.

### Automations

Dedicated page for simple cross-system automations once the core monitoring features are stable.

Example automations:

- If the alarm is armed, turn off selected sockets or lights.
- If solar export is high, suggest or trigger water heating if supported.
- If a room temperature is low, highlight heating/radiator valve actions.
- If the boiler is in hot-water-only mode, close selected Tuya TRV604 radiator valves using the summer mode setting.
- If a water leak alarm triggers, show an urgent dashboard alert.
- If a device goes offline, create a notification.

Automation rules should be user friendly and safe:

- Use simple "when this happens, do that" wording.
- Support enabled/disabled toggles per rule.
- Show the last time each rule ran.
- Keep an automation log.
- Require confirmation for safety-sensitive actions.
- Avoid hidden or irreversible actions.
- Allow monitoring-only recommendation mode before enabling actual control.

Hot water controls and automation enable/disable/run actions should not require a PIN by default. Alarm arm/disarm, security event clearing, system settings, credentials, and any future door/access controls should require a PIN or admin authentication.

### Nest Hub Max Display / Kiosk Mode

Dedicated simplified view for Google Nest Hub Max and other wall/tablet displays.

Shows:

- Large overview cards.
- Current home status.
- Utility power and solar summary.
- Heating and hot water summary.
- Lighting and socket quick controls.
- AJAX alarm status.
- Active alerts.
- Clear navigation to major sections.

Controls should be large, touch-friendly, and suitable for shared home use. Low-risk actions should be available immediately. Security-sensitive actions should require PIN/admin confirmation.

### Rooms / Areas

Optional friendly view that groups all devices by location, for example living room, kitchen, garage, greenhouse, or utility cupboard.

### Devices

Shows each known device with:

- Name and location.
- MQTT topics.
- Last seen time.
- Battery level if available.
- Current readings.

### Sensor Detail

Shows:

- Current value.
- Recent history chart.
- Min/max/average over selectable time ranges.
- Alert thresholds.

### Settings

Allows configuration of:

- MQTT broker host, port, username, and password.
- Device/topic mappings.
- Friendly device names, rooms, categories, and icons.
- Alert thresholds.
- Data retention period.
- Utility tariff/cost settings if energy usage is enabled.
- Integrations such as eSolar AIO3, Nest, smart thermostats, radiator valves, lighting, sockets, AJAX alarm, and automation connectors when available.
- Automation rules, safety confirmations, and automation logging.

## Device Categories

The app should support these top-level categories:

- Environment sensors
- Utility power
- Solar/inverter
- Lighting
- Heating
- Water heating
- Radiator valves
- Sockets/smart plugs
- Security/alarm
- Automation
- Google/Nest display
- General devices

Each category should have sensible defaults for units, charts, status labels, and alert types.

## TrueNAS Scale Deployment Notes

The project should include:

- A `Dockerfile`.
- A `docker-compose.yml`.
- `.env.example` for local configuration.
- A persistent `/data` volume for the SQLite database and local configuration.
- Clear README instructions for running on TrueNAS Scale.

Example services:

- `iot-dashboard`
- `mqtt` / `mosquitto`

The default deployment should not require a separate database container.

## Network and Subnet Assumptions

The dashboard should support deployments where TrueNAS Scale, Docker containers, user devices, and IoT devices are on different subnets or VLANs.

Preferred approach:

- Use MQTT and explicit integration bridges as the main communication path.
- Avoid relying on broadcast discovery, mDNS, SSDP, or device scanning across subnets.
- Configure broker, bridge, and integration hosts by hostname or IP address.
- Allow IoT devices to publish to the MQTT broker rather than requiring the dashboard to reach every device directly.
- Allow the dashboard container to connect to MQTT and selected integration endpoints.
- Allow trusted user devices and Google Nest Hub Max to reach the dashboard web port.

Recommended firewall paths:

- IoT subnet to MQTT broker on `1883` or `8883`.
- Dashboard container to MQTT broker on `1883` or `8883`.
- Dashboard container to selected integration endpoints for Sonoff, Tuya, eSolar AIO3, Nest/Google, AJAX, or Home Assistant if used.
- Trusted user/Nest display subnet to dashboard web port, such as `3000`.

The app should include clear connection settings and later a diagnostics page to test MQTT, integration endpoints, and dashboard reachability.

## Security and Privacy

Because this is intended for local home use:

- Default to local-network deployment.
- Do not require cloud accounts.
- Keep MQTT credentials in environment variables or Docker secrets.
- Avoid logging sensitive credentials.
- Make remote access optional and documented as a separate decision.

## Future Ideas

Possible later additions:

- Home Assistant integration.
- eSolar AIO3 inverter integration.
- Smart meter integrations.
- AJAX alarm integration.
- Nest heating integration.
- Smart thermostat and radiator valve integrations.
- Lighting and socket controls.
- Cross-system automation builder.
- Export readings to CSV.
- Push notifications for alerts.
- Automation rules.
- Multiple dashboards or rooms.
- User accounts and roles.
- Device provisioning helpers.

## First Build Milestones

1. Create the base Docker-ready web app.
2. Add MQTT connection configuration.
3. Ingest and store readings from MQTT topics.
4. Show live/latest readings on the dashboard.
5. Add history charts.
6. Add device offline detection.
7. Add threshold alerts.
8. Add the main navigation pages: Utility Power, Lighting, Heating/Water, Sockets, Devices, and Settings.
9. Add the Utility Power page layout with placeholder support for smart meter and eSolar AIO3 data.
10. Document TrueNAS Scale deployment.
