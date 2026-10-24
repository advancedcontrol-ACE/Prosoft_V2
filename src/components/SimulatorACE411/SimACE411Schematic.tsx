import React from 'react';
import './SimACE411Schematic.css';

interface SimACE411SchematicProps {
  isRunning: boolean;
  tank1Pv: number;
  tank2Pv: number;
  predPv: number;
  sp: number;
  valveOp: number;
  smithEnabled: boolean;
  deadTime: number;
}

export const SimACE411Schematic: React.FC<SimACE411SchematicProps> = ({
  isRunning,
  tank1Pv,
  tank2Pv,
  predPv,
  sp,
  valveOp,
  smithEnabled,
  deadTime,
}) => {
  const h1Pct = Math.min(100, Math.max(0, tank1Pv));
  const h2Pct = Math.min(100, Math.max(0, tank2Pv));

  return (
    <div className="sim411-schematic-card">
      <div className="sim411-schematic-header">
        <span className="schematic-title">P&ID & Smith Predictor Minor-Loop Architecture</span>
        <span className="schematic-note">
          SP = {sp.toFixed(1)} mm | Inter-Tank Dead Time &theta; = {deadTime.toFixed(1)} s | Smith State: {smithEnabled ? 'ACTIVE' : 'BYPASSED'}
        </span>
      </div>

      <div className="sim411-schematic-canvas-box">
        <svg
          className="sim411-svg"
          viewBox="0 0 540 330"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankWallGrad411" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="waterGrad411" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="540" height="330" fill="#0f172a" rx="8" />

          {/* Inflow Pipe from Pump */}
          <path
            d="M 30 35 L 160 35 L 160 55"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && valveOp > 0 && (
            <path
              d="M 30 35 L 160 35 L 160 55"
              stroke="#14b8a6"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim411-flow-dash"
            />
          )}

          {/* Control Valve CV-1 */}
          <g transform="translate(75, 23)">
            <polygon points="0,5 20,20 0,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <polygon points="20,5 0,20 20,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <text x="10" y="-8" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
              CV1 ({valveOp.toFixed(1)}%)
            </text>
          </g>

          {/* TANK 1 (Upper-Left) */}
          <rect
            x="110"
            y="55"
            width="100"
            height="120"
            rx="3"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad411)"
            strokeWidth="3.5"
          />
          <rect
            x="113"
            y={57 + 116 * (1 - h1Pct / 100)}
            width="94"
            height={116 * (h1Pct / 100)}
            fill="url(#waterGrad411)"
          />
          <text x="160" y="80" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
            Tank 1 (PV1)
          </text>
          <text x="160" y="95" fill="#14b8a6" fontSize="11" textAnchor="middle" fontWeight="bold">
            {tank1Pv.toFixed(1)}%
          </text>

          {/* Inter-tank Dead-Time Delay Coil Pipe */}
          <path
            d="M 160 175 L 160 205 L 195 205 L 195 190 L 225 190 L 225 215 L 260 215 L 260 200 L 290 200 L 290 225 L 340 225 L 340 145"
            stroke="#475569"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          {h1Pct > 0 && (
            <path
              d="M 160 175 L 160 205 L 195 205 L 195 190 L 225 190 L 225 215 L 260 215 L 260 200 L 290 200 L 290 225 L 340 225 L 340 145"
              stroke="#14b8a6"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray="5 3"
              className="sim411-flow-dash"
            />
          )}

          {/* Dead Time Callout Label */}
          <g transform="translate(205, 235)">
            <rect x="0" y="0" width="105" height="20" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" rx="3" />
            <text x="52" y="13" fill="#f59e0b" fontSize="8" textAnchor="middle" fontWeight="bold">
              Pipe Delay &theta; = {deadTime.toFixed(1)} s
            </text>
          </g>

          {/* TANK 2 (Lower-Right: Controlled Tank) */}
          <rect
            x="320"
            y="140"
            width="110"
            height="130"
            rx="3"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad411)"
            strokeWidth="3.5"
          />
          <rect
            x="323"
            y={142 + 126 * (1 - h2Pct / 100)}
            width="104"
            height={126 * (h2Pct / 100)}
            fill="url(#waterGrad411)"
          />
          <text x="375" y="165" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
            Tank 2 (PV2)
          </text>
          <text x="375" y="180" fill="#22c55e" fontSize="13" textAnchor="middle" fontWeight="bold">
            {tank2Pv.toFixed(1)}%
          </text>

          {/* Outflow Drain */}
          <path
            d="M 375 270 L 375 305 L 140 305"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {h2Pct > 0 && (
            <path
              d="M 375 270 L 375 305 L 140 305"
              stroke="#14b8a6"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim411-flow-dash"
            />
          )}

          {/* Sump Tank */}
          <rect x="30" y="280" width="85" height="40" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="3" />
          <text x="72" y="305" fill="#94a3b8" fontSize="9" textAnchor="middle">Sump Tank</text>

          {/* SMITH PREDICTOR BLOCK DIAGRAM OVERLAY */}
          <g transform="translate(425, 40)">
            <rect
              x="0"
              y="0"
              width="105"
              height="150"
              fill={smithEnabled ? 'rgba(13, 148, 136, 0.15)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={smithEnabled ? '#0d9488' : '#475569'}
              strokeWidth="1.5"
              rx="4"
            />
            <text x="52" y="16" fill={smithEnabled ? '#14b8a6' : '#94a3b8'} fontSize="8" textAnchor="middle" fontWeight="bold">
              SMITH PREDICTOR
            </text>

            <rect x="8" y="26" width="90" height="25" fill="#0f172a" stroke="#334155" rx="3" />
            <text x="52" y="42" fill="#38bdf8" fontSize="8" textAnchor="middle">
              G_m0(s) (No Delay)
            </text>

            <line x1="52" y1="51" x2="52" y2="65" stroke="#38bdf8" strokeWidth="1.5" />

            <rect x="8" y="65" width="90" height="25" fill="#0f172a" stroke="#334155" rx="3" />
            <text x="52" y="81" fill="#f59e0b" fontSize="8" textAnchor="middle">
              e^(-&theta;_m s) (Delay)
            </text>

            {/* Summing */}
            <circle cx="52" cy="115" r="10" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x="52" y="119" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">
              &Sigma;
            </text>
            <text x="52" y="140" fill={smithEnabled ? '#10b981' : '#64748b'} fontSize="8" textAnchor="middle">
              y_pred = {predPv.toFixed(1)}%
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
