# IoT Dashboard

A self-hosted, TrueNAS Scale friendly smart-home dashboard for local monitoring and control.

## Goals

- Run as a Docker app on TrueNAS Scale.
- Store app data in a persistent `/data` volume using SQLite.
- Use Drizzle ORM for schema and migrations.
- Support MQTT and integration bridges instead of subnet-wide device discovery.
- Provide friendly pages for utility power, solar/battery, heating, lighting, sockets, AJAX alarm monitoring, automations, devices, and settings.
- Include a large touch-friendly display mode for Google Nest Hub Max or tablet-style use.

## Development

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```powershell
npm run build
npm run start
```

## Docker

```powershell
docker compose up --build
```

The app listens on port `3000`, stores persistent data under `/data` inside the container, and self-creates the SQLite schema on a fresh volume. The bundled Compose file also starts a local Mosquitto broker on port `1883`.

Settings is protected with `SETTINGS_PIN`. Set it in your deployment environment or local `.env` before starting the dashboard.

## TrueNAS Scale deployment

Create or choose a dataset for app data, then mount it into the container at `/data`.

Recommended settings:

- Image: built from this repo, or a future published container image.
- Container port: `3000`
- Host port: `3000` or another free local port.
- Persistent volume: TrueNAS dataset mounted to `/data`.
- Environment variables: copy from `.env.example`.

MQTT can be an existing broker on your network or the optional Mosquitto service in `docker-compose.yml`.

## IoT network access model

Recommended deployment keeps TrueNAS as the app host, not as the network gateway.

- Put IoT devices on the existing IoT Wi-Fi/VLAN/subnet.
- Give important devices DHCP reservations or static names.
- Allow the dashboard app or TrueNAS host to initiate restricted traffic to the IoT subnet.
- Block IoT devices from initiating traffic to the normal LAN, except established replies.
- Use MQTT as the preferred bridge where devices support it.
- Use manual/static device records when Wi-Fi devices cannot be reliably discovered.

Environment variables:

- `IOT_ACCESS_MODE`: `routed`, `same-subnet`, or `mqtt-only`.
- `IOT_SUBNET_CIDR`: the IoT network range, for example `192.168.30.0/24` when the IoT gateway is `192.168.30.1`.
- `IOT_SUBNET_NOTES`: deployment notes shown in Settings.

## Planning docs

- `PROJECT.md` contains the project concept and requirements.
- `IMPLEMENTATION_PLAN.md` contains the phased build plan.
