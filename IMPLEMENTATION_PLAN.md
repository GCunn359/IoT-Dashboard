# IoT Dashboard Implementation Plan

## Goal

Build a user-friendly, self-hosted smart-home dashboard that runs as a Docker app on TrueNAS Scale. The first production-ready version should be easy to deploy, use SQLite persistence in a `/data` volume, connect to MQTT/integration bridges, and provide clear pages for home status, utility power, lighting, heating, sockets, AJAX alarm monitoring, automations, devices, and settings.

## Guiding Decisions

- Deployment should be simple on TrueNAS Scale.
- SQLite is the default database.
- Drizzle ORM is the selected database layer for SQLite schema and migrations.
- App data should live in a persistent `/data` volume.
- MQTT and explicit integration bridges are preferred over device discovery.
- The dashboard should support different IoT/user/server subnets.
- Google Nest Hub Max should be supported as a touch-friendly display/control surface where possible.
- Google Home is the user-facing ecosystem, but Sonoff/eWeLink and Tuya/Smart Life are likely device integration sources.
- Home Assistant is optional and should only be used if it simplifies integrations.
- eSolar AIO3 and battery monitoring is read-only at first.
- AJAX alarm starts as monitoring-only unless a safe supported control integration is confirmed.
- Low-risk controls should not require a PIN.
- Security-sensitive actions require PIN/admin protection.

## MVP Scope

The MVP should prove the full app structure before deep integrations.

Included:

- Docker-ready web app.
- SQLite database stored under `/data`.
- Responsive dashboard shell.
- Kiosk/display mode for Nest Hub Max and tablet-style use.
- Navigation for Dashboard, Utility Power, Lighting, Heating/Water, Sockets, Security, Automations, Devices, and Settings.
- Demo/mock device data.
- Device, room, reading, alert, and automation data models.
- MQTT connection configuration.
- Basic MQTT ingestion skeleton.
- TrueNAS Scale deployment documentation.

Not included in MVP:

- Full vendor integrations for every device.
- Alarm arm/disarm control.
- Inverter/battery control.
- Complex automation execution.
- Remote internet exposure.

## Phase 1: Project Foundation

Create the application foundation.

- Set up a full-stack TypeScript web app.
- Add linting, formatting, and build scripts.
- Add Dockerfile.
- Add docker-compose.yml.
- Add `.env.example`.
- Add `/data` volume usage.
- Add SQLite database setup.
- Add Drizzle ORM and migration setup.
- Add initial README deployment instructions.

Deliverable:

- The app builds locally and runs in Docker with persistent SQLite storage.

## Phase 2: Core Data Model

Create the database schema and internal types.

Core entities:

- Rooms
- Devices
- Device categories
- Sensors/readings
- Latest device state
- Historical readings
- Alerts
- Integrations
- Automation rules
- Automation logs
- Control actions/audit logs

Important fields:

- Device name
- Friendly display name
- Room/location
- Category
- Integration source
- MQTT topic or external identifier
- Last seen time
- Online/offline state
- Battery level where available
- Control capability flags
- Risk level for controls

Deliverable:

- Demo data can populate the dashboard from SQLite.

## Phase 3: User Interface Shell

Build the main UI layout.

Pages:

- Dashboard
- Utility Power
- Lighting
- Heating and Water Heating
- Sockets
- Security / AJAX Alarm
- Automations
- Devices
- Settings
- Kiosk/display mode

UI principles:

- Friendly cards instead of dense technical tables.
- Large touch targets.
- Clear status colours.
- Plain-language alerts.
- Mobile, laptop, tablet, and Nest Hub Max friendly.
- Quick controls where appropriate.

Deliverable:

- All main pages exist with demo data and responsive layout.

## Phase 4: MQTT Foundation

Add MQTT support.

- Configure MQTT host, port, username, password, and TLS option.
- Connect from the app/server process to MQTT.
- Subscribe to configured topics.
- Normalize incoming readings.
- Store latest state and history.
- Mark devices offline when stale.
- Add a settings/diagnostics view for MQTT connection status.

Deliverable:

- Test MQTT messages update dashboard readings.

## Phase 5: Utility Power Page

Build the energy dashboard around the eSolar AIO3 as the first source of truth.

Display:

- Solar generation/input.
- Grid import.
- Grid export.
- Battery state of charge.
- Battery charge/discharge power.
- 10 kWh battery capacity from 2 x 5 kWh modules.
- Estimated house load where data allows.
- Daily totals.
- Import/export/solar charts.
- Placeholder for future Irish utility smart meter/provider data.

