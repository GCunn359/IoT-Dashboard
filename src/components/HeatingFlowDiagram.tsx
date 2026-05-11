const immersionOn = false;

const radiators = [0, 1, 2];

export function HeatingFlowDiagram() {
  return (
    <section className="heating-flow-panel" aria-label="Heating system overview">
      <div className="heating-flow-header">
        <div>
          <p>Heating topology</p>
          <h2>Gas boiler, hot water cylinder and radiator circuits</h2>
        </div>
        <span>Anttory WiFi MCB {immersionOn ? "on" : "off"}</span>
      </div>

      <div className="heating-schematic">
        <svg
          className="heating-schematic-svg reference-style"
          role="img"
          viewBox="0 0 1120 430"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>
            Heating schematic showing a gas boiler feeding the hot water
            cylinder and radiator circuit with Anttory WiFi immersion MCB
          </title>
          <defs>
            <linearGradient id="boiler-shell" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>
            <linearGradient id="cylinder-fill" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="52%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#dbe3ea" />
            </linearGradient>
            <filter id="soft-device-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" floodColor="#0f172a" floodOpacity="0.14" stdDeviation="10" />
            </filter>
          </defs>

          <rect className="schematic-paper" height="430" rx="18" width="1120" />

          <path className="pipe heating-flow" d="M502 170 H620 V116 H805" />
          <path className="pipe heating-flow" d="M502 236 H620 V340 H805" />
          <path className="pipe heating-flow" d="M805 116 V340" />
          <path className="pipe heating-flow" d="M405 236 H228" />
          <path className="pipe heating-return" d="M996 116 H1050 V340 H228" />
          <path className="pipe cylinder-return" d="M228 365 H405" />
          <path className="pipe hot-water-out" d="M192 118 V82" />

          <g className="hot-water-cylinder-large" filter="url(#soft-device-shadow)" transform="translate(70 118) scale(0.78)">
            <path className="large-cylinder-shell" d="M58 0 H146 C179 0 204 32 204 74 V286 C204 328 179 360 146 360 H58 C25 360 0 328 0 286 V74 C0 32 25 0 58 0Z" />
            <path className="large-cylinder-highlight" d="M58 8 H96 V352 H58 C30 352 10 324 10 286 V74 C10 36 30 8 58 8Z" />
            <circle className="cylinder-port" cx="176" cy="84" r="9" />
            <circle className="cylinder-port" cx="176" cy="242" r="9" />
            <circle className="dual-stat" cx="104" cy="238" r="18" />
            <path className={`immersion-element ${immersionOn ? "on" : "off"}`} d="M58 176 C82 156 112 196 142 174" />
            <path className={`immersion-element secondary ${immersionOn ? "on" : "off"}`} d="M64 197 C86 181 111 209 134 194" />
            <rect className="anttory-mcb" height="42" rx="7" width="32" x="145" y="153" />
            <text className="small-device-text" transform="translate(166 184) rotate(-90)">MCB</text>
          </g>

          <g className="boiler-drawing reference-boiler" filter="url(#soft-device-shadow)" transform="translate(405 112) scale(0.82)">
            <rect className="boiler-case tall" height="260" rx="18" width="118" />
            <rect className="boiler-brand" height="12" rx="2" width="22" x="48" y="118" />
            <rect className="boiler-panel" height="72" rx="10" width="76" x="21" y="144" />
            <circle className="boiler-dial" cx="59" cy="180" r="22" />
            <path className="boiler-flame-svg" d="M59 164 C78 183 72 205 59 205 C46 205 40 183 59 164Z" />
          </g>

          <g className="radiator-stack" transform="translate(805 70) scale(0.78)">
            {radiators.map((_, index) => (
              <g key={index} transform={`translate(0 ${index * 142})`}>
                <rect className="reference-radiator" height="94" rx="3" width="245" />
                {Array.from({ length: 18 }, (__, finIndex) => (
                  <line
                    className="reference-radiator-fin"
                    key={finIndex}
                    x1={12 + finIndex * 13}
                    x2={12 + finIndex * 13}
                    y1="8"
                    y2="86"
                  />
                ))}
              </g>
            ))}
          </g>

          <text className="diagram-label" x="144" y="76">Hot water outlet</text>
          <text className="diagram-label strong" x="70" y="52">Anttory WiFi MCB immersion: {immersionOn ? "ON" : "OFF"}</text>
          <text className="diagram-label strong" x="82" y="414">Hot water cylinder · 54°C</text>
          <text className="diagram-label strong" x="390" y="88">Gas boiler · Nest controlled</text>
          <text className="diagram-label strong" x="802" y="414">Radiator system · 19.5°C target</text>
          <text className="diagram-label" x="636" y="102">Heating flow</text>
          <text className="diagram-label" x="636" y="364">Return</text>
          <text className="diagram-label" x="272" y="220">Cylinder flow</text>
          <text className="diagram-label" x="258" y="388">Cylinder return</text>
        </svg>
      </div>
    </section>
  );
}
