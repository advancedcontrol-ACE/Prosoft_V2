import React from 'react';
import './SimACE402Schematic.css';

interface SimACE402SchematicProps {
  pv: number;
  sp: number;
  op: number;
  isRunning: boolean;
  modelName: string;
}

export const SimACE402Schematic: React.FC<SimACE402SchematicProps> = ({
  pv,
  sp,
  op,
  isRunning,
  modelName,
}) => {
  const safePv = Math.max(0, Math.min(100, isNaN(pv) ? 0 : pv));
  const safeSp = Math.max(0, Math.min(100, isNaN(sp) ? 0 : sp));
  const safeOp = Math.max(0, Math.min(100, isNaN(op) ? 0 : op));

  // Fluid level height inside tank (tank height is 110px in SVG, from y=140 to y=250)
  const fluidHeight = (safePv / 100) * 110;
  const fluidY = 250 - fluidHeight;

  return (
    <div className="sim402-schematic-card">
      <div className="sim402-schematic-header">
        <span className="sim402-schematic-title">Process Schematic</span>
        <span className="sim402-schematic-badge">{modelName}</span>
      </div>

      <div className="sim402-schematic-body">
        <svg
          viewBox="0 0 460 330"
          className="sim402-schematic-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="sim402WaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="sim402TankGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="10%" stopColor="#94a3b8" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="sim402PipeGradH" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="sim402PipeGradV" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Sump Tank at Bottom */}
          <rect x="30" y="270" width="380" height="46" rx="4" fill="url(#sim402TankGrad)" stroke="#1e293b" strokeWidth="2" />
          <rect x="35" y="278" width="370" height="34" rx="2" fill="url(#sim402WaterGrad)" />
          <text x="220" y="300" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="12" letterSpacing="0.5">
            Sump Tank
          </text>

          {/* Submersible Pump */}
          <ellipse cx="100" cy="292" rx="16" ry="14" fill="#0284c7" stroke="#0f172a" strokeWidth="1.5" />
          <polygon points="94,286 108,292 94,298" fill="#ffffff" />
          <text x="100" y="318" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">
            Pump
          </text>

          {/* Supply Piping: Pump -> Rotameter -> Control Valve -> Process Tank */}
          <path
            d="M 100 278 L 100 95 L 230 95 L 230 135"
            fill="none"
            stroke="url(#sim402PipeGradH)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated Water Flow Line in Pipe when Running */}
          {isRunning && safeOp > 0 && (
            <path
              d="M 100 278 L 100 95 L 230 95 L 230 135"
              fill="none"
              stroke="#0284c7"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="sim402-flow-dash"
            />
          )}

          {/* Rotameter on vertical rise */}
          <g transform="translate(86, 150)">
            <rect x="0" y="0" width="28" height="52" rx="3" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
            <polygon points="5,46 23,46 19,8 9,8" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
            {/* Float positioned by flow/OP */}
            <circle cx="14" cy={44 - (safeOp / 100) * 32} r="4" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <text x="32" y="28" fill="#cbd5e1" fontSize="10" fontWeight="600">Rotameter</text>
          </g>

          {/* Pneumatic Control Valve on Horizontal Pipe */}
          <g transform="translate(145, 75)">
            {/* Actuator Diaphragm Dome */}
            <path d="M 12 18 C 12 2, 28 2, 28 18 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="20" y1="18" x2="20" y2="28" stroke="#1e293b" strokeWidth="2.5" />
            {/* Valve Body Triangles */}
            <polygon points="8,24 8,36 32,24 32,36" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="20" cy="30" r="3" fill="#ea580c" />
            <text x="20" y="52" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">
              Control Valve ({safeOp.toFixed(0)}%)
            </text>
          </g>

          {/* I/P Converter connected above Valve */}
          <g transform="translate(185, 30)">
            <rect x="0" y="0" width="46" height="24" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <text x="23" y="12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">I / P</text>
            <text x="23" y="21" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="600">Converter</text>
            {/* Pneumatic Line to Valve */}
            <line x1="12" y1="24" x2="168" y2="75" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Level Indicating Controller (LIC) Symbol */}
          <g transform="translate(350, 48)">
            <circle cx="22" cy="22" r="22" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <line x1="0" y1="22" x2="44" y2="22" stroke="#475569" strokeWidth="1.5" />
            <text x="22" y="16" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">LIC</text>
            <text x="22" y="34" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">402</text>
            {/* Control Signal to I/P Converter */}
            <path d="M 0 22 C -60 22, -90 42, -119 42" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
          </g>

          {/* Process Tank */}
          <g transform="translate(260, 130)">
            {/* Tank Shell */}
            <rect x="0" y="0" width="100" height="120" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            {/* Water Inside Tank */}
            <rect
              x="3"
              y={fluidY - 130}
              width="94"
              height={fluidHeight}
              fill="url(#sim402WaterGrad)"
            />
            {/* Wave effect at top of water */}
            {fluidHeight > 2 && (
              <line
                x1="3"
                y1={fluidY - 130}
                x2="97"
                y2={fluidY - 130}
                stroke="#e0f2fe"
                strokeWidth="2"
              />
            )}
            <text x="50" y="60" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700" opacity="0.8">
              Process Tank
            </text>
            {/* SP Marker */}
            <line
              x1="0"
              y1={120 - (safeSp / 100) * 110 - 5}
              x2="100"
              y2={120 - (safeSp / 100) * 110 - 5}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </g>

          {/* Level Transmitter (LT1) */}
          <g transform="translate(372, 215)">
            <rect x="0" y="0" width="34" height="26" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x="17" y="16" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="700">LT1</text>
            {/* Impulse Line from Tank */}
            <line x1="-12" y1="13" x2="0" y2="13" stroke="#64748b" strokeWidth="3" />
            {/* Signal Wire to LIC */}
            <path d="M 17 0 L 17 -130 L 0 -145" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
          </g>

          {/* Digital Readout Badges */}
          <g transform="translate(260, 258)">
            <rect x="0" y="0" width="48" height="20" rx="3" fill="#022c22" stroke="#10b981" strokeWidth="1" />
            <text x="24" y="14" textAnchor="middle" fill="#00ff41" fontSize="10" fontWeight="700" fontFamily="Consolas, monospace">
              {safePv.toFixed(1)}%
            </text>
          </g>
          <g transform="translate(312, 258)">
            <rect x="0" y="0" width="48" height="20" rx="3" fill="#082f49" stroke="#38bdf8" strokeWidth="1" />
            <text x="24" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700" fontFamily="Consolas, monospace">
              {safeSp.toFixed(1)}%
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
