import React from 'react';
import './SimACE409Schematic.css';

interface SimACE409SchematicProps {
  isRunning: boolean;
  tank1Pv: number; // 0 to 100%
  tank2Pv: number; // 0 to 100% (Controlled)
  sp: number; // Setpoint for Tank 2
  valveOp: number; // CV1 Output
}

export const SimACE409Schematic: React.FC<SimACE409SchematicProps> = ({
  isRunning,
  tank1Pv,
  tank2Pv,
  sp,
  valveOp,
}) => {
  const h1Pct = Math.min(100, Math.max(0, tank1Pv));
  const h2Pct = Math.min(100, Math.max(0, tank2Pv));

  return (
    <div className="sim409-schematic-card">
      <div className="sim409-schematic-header">
        <span className="schematic-title">P&ID Diagram: Two-Tank Non-Interacting Level System</span>
        <span className="schematic-note">
          Pump &rarr; Valve (CV1) &rarr; Tank 1 (Lag 1) &rarr; Tank 2 (Lag 2, Controlled) &rarr; Sump
        </span>
      </div>

      <div className="sim409-schematic-canvas-box">
        <svg
          className="sim409-svg"
          viewBox="0 0 540 330"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankWallGrad409" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="waterGrad409" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect x="0" y="0" width="540" height="330" fill="#0f172a" rx="8" />

          {/* Supply Pipe from Pump to Tank 1 */}
          <path
            d="M 30 35 L 175 35 L 175 55"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && valveOp > 0 && (
            <path
              d="M 30 35 L 175 35 L 175 55"
              stroke="#38bdf8"
              strokeWidth="5"
              fill="none"
              strokeDasharray="8 6"
              className="sim409-flow-dash"
            />
          )}

          {/* Control Valve CV-1 */}
          <g transform="translate(80, 23)">
            <polygon points="0,5 20,20 0,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <polygon points="20,5 0,20 20,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <line x1="10" y1="5" x2="10" y2="-5" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="2" y="-10" width="16" height="5" fill="#64748b" rx="2" />
            <text x="10" y="-14" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
              CV1 ({valveOp.toFixed(1)}%)
            </text>
          </g>

          {/* TANK 1 (Upper-Left: Intermediate Non-Interacting Tank) */}
          <rect
            x="120"
            y="55"
            width="110"
            height="130"
            rx="3"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad409)"
            strokeWidth="3.5"
          />
          {/* Water Column inside Tank 1 */}
          <rect
            x="123"
            y={57 + 126 * (1 - h1Pct / 100)}
            width="104"
            height={126 * (h1Pct / 100)}
            fill="url(#waterGrad409)"
          />
          <text x="175" y="80" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
            Tank 1 (PV1)
          </text>
          <text x="175" y="95" fill="#38bdf8" fontSize="11" textAnchor="middle" fontWeight="bold">
            {tank1Pv.toFixed(1)}%
          </text>

          {/* LT-101 on Tank 1 */}
          <g transform="translate(70, 90)">
            <circle cx="16" cy="16" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="16" y="14" fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold">LT</text>
            <text x="16" y="22" fill="#38bdf8" fontSize="7" textAnchor="middle">101</text>
            <line x1="30" y1="16" x2="50" y2="16" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Cascade Gravity Flow Pipe from Tank 1 to Tank 2 */}
          <path
            d="M 175 185 L 175 220 L 320 220 L 320 135"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {h1Pct > 0 && (
            <path
              d="M 175 185 L 175 220 L 320 220 L 320 135"
              stroke="#38bdf8"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim409-flow-dash"
            />
          )}

          {/* TANK 2 (Lower-Right: Controlled Process Tank) */}
          <rect
            x="300"
            y="130"
            width="120"
            height="140"
            rx="3"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad409)"
            strokeWidth="4"
          />
          {/* Water Column inside Tank 2 */}
          <rect
            x="304"
            y={133 + 134 * (1 - h2Pct / 100)}
            width="112"
            height={134 * (h2Pct / 100)}
            fill="url(#waterGrad409)"
          />
          <text x="360" y="160" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
            Tank 2 (PV2 - Controlled)
          </text>
          <text x="360" y="175" fill="#10b981" fontSize="13" textAnchor="middle" fontWeight="bold">
            {tank2Pv.toFixed(1)}%
          </text>

          {/* LT-102 on Tank 2 */}
          <g transform="translate(440, 160)">
            <circle cx="16" cy="16" r="14" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <text x="16" y="14" fill="#10b981" fontSize="8" textAnchor="middle" fontWeight="bold">LT</text>
            <text x="16" y="22" fill="#10b981" fontSize="7" textAnchor="middle">102</text>
            <line x1="2" y1="16" x2="-20" y2="16" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Level Controller LIC-102 */}
          <g transform="translate(440, 90)">
            <circle cx="16" cy="16" r="14" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
            <text x="16" y="14" fill="#06b6d4" fontSize="8" textAnchor="middle" fontWeight="bold">LIC</text>
            <text x="16" y="22" fill="#06b6d4" fontSize="7" textAnchor="middle">102</text>
            {/* Feedback measurement line from LT-102 */}
            <line x1="16" y1="30" x2="16" y2="70" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Controller output line back to CV1 on Tank 1 inflow */}
            <path
              d="M 16 2 L 16 -50 L -350 -50 L -350 -67"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              fill="none"
            />
          </g>

          {/* Outflow Drain from Tank 2 */}
          <path
            d="M 360 270 L 360 305 L 140 305"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {h2Pct > 0 && (
            <path
              d="M 360 270 L 360 305 L 140 305"
              stroke="#38bdf8"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim409-flow-dash"
            />
          )}

          {/* Sump Tank & Pump */}
          <rect x="30" y="280" width="85" height="40" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="3" />
          <text x="72" y="305" fill="#94a3b8" fontSize="9" textAnchor="middle">Sump Tank</text>

          {/* HUD Badge */}
          <g transform="translate(15, 120)">
            <rect x="0" y="0" width="95" height="75" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" rx="4" />
            <text x="6" y="16" fill="#06b6d4" fontSize="9" fontWeight="bold">TANK 2 SETPOINT</text>
            <text x="6" y="30" fill="#f8fafc" fontSize="11" fontWeight="bold">{sp.toFixed(1)}%</text>

            <text x="6" y="48" fill="#10b981" fontSize="9" fontWeight="bold">CONTROL OP</text>
            <text x="6" y="62" fill="#38bdf8" fontSize="11" fontWeight="bold">{valveOp.toFixed(1)}%</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
