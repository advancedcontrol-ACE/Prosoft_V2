import React from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimACE410Process.css';

interface SimACE410ProcessProps {
  isRunning: boolean;
  isPaused: boolean;
  pv: number;
  sp: number;
  onSpChange: (v: number) => void;
  op: number;
  error: number;
  dError: number;
  delCo: number;
  loadVal: number;
  onLoadValChange: (v: number) => void;
  onAddLoad: () => void;
  trendData: { time: number; sp: number; pv: number; op: number }[];
}

export const SimACE410Process: React.FC<SimACE410ProcessProps> = ({
  isRunning,
  isPaused,
  pv,
  sp,
  onSpChange,
  op,
  error,
  dError,
  delCo,
  loadVal,
  onLoadValChange,
  onAddLoad,
  trendData,
}) => {
  const waterHeightPct = Math.min(100, Math.max(0, pv));

  return (
    <div className="sim410-process-container">
      {/* Left Column: Tank Graphic & Fuzzy Telemetry Controls */}
      <div className="sim410-process-left">
        {/* Animated Process SVG */}
        <div className="sim410-tank-card">
          <svg className="sim410-svg" viewBox="0 0 380 260">
            <defs>
              <linearGradient id="tankWall410" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="10%" stopColor="#94a3b8" />
                <stop offset="90%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="waterGrad410" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#be185d" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="380" height="260" fill="#0f172a" rx="6" />

            {/* Inflow Pipe */}
            <path
              d="M 30 35 L 180 35 L 180 55"
              stroke="#475569"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {isRunning && op > 0 && (
              <path
                d="M 30 35 L 180 35 L 180 55"
                stroke="#ec4899"
                strokeWidth="4"
                fill="none"
                strokeDasharray="6 4"
                className="sim410-flow-dash"
              />
            )}

            {/* Control Valve */}
            <g transform="translate(90, 23)">
              <polygon points="0,5 20,20 0,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <polygon points="20,5 0,20 20,20" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <text x="10" y="-8" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold">
                CV1 ({op.toFixed(1)}%)
              </text>
            </g>

            {/* Tank Body */}
            <rect
              x="130"
              y="55"
              width="120"
              height="140"
              rx="4"
              fill="rgba(30, 41, 59, 0.7)"
              stroke="url(#tankWall410)"
              strokeWidth="3.5"
            />
            {/* Water Column */}
            <rect
              x="133"
              y={57 + 136 * (1 - waterHeightPct / 100)}
              width="114"
              height={136 * (waterHeightPct / 100)}
              fill="url(#waterGrad410)"
            />

            {/* Scale Markings */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const yPos = 57 + 136 * (1 - pct / 100);
              return (
                <g key={pct}>
                  <line x1="247" y1={yPos} x2="253" y2={yPos} stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="256" y={yPos + 3} fill="#94a3b8" fontSize="8">
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Level Sensor LT-1 */}
            <g transform="translate(280, 95)">
              <circle cx="16" cy="16" r="14" fill="#1e293b" stroke="#ec4899" strokeWidth="2" />
              <text x="16" y="14" fill="#ec4899" fontSize="8" textAnchor="middle" fontWeight="bold">LT</text>
              <text x="16" y="22" fill="#ec4899" fontSize="7" textAnchor="middle">101</text>
              <line x1="2" y1="16" x2="-28" y2="16" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 3" />
            </g>

            {/* Drain Pipe */}
            <path
              d="M 190 195 L 190 230 L 70 230"
              stroke="#475569"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            {waterHeightPct > 0 && (
              <path
                d="M 190 195 L 190 230 L 70 230"
                stroke="#ec4899"
                strokeWidth="4"
                fill="none"
                strokeDasharray="5 3"
                className="sim410-flow-dash"
              />
            )}

            {/* Sump Tank */}
            <rect x="20" y="215" width="60" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1.5" rx="2" />
            <text x="50" y="234" fill="#94a3b8" fontSize="8" textAnchor="middle">Sump</text>

            {/* Live Readout */}
            <g transform="translate(15, 75)">
              <rect x="0" y="0" width="85" height="90" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" rx="3" />
              <text x="6" y="14" fill="#ec4899" fontSize="8" fontWeight="bold">FUZZY INFERENCE</text>
              <text x="6" y="28" fill="#94a3b8" fontSize="8">Error (e):</text>
              <text x="6" y="38" fill="#f8fafc" fontSize="9" fontWeight="bold">{error.toFixed(2)} cm</text>
              <text x="6" y="50" fill="#94a3b8" fontSize="8">de/dt:</text>
              <text x="6" y="60" fill="#f8fafc" fontSize="9" fontWeight="bold">{dError.toFixed(2)} cm/s</text>
              <text x="6" y="72" fill="#94a3b8" fontSize="8">&Delta;CO:</text>
              <text x="6" y="82" fill="#ec4899" fontSize="9" fontWeight="bold">{delCo.toFixed(2)}%</text>
            </g>
          </svg>
        </div>

        {/* Setpoint & Load Controls */}
        <div className="sim410-controls-card">
          <SimACE401Slider
            label="Level Setpoint SP (%)"
            min={0}
            max={100}
            step={1}
            ticks={[0, 25, 50, 75, 100]}
            value={sp}
            onChange={onSpChange}
            enabled={isRunning}
          />

          <div className="sim410-load-block">
            <span className="load-title">Load Disturbance (%):</span>
            <div className="load-row">
              <input
                type="number"
                className="load-input"
                value={loadVal}
                min={-50}
                max={50}
                onChange={(e) => onLoadValChange(parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                className="add-load-btn"
                onClick={onAddLoad}
                disabled={!isRunning}
              >
                Add Load
              </button>
            </div>
            <span className="live-pv-text">
              Measured PV: <strong>{pv.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Live Waveform Trend Graph */}
      <div className="sim410-process-right">
        <TrendGraph data={trendData} isHold={isPaused} />
      </div>
    </div>
  );
};
