import React from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE403Schematic.css';

export type EstimationMethod = 'reaction' | 'classical' | 'twopoint';

interface SimACE403SchematicProps {
  method: EstimationMethod;
  onMethodChange: (m: EstimationMethod) => void;
  isRunning: boolean;
  pv: number;
  co: number;
  initialCo: number;
  onInitialCoChange: (v: number) => void;
  finalCo: number;
  onFinalCoChange: (v: number) => void;
  onApplyInitialStep: () => void;
  onApplyFinalStep: () => void;
  stepPhase: 'idle' | 'initial_running' | 'initial_steady' | 'final_running' | 'final_steady';
  tankDiameter: number;
  onTankDiameterChange: (v: number) => void;
  tankHeight: number;
  onTankHeightChange: (v: number) => void;
  maxInflow: number;
  onMaxInflowChange: (v: number) => void;
  steadyStateFlow: number;
  onSteadyStateFlowChange: (v: number) => void;
  timeLag: number;
  onTimeLagChange: (v: number) => void;
}

export const SimACE403Schematic: React.FC<SimACE403SchematicProps> = ({
  method,
  onMethodChange,
  isRunning,
  pv,
  co,
  initialCo,
  onInitialCoChange,
  finalCo,
  onFinalCoChange,
  onApplyInitialStep,
  onApplyFinalStep,
  stepPhase,
  tankDiameter,
  onTankDiameterChange,
  tankHeight,
  onTankHeightChange,
  maxInflow,
  onMaxInflowChange,
  steadyStateFlow,
  onSteadyStateFlowChange,
  timeLag,
  onTimeLagChange,
}) => {
  const waterHeightPct = Math.min(100, Math.max(0, (pv / (tankHeight || 50)) * 100));

  return (
    <div className="sim403-schematic-container">
      {/* Method Selection Ribbon */}
      <div className="sim403-method-selector">
        <span className="sim403-method-title">Estimation Method:</span>
        <button
          type="button"
          className={`sim403-method-btn ${method === 'reaction' ? 'active' : ''}`}
          onClick={() => !isRunning && onMethodChange('reaction')}
          disabled={isRunning}
        >
          1. Process Reaction Method
        </button>
        <button
          type="button"
          className={`sim403-method-btn ${method === 'classical' ? 'active' : ''}`}
          onClick={() => !isRunning && onMethodChange('classical')}
          disabled={isRunning}
        >
          2. Classical Method (63.2%)
        </button>
        <button
          type="button"
          className={`sim403-method-btn ${method === 'twopoint' ? 'active' : ''}`}
          onClick={() => !isRunning && onMethodChange('twopoint')}
          disabled={isRunning}
        >
          3. Two Point Method
        </button>
      </div>

      <div className="sim403-schematic-body">
        {/* Animated Process Graphic */}
        <div className="sim403-schematic-visual">
          <svg
            className="sim403-svg-canvas"
            viewBox="0 0 540 370"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="tankWallGrad403" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="10%" stopColor="#94a3b8" />
                <stop offset="90%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="waterGrad403" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Background Grid Accent */}
            <rect x="0" y="0" width="540" height="370" fill="#0f172a" rx="8" />

            {/* Inflow Supply Pipe */}
            <path
              d="M 40 40 L 220 40 L 220 70"
              stroke="#64748b"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            {isRunning && co > 0 && (
              <path
                d="M 40 40 L 220 40 L 220 70"
                stroke="#38bdf8"
                strokeWidth="6"
                fill="none"
                strokeDasharray="8 6"
                className="sim403-flow-anim"
              />
            )}

            {/* Control Valve */}
            <g transform="translate(110, 25)">
              <polygon points="0,5 24,25 0,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <polygon points="24,5 0,25 24,25" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <line x1="12" y1="5" x2="12" y2="-5" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="2" y="-12" width="20" height="7" fill="#64748b" rx="2" />
              <text x="12" y="-16" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">
                CV1 ({co.toFixed(1)}%)
              </text>
            </g>

            {/* Rotameter */}
            <g transform="translate(160, 20)">
              <rect x="0" y="8" width="16" height="24" fill="#334155" stroke="#94a3b8" rx="2" />
              <line x1="8" y1="12" x2="8" y2="28" stroke="#38bdf8" strokeWidth="2" />
              <text x="8" y="38" fill="#94a3b8" fontSize="8" textAnchor="middle">FI-1</text>
            </g>

            {/* Process Tank Outer */}
            <rect
              x="180"
              y="60"
              width="150"
              height="200"
              rx="4"
              fill="rgba(30, 41, 59, 0.7)"
              stroke="url(#tankWallGrad403)"
              strokeWidth="4"
            />

            {/* Water Column inside Tank */}
            <rect
              x="184"
              y={62 + (200 - 4) * (1 - waterHeightPct / 100)}
              width="142"
              height={(200 - 4) * (waterHeightPct / 100)}
              fill="url(#waterGrad403)"
            />

            {/* Water ripples on surface */}
            {isRunning && waterHeightPct > 0 && (
              <line
                x1="184"
                y1={62 + (200 - 4) * (1 - waterHeightPct / 100)}
                x2="326"
                y2={62 + (200 - 4) * (1 - waterHeightPct / 100)}
                stroke="#e0f2fe"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}

            {/* Tank Scale Markings */}
            {[0, 10, 20, 30, 40, 50].map((levelVal) => {
              const yPos = 62 + (200 - 4) * (1 - levelVal / 50);
              return (
                <g key={levelVal}>
                  <line x1="326" y1={yPos} x2="334" y2={yPos} stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="338" y={yPos + 3} fill="#94a3b8" fontSize="8">
                    {levelVal} cm
                  </text>
                </g>
              );
            })}

            {/* Level Transmitter LT1 */}
            <g transform="translate(370, 110)">
              <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="20" y="16" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                LT
              </text>
              <text x="20" y="27" fill="#38bdf8" fontSize="9" textAnchor="middle">
                101
              </text>
              <line x1="2" y1="20" x2="-40" y2="20" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
            </g>

            {/* Gravity Outflow Drain */}
            <path
              d="M 255 260 L 255 310 L 120 310"
              stroke="#64748b"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {waterHeightPct > 0 && (
              <path
                d="M 255 260 L 255 310 L 120 310"
                stroke="#38bdf8"
                strokeWidth="4"
                fill="none"
                strokeDasharray="6 4"
                className="sim403-flow-anim"
              />
            )}

            {/* Drain Valve */}
            <g transform="translate(190, 300)">
              <polygon points="0,5 18,20 0,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              <polygon points="18,5 0,20 18,20" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              <text x="9" y="32" fill="#94a3b8" fontSize="8" textAnchor="middle">Outflow</text>
            </g>

            {/* Sump Tank & Pump */}
            <rect x="40" y="290" width="80" height="45" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="3" />
            <text x="80" y="318" fill="#94a3b8" fontSize="9" textAnchor="middle">Sump Tank</text>

            {/* Live readout badge overlay */}
            <g transform="translate(20, 110)">
              <rect x="0" y="0" width="130" height="65" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" rx="4" />
              <text x="10" y="18" fill="#94a3b8" fontSize="10">Level PV:</text>
              <text x="120" y="18" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="end">
                {pv.toFixed(2)} cm
              </text>

              <text x="10" y="38" fill="#94a3b8" fontSize="10">Control OP:</text>
              <text x="120" y="38" fill="#f59e0b" fontSize="13" fontWeight="bold" textAnchor="end">
                {co.toFixed(1)} %
              </text>

              <text x="10" y="56" fill="#94a3b8" fontSize="10">Step Phase:</text>
              <text x="120" y="56" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="end">
                {stepPhase.replace('_', ' ').toUpperCase()}
              </text>
            </g>
          </svg>
        </div>

        {/* Experiment Controller & Step Input Controls */}
        <div className="sim403-controls-pane">
          <div className="sim403-card">
            <h3 className="sim403-card-title">Step Test Procedure</h3>
            <p className="sim403-instruction-text">
              1. Enter Initial CO (e.g. 20%), click <strong>Apply Step 1</strong>, then hit <strong>RUN</strong>. Wait for initial steady state.
              <br />
              2. Enter Final CO (e.g. 50%) and click <strong>Apply Step 2</strong>. Wait for new steady state.
              <br />
              3. Click <strong>STOP</strong> when PV stabilizes. Cursors will calculate FOPDT model parameters automatically.
            </p>

            <div className="sim403-step-row">
              <div className="sim403-step-input-group">
                <label className="sim403-label">Initial CO (%):</label>
                <div className="sim403-input-with-btn">
                  <input
                    type="number"
                    className="sim403-num-input"
                    value={initialCo}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => onInitialCoChange(Number(e.target.value))}
                    disabled={isRunning && stepPhase !== 'idle'}
                  />
                  <button
                    type="button"
                    className="sim403-btn-apply"
                    onClick={onApplyInitialStep}
                    disabled={!isRunning && stepPhase !== 'idle'}
                  >
                    Apply Step 1
                  </button>
                </div>
              </div>

              <div className="sim403-step-input-group">
                <label className="sim403-label">Final CO (%):</label>
                <div className="sim403-input-with-btn">
                  <input
                    type="number"
                    className="sim403-num-input"
                    value={finalCo}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => onFinalCoChange(Number(e.target.value))}
                    disabled={isRunning && (stepPhase === 'final_running' || stepPhase === 'final_steady')}
                  />
                  <button
                    type="button"
                    className="sim403-btn-apply"
                    onClick={onApplyFinalStep}
                    disabled={!isRunning || stepPhase === 'idle' || stepPhase === 'initial_running'}
                  >
                    Apply Step 2
                  </button>
                </div>
              </div>
            </div>

            <div className="sim403-status-box">
              <span className="sim403-status-label">Status:</span>
              <span className={`sim403-status-val ${stepPhase}`}>
                {stepPhase === 'idle' && 'Waiting to start...'}
                {stepPhase === 'initial_running' && 'Stabilizing at Initial CO...'}
                {stepPhase === 'initial_steady' && 'Initial Steady State achieved. Apply Final Step!'}
                {stepPhase === 'final_running' && 'Transient response underway...'}
                {stepPhase === 'final_steady' && 'Final Steady State achieved! Hit STOP to estimate.'}
              </span>
            </div>
          </div>

          {/* Plant Physical Parameters Sliders */}
          <div className="sim403-card">
            <h3 className="sim403-card-title">Plant Physical Parameters</h3>
            <div className="sim403-sliders-grid">
              <SimACE401Slider
                label="Tank Diameter (cms)"
                min={5}
                max={40}
                step={0.5}
                ticks={[5, 15, 25, 40]}
                value={tankDiameter}
                onChange={onTankDiameterChange}
                enabled={!isRunning}
              />
              <SimACE401Slider
                label="Tank Height (cms)"
                min={20}
                max={100}
                step={1}
                ticks={[20, 50, 75, 100]}
                value={tankHeight}
                onChange={onTankHeightChange}
                enabled={!isRunning}
              />
              <SimACE401Slider
                label="Max Inflow (LPH)"
                min={50}
                max={600}
                step={10}
                ticks={[50, 200, 400, 600]}
                value={maxInflow}
                onChange={onMaxInflowChange}
                enabled={!isRunning}
              />
              <SimACE401Slider
                label="Time Lag (s)"
                min={0}
                max={20}
                step={0.5}
                ticks={[0, 5, 10, 15, 20]}
                value={timeLag}
                onChange={onTimeLagChange}
                enabled={!isRunning}
              />
              <SimACE401Slider
                label="Steady State Flow @50% of PV (LPH)"
                min={10}
                max={300}
                step={5}
                ticks={[10, 100, 200, 300]}
                value={steadyStateFlow}
                onChange={onSteadyStateFlowChange}
                enabled={!isRunning}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
