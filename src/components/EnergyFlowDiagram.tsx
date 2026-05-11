const kpis = [
  { detail: "Generating now", icon: "☀️", label: "Solar", value: "3.8 kW" },
  { detail: "18.2 kWh today", icon: "📈", label: "Yield", value: "18.2" },
  { detail: "Charging 1.1 kW", icon: "🔋", label: "Battery", value: "74%" },
  { detail: "Whole-house demand", icon: "🏠", label: "Load", value: "2.3 kW" },
  { detail: "Import active", icon: "⚡", label: "Grid", value: "0.4 kW" },
];

const statusItems = [
  ["AIO3 inverter", "Online"],
  ["Battery", "Charging"],
  ["Grid", "Importing"],
  ["Mode", "Self-use"],
];

const dockItems = [
  { icon: "●", label: "Panels", value: "4/4" },
  { icon: "●", label: "Inverter", value: "2.45 kW" },
  { icon: "●", label: "House", value: "2.3 kW" },
  { icon: "●", label: "Battery", value: "74%" },
  { icon: "●", label: "Grid", value: "0.4 kW" },
  { icon: "●", label: "Self-use", value: "76%" },
];

export function EnergyFlowDiagram() {
  return (
    <section className="solar-dashboard" aria-label="Solar production overview">
      <div className="solar-dashboard-header">
        <div>
          <p>Solar production</p>
          <h2>Home energy overview</h2>
        </div>
        <span>eSolar AIO3 · live</span>
      </div>

      <div className="solar-kpi-strip">
        {kpis.map((kpi) => (
          <article key={kpi.label}>
            <i aria-hidden="true">{kpi.icon}</i>
            <div>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <p>{kpi.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="solar-hero-card">
        <svg
          className="solar-residence-svg"
          role="img"
          viewBox="0 0 1180 500"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Residential solar dashboard scene with house and roof panels</title>
          <defs>
            <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#eff6ff" />
              <stop offset="58%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ecfccb" />
            </linearGradient>
            <linearGradient id="panelGradient" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#172554" />
              <stop offset="58%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="solarSoftShadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="16" floodColor="#0f172a" floodOpacity="0.18" stdDeviation="13" />
            </filter>
            <marker id="solarGreenArrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0 0 L8 4 L0 8 Z" fill="#22c55e" />
            </marker>
            <marker id="solarBatteryArrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0 0 L8 4 L0 8 Z" fill="#84cc16" />
            </marker>
            <marker id="solarGridArrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0 0 L8 4 L0 8 Z" fill="#38bdf8" />
            </marker>
          </defs>

          <rect className="solar-scene-bg" height="500" rx="26" width="1180" />
          <path className="solar-land" d="M40 454 C224 432 350 456 512 438 C694 416 790 442 948 424 C1028 416 1084 424 1142 442 V490 H40Z" />

          <path className="solar-flow-line solar-main-flow" d="M210 108 C322 108 398 126 492 148" />
          <path className="solar-flow-line house-load-flow" d="M594 300 C508 382 366 444 248 443" />
          <path className="solar-flow-line battery-flow" d="M780 190 C852 142 902 112 956 112" />
          <path className="solar-flow-line grid-flow" d="M922 443 C830 438 766 382 706 326" />

          <g className="solar-callout solar-callout-left" transform="translate(52 62)">
            <rect height="92" rx="18" width="158" />
            <text className="solar-callout-label" x="18" y="30">Solar now</text>
            <text className="solar-callout-value" x="18" y="62">3.8 kW</text>
            <text className="solar-callout-note" x="18" y="82">covering load</text>
          </g>

          <g className="solar-callout solar-callout-right" transform="translate(956 64)">
            <rect height="92" rx="18" width="158" />
            <circle className="battery-ring" cx="40" cy="50" r="24" />
            <text className="solar-callout-label" x="78" y="34">Battery</text>
            <text className="solar-callout-value compact" x="78" y="62">74%</text>
            <text className="solar-callout-note" x="78" y="82">charging</text>
          </g>

          <g className="solar-widget solar-widget-left" transform="translate(54 184)">
            <rect height="128" rx="20" width="184" />
            <circle className="solar-widget-ring" cx="48" cy="50" r="28" />
            <text className="solar-callout-label" x="92" y="38">Today</text>
            <text className="solar-callout-value compact" x="92" y="68">18.2</text>
            <text className="solar-callout-note" x="92" y="90">kWh yield</text>
            <polyline className="solar-widget-chart" points="20,108 50,96 82,102 114,78 148,66 170,48" />
          </g>

          <g className="solar-widget solar-widget-right" transform="translate(960 190)">
            <rect height="132" rx="20" width="154" />
            <circle className="solar-widget-ring" cx="77" cy="54" r="32" />
            <text className="solar-callout-label" x="38" y="106">Self use</text>
            <text className="solar-pill-value" x="61" y="126">76%</text>
          </g>

          <g className="solar-house-art" filter="url(#solarSoftShadow)" transform="translate(260 88) scale(0.82)">
            <path className="solar-roof-main" d="M96 170 L256 28 H565 L724 170 Z" />
            <path className="solar-roof-wing left" d="M0 248 L96 160 H258 L168 248 Z" />
            <path className="solar-roof-wing right" d="M530 248 L636 160 H784 L704 248 Z" />

            <g className="roof-panel-set" transform="translate(200 68)">
              <rect height="50" rx="3" width="150" />
              <path d="M37.5 0 V50 M75 0 V50 M112.5 0 V50 M0 25 H150" />
            </g>
            <g className="roof-panel-set" transform="translate(430 68)">
              <rect height="50" rx="3" width="150" />
              <path d="M37.5 0 V50 M75 0 V50 M112.5 0 V50 M0 25 H150" />
            </g>
            <g className="roof-panel-set" transform="translate(140 140)">
              <rect height="50" rx="3" width="150" />
              <path d="M37.5 0 V50 M75 0 V50 M112.5 0 V50 M0 25 H150" />
            </g>
            <g className="roof-panel-set" transform="translate(488 140)">
              <rect height="50" rx="3" width="150" />
              <path d="M37.5 0 V50 M75 0 V50 M112.5 0 V50 M0 25 H150" />
            </g>

            <rect className="solar-house-body main" height="226" rx="6" width="316" x="234" y="168" />
            <rect className="solar-house-body wing-left" height="146" rx="6" width="182" x="52" y="248" />
            <rect className="solar-house-body wing-right" height="146" rx="6" width="184" x="550" y="248" />
            <path className="front-gable" d="M284 168 L392 70 L500 168 Z" />

            <rect className="solar-window centre" height="68" width="64" x="360" y="202" />
            <rect className="solar-window left" height="64" width="62" x="114" y="292" />
            <rect className="solar-window right" height="64" width="62" x="610" y="292" />
            <rect className="solar-door" height="112" rx="4" width="58" x="365" y="282" />
            <circle className="door-knob" cx="412" cy="340" r="4" />
          </g>

          <g className="solar-tree" transform="translate(1016 332) scale(0.72)">
            <rect height="104" rx="8" width="24" x="34" y="86" />
            <circle cx="46" cy="70" r="44" />
            <circle cx="12" cy="94" r="34" />
            <circle cx="78" cy="100" r="36" />
          </g>

          <g className="solar-status-pill" transform="translate(72 418)">
            <rect height="50" rx="18" width="176" />
            <text className="solar-callout-label" x="18" y="22">House load</text>
            <text className="solar-pill-value" x="18" y="42">2.3 kW</text>
          </g>
          <g className="solar-status-pill" transform="translate(922 418)">
            <rect height="50" rx="18" width="176" />
            <text className="solar-callout-label" x="18" y="22">Grid import</text>
            <text className="solar-pill-value" x="18" y="42">0.4 kW</text>
          </g>
        </svg>
        <div className="solar-bottom-dock" aria-label="Solar quick status">
          {dockItems.map((item) => (
            <article key={item.label}>
              <i aria-hidden="true">{item.icon}</i>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="solar-status-row">
        {statusItems.map(([label, value]) => (
          <article key={label}>
            <i aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
