import React from 'react';
import './SimACE408Schematic.css';

interface SimACE408SchematicProps {
  isRunning: boolean;
  wildFlowPv: number; // FT2 (%)
  contFlowPv: number; // FT1 (%)
  contFlowSp: number; // SP1 (%) = FT2 * RS
  ratioSet: number; // RS
  currentRatio: number; // RC = FT1 / FT2
  valveOp: number; // CV1 (%)
}

export const SimACE408Schematic: React.FC<SimACE408SchematicProps> = ({
  isRunning,
  wildFlowPv,
  contFlowPv,
  contFlowSp,
  ratioSet,
  currentRatio,
  valveOp,
}) => {
  return (
    <div className="sim408-schematic-card">
      <div className="sim408-schematic-header">
        <span className="schematic-title">P&ID Diagram: Dual-Stream Ratio Control</span>
        <span className="schematic-note">
          SP1 = Wild Flow (FT2) &times; Ratio Set ({ratioSet.toFixed(2)}) = {contFlowSp.toFixed(1)}%
        </span>
      </div>

      <div className="sim408-schematic-canvas-box">
        <svg
          className="sim408-svg"
          viewBox="0 0 540 330"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankWallGrad408" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="mixGrad408" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Background Card */}
          <rect x="0" y="0" width="540" height="330" fill="#0f172a" rx="8" />

          {/* STREAM 1 (TOP): Wild Flow Line (FT2) */}
          <path
            d="M 30 70 L 340 70 L 340 120"
            stroke="#475569"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && wildFlowPv > 0 && (
            <path
              d="M 30 70 L 340 70 L 340 120"
              stroke="#f59e0b"
              strokeWidth="5"
              fill="none"
              strokeDasharray="8 6"
              className="sim408-flow-dash"
            />
          )}

          {/* Wild Flow Manual Valve HV-102 */}
          <g transform="translate(100, 58)">
            <polygon points="0,5 20,20 0,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <polygon points="20,5 0,20 20,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <text x="10" y="-8" fill="#f59e0b" fontSize="8" textAnchor="middle" fontWeight="bold">
              Wild Valve ({wildFlowPv.toFixed(0)}%)
            </text>
          </g>

          {/* Wild Flow Transmitter FT-102 */}
          <g transform="translate(190, 52)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <text x="18" y="14" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold">
              FT
            </text>
            <text x="18" y="24" fill="#f59e0b" fontSize="8" textAnchor="middle">
              102
            </text>
            <line x1="18" y1="34" x2="18" y2="75" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Ratio Multiplier Unit FY-101 */}
          <g transform="translate(190, 127)">
            <rect x="0" y="0" width="36" height="26" fill="#1e293b" stroke="#ec4899" strokeWidth="1.5" rx="3" />
            <text x="18" y="12" fill="#ec4899" fontSize="8" textAnchor="middle" fontWeight="bold">
              RATIO
            </text>
            <text x="18" y="22" fill="#ec4899" fontSize="8" textAnchor="middle">
              &times; {ratioSet.toFixed(2)}
            </text>
            <line x1="18" y1="26" x2="18" y2="58" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="24" y="44" fill="#ec4899" fontSize="8">
              SP1 ({contFlowSp.toFixed(1)}%)
            </text>
          </g>

          {/* STREAM 2 (BOTTOM): Controlled Flow Line (FT1 + CV1) */}
          <path
            d="M 30 210 L 320 210 L 320 160"
            stroke="#475569"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && contFlowPv > 0 && (
            <path
              d="M 30 210 L 320 210 L 320 160"
              stroke="#38bdf8"
              strokeWidth="5"
              fill="none"
              strokeDasharray="8 6"
              className="sim408-flow-dash"
            />
          )}

          {/* Control Valve CV-1 */}
          <g transform="translate(100, 196)">
            <polygon points="0,5 24,25 0,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <polygon points="24,5 0,25 24,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <line x1="12" y1="5" x2="12" y2="-5" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="2" y="-12" width="20" height="7" fill="#64748b" rx="2" />
            <text x="12" y="-16" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
              CV1 ({valveOp.toFixed(1)}%)
            </text>
          </g>

          {/* Controlled Flow Transmitter FT-101 */}
          <g transform="translate(190, 185)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="18" y="14" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
              FT
            </text>
            <text x="18" y="24" fill="#38bdf8" fontSize="8" textAnchor="middle">
              101
            </text>
          </g>

          {/* Flow Controller FIC-101 */}
          <g transform="translate(120, 137)">
            <circle cx="18" cy="18" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="18" y="14" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
              FIC
            </text>
            <text x="18" y="24" fill="#38bdf8" fontSize="8" textAnchor="middle">
              101
            </text>
            <line x1="2" y1="18" x2="-8" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="-8" y1="18" x2="-8" y2="45" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Mixing Tank Vessel */}
          <rect
            x="300"
            y="110"
            width="130"
            height="140"
            rx="4"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad408)"
            strokeWidth="4"
          />

          {/* Mixed Fluid inside Tank */}
          <rect
            x="304"
            y={112 + 136 * 0.4}
            width="122"
            height={136 * 0.6}
            fill="url(#mixGrad408)"
          />

          <text x="365" y="195" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">
            Mixing Vessel
          </text>
          <text x="365" y="210" fill="#94a3b8" fontSize="8" textAnchor="middle">
            Ratio RC = {currentRatio.toFixed(2)}
          </text>

          {/* Outflow from Mixing Tank */}
          <path
            d="M 365 250 L 365 295 L 490 295"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && (
            <path
              d="M 365 250 L 365 295 L 490 295"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim408-flow-dash"
            />
          )}

          {/* Telemetry HUD Box */}
          <g transform="translate(15, 100)">
            <rect x="0" y="0" width="85" height="85" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" rx="4" />
            <text x="6" y="16" fill="#f59e0b" fontSize="8" fontWeight="bold">WILD FLOW (FT2)</text>
            <text x="6" y="28" fill="#f59e0b" fontSize="9">{wildFlowPv.toFixed(1)}%</text>

            <text x="6" y="44" fill="#38bdf8" fontSize="8" fontWeight="bold">CTRL FLOW (FT1)</text>
            <text x="6" y="56" fill="#38bdf8" fontSize="9">{contFlowPv.toFixed(1)}%</text>

            <text x="6" y="72" fill="#ec4899" fontSize="8" fontWeight="bold">RATIO (FT1/FT2)</text>
            <text x="6" y="82" fill="#ec4899" fontSize="9">{currentRatio.toFixed(2)}</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
