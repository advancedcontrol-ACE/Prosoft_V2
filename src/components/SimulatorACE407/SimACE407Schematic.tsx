import React from 'react';
import './SimACE407Schematic.css';

interface SimACE407SchematicProps {
  isRunning: boolean;
  levelPv: number;
  levelSp: number;
  totalOp: number;
  fbOp: number;
  ffOp: number;
  outflowDist: number;
  ffFactor: number;
}

export const SimACE407Schematic: React.FC<SimACE407SchematicProps> = ({
  isRunning,
  levelPv,
  levelSp,
  totalOp,
  fbOp,
  ffOp,
  outflowDist,
  ffFactor,
}) => {
  const waterHeightPct = Math.min(100, Math.max(0, levelPv));

  return (
    <div className="sim407-schematic-card">
      <div className="sim407-schematic-header">
        <span className="schematic-title">P&ID Diagram: Feedforward + Feedback Control</span>
        <span className="schematic-note">
          OP(total) = OP(Feedback) + OP(Feedforward) [{ffFactor.toFixed(1)} &times; &Delta;Flow]
        </span>
      </div>

      <div className="sim407-schematic-canvas-box">
        <svg
          className="sim407-svg"
          viewBox="0 0 540 330"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankWallGrad407" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="waterGrad407" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Background Card */}
          <rect x="0" y="0" width="540" height="330" fill="#0f172a" rx="8" />

          {/* Inflow Pipe from Pump */}
          <path
            d="M 40 45 L 240 45 L 240 70"
            stroke="#475569"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && totalOp > 0 && (
            <path
              d="M 40 45 L 240 45 L 240 70"
              stroke="#38bdf8"
              strokeWidth="6"
              fill="none"
              strokeDasharray="8 6"
              className="sim407-flow-dash"
            />
          )}

          {/* Control Valve CV1 (Actuated by OP_total) */}
          <g transform="translate(130, 31)">
            <polygon points="0,5 24,25 0,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <polygon points="24,5 0,25 24,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <line x1="12" y1="5" x2="12" y2="-5" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="2" y="-12" width="20" height="7" fill="#64748b" rx="2" />
            <text x="12" y="-16" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
              CV1 ({totalOp.toFixed(1)}%)
            </text>
          </g>

          {/* Summing Junction / Feedforward Adder */}
          <g transform="translate(130, 95)">
            <circle cx="12" cy="12" r="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="12" y="16" fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">
              +
            </text>
            <line x1="12" y1="2" x2="12" y2="-43" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="18" y="-18" fill="#ef4444" fontSize="8">OP_tot</text>
          </g>

          {/* Level Tank Body */}
          <rect
            x="200"
            y="65"
            width="150"
            height="180"
            rx="4"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad407)"
            strokeWidth="4"
          />

          {/* Water Column inside Tank */}
          <rect
            x="204"
            y={67 + (180 - 4) * (1 - waterHeightPct / 100)}
            width="142"
            height={(180 - 4) * (waterHeightPct / 100)}
            fill="url(#waterGrad407)"
          />

          {/* Level Transmitter LT-101 (Feedback Sensor) */}
          <g transform="translate(390, 100)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="18" y="14" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
              LT
            </text>
            <text x="18" y="24" fill="#38bdf8" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="2" y1="18" x2="-36" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Level Feedback Controller LIC-101 */}
          <g transform="translate(390, 160)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <text x="18" y="14" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">
              LIC
            </text>
            <text x="18" y="24" fill="#10b981" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="18" y1="2" x2="18" y2="-26" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Feedback signal to summer */}
            <path
              d="M 2 18 L -236 18 L -236 -43"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              fill="none"
            />
            <text x="-120" y="14" fill="#10b981" fontSize="8" textAnchor="middle">
              Feedback OP_FB ({fbOp.toFixed(1)}%)
            </text>
          </g>

          {/* Outflow Disturbance Pipe with FT-102 and Disturbance Valve */}
          <path
            d="M 275 245 L 275 285 L 490 285"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {outflowDist > 0 && (
            <path
              d="M 275 245 L 275 285 L 490 285"
              stroke="#f59e0b"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim407-flow-dash"
            />
          )}

          {/* Disturbance Flow Transmitter FT-102 */}
          <g transform="translate(320, 267)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <text x="18" y="14" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold">
              FT
            </text>
            <text x="18" y="24" fill="#f59e0b" fontSize="8" textAnchor="middle">
              102
            </text>
            <line x1="18" y1="2" x2="18" y2="-20" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Feedforward Compensator FY-102 */}
          <g transform="translate(320, 215)">
            <rect x="0" y="0" width="36" height="24" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" rx="3" />
            <text x="18" y="15" fill="#a855f7" fontSize="8" textAnchor="middle" fontWeight="bold">
              FFIC
            </text>
            {/* Feedforward signal line to summer */}
            <path
              d="M 0 12 L -178 12 L -178 -98"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              fill="none"
            />
            <text x="-90" y="8" fill="#a855f7" fontSize="8" textAnchor="middle">
              Feedforward OP_FF ({ffOp.toFixed(1)}%)
            </text>
          </g>

          {/* Disturbance Manual Valve HV-102 */}
          <g transform="translate(410, 275)">
            <polygon points="0,5 20,20 0,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <polygon points="20,5 0,20 20,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <text x="10" y="30" fill="#94a3b8" fontSize="8" textAnchor="middle">
              Load: {outflowDist.toFixed(0)}%
            </text>
          </g>

          {/* Sump Tank */}
          <rect x="30" y="265" width="80" height="40" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="3" />
          <text x="70" y="290" fill="#94a3b8" fontSize="9" textAnchor="middle">Sump Tank</text>

          {/* Digital Status HUD */}
          <g transform="translate(15, 125)">
            <rect x="0" y="0" width="100" height="100" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" rx="4" />
            <text x="8" y="16" fill="#10b981" fontSize="9" fontWeight="bold">CONTROLLERS</text>
            <text x="8" y="32" fill="#94a3b8" fontSize="8">Level SP: {levelSp.toFixed(1)}%</text>
            <text x="8" y="46" fill="#38bdf8" fontSize="8" fontWeight="bold">Level PV: {levelPv.toFixed(1)}%</text>
            <text x="8" y="60" fill="#10b981" fontSize="8">OP_FB: {fbOp.toFixed(1)}%</text>
            <text x="8" y="74" fill="#a855f7" fontSize="8">OP_FF: {ffOp.toFixed(1)}%</text>
            <text x="8" y="88" fill="#ef4444" fontSize="9" fontWeight="bold">OP_TOT: {totalOp.toFixed(1)}%</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
