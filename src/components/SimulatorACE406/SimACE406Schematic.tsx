import React from 'react';
import './SimACE406Schematic.css';

interface SimACE406SchematicProps {
  isRunning: boolean;
  levelPv: number; // 0 to 100%
  levelSp: number; // 0 to 100%
  flowPv: number; // 0 to 100%
  flowSp: number; // 0 to 100% (from master OP)
  valveOp: number; // 0 to 100% (slave OP)
  masterAuto: boolean;
  slaveAuto: boolean;
}

export const SimACE406Schematic: React.FC<SimACE406SchematicProps> = ({
  isRunning,
  levelPv,
  levelSp,
  flowPv,
  flowSp,
  valveOp,
  masterAuto,
  slaveAuto,
}) => {
  const waterHeightPct = Math.min(100, Math.max(0, levelPv));

  return (
    <div className="sim406-schematic-card">
      <div className="sim406-schematic-header">
        <span className="schematic-title">Process & Instrumentation Diagram (Cascade Loop)</span>
        <span className="schematic-note">
          Primary (LIC): Level &rarr; Secondary (FIC): Flow &rarr; Valve (CV1)
        </span>
      </div>

      <div className="sim406-schematic-canvas-box">
        <svg
          className="sim406-svg"
          viewBox="0 0 540 340"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankWallGrad406" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="waterGrad406" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Background Card */}
          <rect x="0" y="0" width="540" height="340" fill="#0f172a" rx="8" />

          {/* Inflow Pipe from Pump to Tank */}
          <path
            d="M 40 50 L 260 50 L 260 75"
            stroke="#475569"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && valveOp > 0 && (
            <path
              d="M 40 50 L 260 50 L 260 75"
              stroke="#38bdf8"
              strokeWidth="6"
              fill="none"
              strokeDasharray="8 6"
              className="sim406-flow-dash"
            />
          )}

          {/* Flow Transmitter FT-101 (Secondary Loop Sensor) */}
          <g transform="translate(100, 32)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="18" y="14" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
              FT
            </text>
            <text x="18" y="24" fill="#38bdf8" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="18" y1="34" x2="18" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Control Valve CV-1 (Secondary Loop Actuator) */}
          <g transform="translate(160, 36)">
            <polygon points="0,5 24,25 0,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <polygon points="24,5 0,25 24,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <line x1="12" y1="5" x2="12" y2="-5" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="2" y="-12" width="20" height="7" fill="#64748b" rx="2" />
            <text x="12" y="-16" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
              CV1 ({valveOp.toFixed(1)}%)
            </text>
          </g>

          {/* Flow Indicator FI-1 (Rotameter) */}
          <g transform="translate(205, 30)">
            <rect x="0" y="8" width="16" height="24" fill="#334155" stroke="#94a3b8" rx="2" />
            <line x1="8" y1="12" x2="8" y2="28" stroke="#38bdf8" strokeWidth="2" />
            <text x="8" y="38" fill="#94a3b8" fontSize="8" textAnchor="middle">FI-1</text>
          </g>

          {/* Flow Controller FIC-101 (Secondary / Slave) */}
          <g transform="translate(130, 95)">
            <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#eab308" strokeWidth="2" />
            <text x="20" y="15" fill="#eab308" fontSize="9" textAnchor="middle" fontWeight="bold">
              FIC
            </text>
            <text x="20" y="26" fill="#eab308" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="20" y1="2" x2="20" y2="-27" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="38" y1="20" x2="42" y2="20" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Level Tank Body (Primary / Master Process) */}
          <rect
            x="220"
            y="70"
            width="150"
            height="180"
            rx="4"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad406)"
            strokeWidth="4"
          />

          {/* Water Column inside Tank */}
          <rect
            x="224"
            y={72 + (180 - 4) * (1 - waterHeightPct / 100)}
            width="142"
            height={(180 - 4) * (waterHeightPct / 100)}
            fill="url(#waterGrad406)"
          />

          {/* Water level ripple */}
          {isRunning && waterHeightPct > 0 && (
            <line
              x1="224"
              y1={72 + (180 - 4) * (1 - waterHeightPct / 100)}
              x2="366"
              y2={72 + (180 - 4) * (1 - waterHeightPct / 100)}
              stroke="#e0f2fe"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}

          {/* Scale Markings 0 - 100% */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const yPos = 72 + (180 - 4) * (1 - pct / 100);
            return (
              <g key={pct}>
                <line x1="366" y1={yPos} x2="374" y2={yPos} stroke="#94a3b8" strokeWidth="1.5" />
                <text x="378" y={yPos + 3} fill="#94a3b8" fontSize="8">
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Level Transmitter LT-101 (Primary Loop Sensor) */}
          <g transform="translate(415, 110)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="18" y="14" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
              LT
            </text>
            <text x="18" y="24" fill="#38bdf8" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="2" y1="18" x2="-40" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Level Controller LIC-101 (Primary / Master) */}
          <g transform="translate(415, 170)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <text x="18" y="14" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">
              LIC
            </text>
            <text x="18" y="24" fill="#10b981" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="18" y1="2" x2="18" y2="-26" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Cascade connection line from LIC output to FIC setpoint */}
            <path
              d="M 18 34 L 18 50 L -245 50 L -245 -40"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              fill="none"
            />
            <text x="-120" y="45" fill="#10b981" fontSize="8" textAnchor="middle">
              Cascade Setpoint SP2 = OP1 ({flowSp.toFixed(1)}%)
            </text>
          </g>

          {/* Outflow Drain */}
          <path
            d="M 295 250 L 295 295 L 140 295"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {waterHeightPct > 0 && (
            <path
              d="M 295 250 L 295 295 L 140 295"
              stroke="#38bdf8"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim406-flow-dash"
            />
          )}

          {/* Drain Valve */}
          <g transform="translate(210, 285)">
            <polygon points="0,5 18,20 0,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <polygon points="18,5 0,20 18,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <text x="9" y="30" fill="#94a3b8" fontSize="8" textAnchor="middle">Outflow</text>
          </g>

          {/* Sump Tank & Pump */}
          <rect x="40" y="275" width="80" height="40" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="3" />
          <text x="80" y="300" fill="#94a3b8" fontSize="9" textAnchor="middle">Sump Tank</text>

          {/* Digital Telemetry HUD */}
          <g transform="translate(15, 95)">
            <rect x="0" y="0" width="105" height="135" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" rx="4" />
            <text x="8" y="16" fill="#10b981" fontSize="10" fontWeight="bold">PRIMARY (LEVEL)</text>
            <text x="8" y="32" fill="#94a3b8" fontSize="9">Mode: {masterAuto ? 'AUTO' : 'MANUAL'}</text>
            <text x="8" y="46" fill="#94a3b8" fontSize="9">SP1: {levelSp.toFixed(1)}%</text>
            <text x="8" y="60" fill="#38bdf8" fontSize="10" fontWeight="bold">PV1: {levelPv.toFixed(1)}%</text>

            <line x1="4" y1="70" x2="101" y2="70" stroke="#334155" />

            <text x="8" y="85" fill="#eab308" fontSize="10" fontWeight="bold">SECONDARY (FLOW)</text>
            <text x="8" y="100" fill="#94a3b8" fontSize="9">Mode: {slaveAuto ? 'AUTO' : 'MANUAL'}</text>
            <text x="8" y="114" fill="#94a3b8" fontSize="9">SP2: {flowSp.toFixed(1)}%</text>
            <text x="8" y="128" fill="#38bdf8" fontSize="10" fontWeight="bold">PV2: {flowPv.toFixed(1)}%</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
