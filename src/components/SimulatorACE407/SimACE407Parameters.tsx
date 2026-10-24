import React, { useState } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE407Parameters.css';

export interface FeedforwardLogEntry {
  time: string;
  timeS: number;
  sp: number;
  pv: number;
  opFb: number;
  opFf: number;
  opTot: number;
  outflowDist: number;
}

interface SimACE407ParametersProps {
  isRunning: boolean;
  isAuto: boolean;
  onToggleAuto: () => void;
  sp: number;
  onSpChange: (v: number) => void;
  pv: number;
  manualOp: number;
  onManualOpChange: (v: number) => void;
  pb: number;
  onPbChange: (v: number) => void;
  it: number;
  onItChange: (v: number) => void;
  dt: number;
  onDtChange: (v: number) => void;
  outflowDist: number;
  onOutflowDistChange: (v: number) => void;
  ffFactor: number;
  onFfFactorChange: (v: number) => void;
  onAddLoad: () => void;
  loadVal: number;
  onLoadValChange: (v: number) => void;
  logEntries: FeedforwardLogEntry[];
}

export const SimACE407Parameters: React.FC<SimACE407ParametersProps> = ({
  isRunning,
  isAuto,
  onToggleAuto,
  sp,
  onSpChange,
  pv,
  manualOp,
  onManualOpChange,
  pb,
  onPbChange,
  it,
  onItChange,
  dt,
  onDtChange,
  outflowDist,
  onOutflowDistChange,
  ffFactor,
  onFfFactorChange,
  onAddLoad,
  loadVal,
  onLoadValChange,
  logEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'log'>('parameters');

  return (
    <div className="sim407-params-card">
      {/* Tab Navigation */}
      <div className="sim407-tabs-header">
        <button
          type="button"
          className={`sim407-tab-btn ${activeTab === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveTab('parameters')}
        >
          Feedforward + Feedback Parameters
        </button>
        <button
          type="button"
          className={`sim407-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({logEntries.length} pts)
        </button>
      </div>

      {activeTab === 'parameters' ? (
        <div className="sim407-content-flex">
          {/* Top row: Mode toggle + Feedforward Factor + Disturbance Outflow */}
          <div className="sim407-top-controls">
            <div className="sim407-mode-block">
              <span className="control-label">Controller Mode:</span>
              <button
                type="button"
                className={`sim407-auto-btn ${isAuto ? 'auto' : 'man'}`}
                onClick={onToggleAuto}
              >
                {isAuto ? 'AUTO' : 'MANUAL'}
              </button>
            </div>

            <div className="sim407-ff-block">
              <span className="control-label">Feedforward Factor (0 = Pure Feedback):</span>
              <div className="sim407-btn-group">
                {[0.0, 0.5, 1.0, 1.5, 2.0].map((fac) => (
                  <button
                    key={fac}
                    type="button"
                    className={`sim407-fac-btn ${ffFactor === fac ? 'active' : ''}`}
                    onClick={() => onFfFactorChange(fac)}
                  >
                    {fac.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="sim407-dist-block">
              <span className="control-label">Step Disturbance Outflow:</span>
              <div className="sim407-btn-group">
                <button
                  type="button"
                  className={`sim407-dist-step-btn ${outflowDist === 40 ? 'active' : ''}`}
                  onClick={() => onOutflowDistChange(40)}
                >
                  40% (Nominal)
                </button>
                <button
                  type="button"
                  className={`sim407-dist-step-btn ${outflowDist === 60 ? 'active' : ''}`}
                  onClick={() => onOutflowDistChange(60)}
                >
                  60% (+20% Step)
                </button>
              </div>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="sim407-sliders-grid">
            <SimACE401Slider
              label="Level Setpoint SP (%)"
              min={0}
              max={100}
              step={1}
              ticks={[0, 25, 50, 75, 100]}
              value={sp}
              onChange={onSpChange}
              enabled={isAuto}
            />

            <SimACE401Slider
              label="Manual Output OP (%)"
              min={0}
              max={100}
              step={1}
              ticks={[0, 25, 50, 75, 100]}
              value={manualOp}
              onChange={onManualOpChange}
              enabled={!isAuto}
            />

            <SimACE401Slider
              label="Prop Band PB (%)"
              min={1}
              max={500}
              step={5}
              ticks={[1, 100, 250, 500]}
              value={pb}
              onChange={onPbChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Integral Time IT (s)"
              min={1}
              max={2000}
              step={10}
              ticks={[1, 500, 1000, 2000]}
              value={it}
              onChange={onItChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Derivative Time DT (s)"
              min={0}
              max={50}
              step={1}
              ticks={[0, 10, 25, 50]}
              value={dt}
              onChange={onDtChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Disturbance Outflow (%)"
              min={0}
              max={100}
              step={1}
              ticks={[0, 25, 50, 75, 100]}
              value={outflowDist}
              onChange={onOutflowDistChange}
              enabled={isRunning}
            />
          </div>

          {/* Load Disturbance */}
          <div className="sim407-load-row">
            <span className="load-label">Momentary Load (%):</span>
            <input
              type="number"
              className="sim407-load-input"
              value={loadVal}
              min={-50}
              max={50}
              onChange={(e) => onLoadValChange(parseFloat(e.target.value) || 0)}
            />
            <button
              type="button"
              className="sim407-add-load-btn"
              onClick={onAddLoad}
              disabled={!isRunning}
            >
              Add Load
            </button>
            <span className="sim407-pv-tag">
              Current Level PV: <strong>{pv.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="sim407-log-panel">
          <table className="sim407-log-table">
            <thead>
              <tr>
                <th>Time (s)</th>
                <th>SP (%)</th>
                <th>PV (%)</th>
                <th>OP Feedback (%)</th>
                <th>OP Feedforward (%)</th>
                <th>OP Total (%)</th>
                <th>Disturbance Outflow (%)</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-text">
                    Log table is empty. Click Run to begin recording telemetry.
                  </td>
                </tr>
              ) : (
                logEntries.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.timeS.toFixed(1)}</td>
                    <td>{row.sp.toFixed(1)}</td>
                    <td>{row.pv.toFixed(1)}</td>
                    <td>{row.opFb.toFixed(1)}</td>
                    <td>{row.opFf.toFixed(1)}</td>
                    <td>{row.opTot.toFixed(1)}</td>
                    <td>{row.outflowDist.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
