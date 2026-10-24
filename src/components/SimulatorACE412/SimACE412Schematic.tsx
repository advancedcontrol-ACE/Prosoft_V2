import React from 'react';
import './SimACE412Schematic.css';

interface SimACE412SchematicProps {
  isRunning: boolean;
  pv: number;
  sp: number;
  valveOp: number;
  gainK: number;
  tau: number;
  theta: number;
  filterLambda: number;
}

export const SimACE412Schematic: React.FC<SimACE412SchematicProps> = ({
  isRunning,
  pv,
  sp,
  valveOp,
  gainK,
  tau,
  theta,
  filterLambda,
}) => {
  const waterHeightPct = Math.min(100, Math.max(0, pv));

  return (
    <div className="sim412-schematic-card">
      <div className="sim412-schematic-header">
        <span className="schematic-title">P&ID Diagram & Internal Model Control (IMC) Structure</span>
        <span className="schematic-note">
          SP={sp.toFixed(1)}% | Model: K={gainK.toFixed(2)}, &tau;={tau.toFixed(1)}s, &theta;={theta.toFixed(1)}s | Filter &lambda;={filterLambda.toFixed(1)}s
        </span>
      </div>

      <div className="sim412-schematic-canvas-box">
        <svg
          className="sim412-svg"
          viewBox="0 0 540 330"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankWallGrad412" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="waterGrad412" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="540" height="330" fill="#0f172a" rx="8" />

          {/* Inflow Pipe */}
          <path
            d="M 30 40 L 160 40 L 160 65"
            stroke="#475569"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {isRunning && valveOp > 0 && (
            <path
              d="M 30 40 L 160 40 L 160 65"
              stroke="#8b5cf6"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6 4"
              className="sim412-flow-dash"
            />
          )}

          {/* Control Valve CV-1 */}
          <g transform="translate(75, 28)">
            <polygon points="0,5 20,20 0,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <polygon points="20,5 0,20 20,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <text x="10" y="-8" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
              CV1 ({valveOp.toFixed(1)}%)
            </text>
          </g>

          {/* Process Tank */}
          <rect
            x="110"
            y="65"
            width="110"
            height="140"
            rx="4"
            fill="rgba(30, 41, 59, 0.7)"
            stroke="url(#tankWallGrad412)"
            strokeWidth="3.5"
          />
          <rect
            x="113"
            y={67 + 136 * (1 - waterHeightPct / 100)}
            width="104"
            height={136 * (waterHeightPct / 100)}
            fill="url(#waterGrad412)"
          />
          <text x="165" y="90" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
            Process Tank
          </text>
          <text x="165" y="105" fill="#c4b5fd" fontSize="13" textAnchor="middle" fontWeight="bold">
            {pv.toFixed(1)}%
          </text>

          {/* Level Transmitter LT-101 */}
          <g transform="translate(235, 110)">
            <circle cx="16" cy="16" r="14" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
            <text x="16" y="14" fill="#8b5cf6" fontSize="8" textAnchor="middle" fontWeight="bold">LT</text>
            <text x="16" y="22" fill="#8b5cf6" fontSize="7" textAnchor="middle">101</text>
            <line x1="2" y1="16" x2="-15" y2="16" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Outflow Drain to Sump */}
          <path
            d="M 165 205 L 165 250 L 50 250"
            stroke="#475569"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          {waterHeightPct > 0 && (
            <path
              d="M 165 205 L 165 250 L 50 250"
              stroke="#8b5cf6"
              strokeWidth="4"
              fill="none"
              strokeDasharray="5 3"
              className="sim412-flow-dash"
            />
          )}

          {/* Sump Tank */}
          <rect x="20" y="235" width="60" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1.5" rx="2" />
          <text x="50" y="254" fill="#94a3b8" fontSize="8" textAnchor="middle">Sump</text>

          {/* IMC BLOCK DIAGRAM CARD */}
          <g transform="translate(265, 35)">
            <rect x="0" y="0" width="260" height="240" fill="rgba(15, 23, 42, 0.9)" stroke="#8b5cf6" strokeWidth="1.5" rx="6" />
            <text x="130" y="20" fill="#c4b5fd" fontSize="10" textAnchor="middle" fontWeight="bold">
              INTERNAL MODEL CONTROL ARCHITECTURE
            </text>

            {/* Summing Node 1 */}
            <circle cx="35" cy="70" r="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
            <text x="35" y="74" fill="#8b5cf6" fontSize="12" textAnchor="middle">&Sigma;</text>
            <text x="10" y="65" fill="#94a3b8" fontSize="8">SP</text>
            <line x1="5" y1="70" x2="25" y2="70" stroke="#94a3b8" strokeWidth="1.5" />

            {/* IMC Controller q(s) */}
            <rect x="65" y="55" width="85" height="30" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
            <text x="107" y="73" fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold">
              q(s) = Gp-⁻¹ &middot; f(s)
            </text>
            <line x1="45" y1="70" x2="65" y2="70" stroke="#8b5cf6" strokeWidth="1.5" />

            {/* Plant Gp(s) */}
            <rect x="180" y="55" width="65" height="30" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" rx="3" />
            <text x="212" y="73" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">
              Plant Gp(s)
            </text>
            <line x1="150" y1="70" x2="180" y2="70" stroke="#8b5cf6" strokeWidth="1.5" />

            {/* Internal Model G~p(s) */}
            <rect x="90" y="125" width="85" height="30" fill="#1e293b" stroke="#ec4899" strokeWidth="1.5" rx="3" />
            <text x="132" y="143" fill="#ec4899" fontSize="8" textAnchor="middle" fontWeight="bold">
              Model G~p(s)
            </text>
            <path d="M 160 70 L 160 140 L 175 140" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />

            {/* Disturbance Subtraction Node */}
            <circle cx="212" cy="180" r="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="212" y="184" fill="#f59e0b" fontSize="12" textAnchor="middle">&Sigma;</text>
            <line x1="212" y1="85" x2="212" y2="170" stroke="#10b981" strokeWidth="1.5" />
            <path d="M 90 140 L 70 140 L 70 180 L 202 180" stroke="#ec4899" strokeWidth="1.5" fill="none" />

            {/* Feedback signal d^(t) back to input summer */}
            <path d="M 212 190 L 212 215 L 35 215 L 35 80" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
            <text x="120" y="210" fill="#f59e0b" fontSize="8" textAnchor="middle">
              Estimated Disturbance d^(s) = y - y~
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