Control policy:

- Monitor only.
- No force charge, export mode, reserve setting, or battery schedule control in the first version.

Deliverable:

- Utility Power page works with demo data and is ready for real eSolar AIO3 adapter work.

## Phase 6: Lighting and Sockets

Build controllable pages for Sonoff and Tuya devices.

Lighting:

- Group by room.
- On/off state.
- Direct on/off control where reliable.
- Brightness and colour controls where available.
- Scenes later.

Sockets:

- Group by room.
- On/off state.
- Direct on/off control where reliable.
- Power draw and energy history where supported.
- Normal/critical socket flag.

Control policy:

- Normal lights and sockets do not require PIN.
- Critical sockets require confirmation or admin protection.

Deliverable:

- UI and control action framework exist with demo adapters before real vendor integration.

## Phase 7: Heating, Water Heating, and Tuya TRV604

Build the heating page around Nest plus Tuya TRV604 valves.

Nest:

- Show current temperature.
- Show target temperature.
- Show heating mode.
- Show boiler on/off status if available.

Tuya TRV604:

- Show room temperature.
- Show target temperature.
- Show valve/device status.
- Show battery/offline warnings.
- Allow target temperature control where integration is reliable.
- Allow schedule control where integration is reliable.
- Support summer/hot-water mode.

Summer/hot-water mode:

- If boiler is running for hot water only, selected Tuya TRV604 valves can close or stay closed.
- Configure per valve/room.
- Provide clear override.

Control policy:

- Tuya TRV604 target/schedule control allowed.
- Hot water controls do not require PIN.
- Nest/boiler control should be introduced carefully after integration path is confirmed.

Deliverable:

- Heating page supports demo Nest/TRV data and models the summer mode rule.

## Phase 8: Security / AJAX Alarm

Build monitoring-first AJAX alarm page.

Display:

- Alarm state.
- Hub connection status.
- Recent events.
- Sensor states.
- Battery warnings.
- Tamper warnings.
- Offline alarm devices.
- Last sync/event time.

Control policy:

- Monitor only initially.
- Any future arm/disarm requires PIN/admin protection and audit logging.

Deliverable:

- Security page works with demo data and can accept real adapter data later.

## Phase 9: Automations

Build a simple automation framework.

Rule format:

- When this happens, do that.

Examples:

- Alarm armed -> turn off selected lights/sockets.
- High solar export -> suggest or trigger hot water.
- Hot-water-only mode -> close selected Tuya TRV604 valves.
- Water leak alarm -> urgent alert.
- Device offline -> notification.

Automation requirements:

- Enable/disable per rule.
- No PIN required for normal automation run/enable/disable.
- Log every run.
- Show last run time.
- Support recommendation-only mode.
- Require PIN/admin for security-sensitive actions.

Deliverable:

- Automation page can create, show, enable/disable, and log simple demo rules.

## Phase 10: Integration Adapters

Add real integrations progressively.

Priority order:

1. MQTT generic adapter.
2. Tuya/Smart Life adapter or bridge.
3. Sonoff/eWeLink adapter or bridge.
4. eSolar AIO3 adapter.
5. Nest/Google adapter where possible.
6. AJAX alarm adapter.
7. Home Assistant adapter only if it simplifies integration coverage.

Each adapter should:

- Report connection status.
- Avoid logging credentials.
- Normalize data into the app data model.
- Declare supported read/control capabilities.
- Fail visibly rather than silently.

Deliverable:

- Integrations can be added one at a time without rewriting the dashboard.

## Phase 11: TrueNAS Scale Deployment

Document and test deployment.

Required files:

- `Dockerfile`
- `docker-compose.yml`
- `.env.example`
- README deployment section

TrueNAS requirements:

- Mount dataset to `/data`.
- Expose app port.
- Configure MQTT/integration endpoints explicitly.
- Support separate IoT/user/server subnets.
- Back up `/data`.

Deliverable:

- Fresh TrueNAS app deployment can start, persist data, restart cleanly, and be backed up.

## Open Questions

- Exact eSolar AIO3 data access method.
- Exact Tuya integration method for TRV604, lights, and sockets.
- Exact Sonoff/eWeLink integration method.
- Whether Nest control/status can be accessed reliably without Home Assistant.
- Whether AJAX has a supported safe monitoring integration.
- Whether Google Nest Hub Max can open the local dashboard URL directly or needs a workaround.
- Preferred local hostname for the dashboard.
