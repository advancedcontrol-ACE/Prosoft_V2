import React, { useState } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE411Parameters.css';

export interface SmithLogEntry {
  time: string;
  timeS: number;
  sp: number;
  tank2Pv: number;
  predPv: number;
  valveOp: number;
}

interface SimACE411ParametersProps {
  isRunning: boolean;
  isAuto: boolean;
  onToggleAuto: () => void;
  sp: number;
  onSpChange: (v: number) => void;
  tank2Pv: number;
  predPv: number;
  manualOp: number;
  onManualOpChange: (v: number) => void;
  pb: number;
  onPbChange: (v: number) => void;
  it: number;
  onItChange: (v: number) => void;
  dt: number;
  onDtChange: (v: number) => void;
  // Smith Predictor Model parameters
  modelKm: number;
  onModelKmChange: (v: number) => void;
  modelTau1: number;
  onModelTau1Change: (v: number) => void;
  modelTau2: number;
  onModelTau2Change: (v: number) => void;
  modelTheta: number;
  onModelThetaChange: (v: number) => void;
  deadTime: number;
  onDeadTimeChange: (v: number) => void;
  onAddLoad: () => void;
  loadVal: number;
  onLoadValChange: (v: number) => void;
  logEntries: SmithLogEntry[];
}

export const SimACE411Parameters: React.FC<SimACE411ParametersProps> = ({
  isRunning,
  isAuto,
  onToggleAuto,
  sp,
  onSpChange,
  tank2Pv,
  predPv,
  manualOp,
  onManualOpChange,
  pb,
  onPbChange,
  it,
  onItChange,
  dt,
  onDtChange,
  modelKm,
  onModelKmChange,
  modelTau1,
  onModelTau1Change,
  modelTau2,
  onModelTau2Change,
  modelTheta,
  onModelThetaChange,
  deadTime,
  onDeadTimeChange,
  onAddLoad,
  loadVal,
  onLoadValChange,
  logEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'controller' | 'smith' | 'log'>('controller');

  return (
    <div className="sim411-params-card">
      {/* Tab Navigation */}
      <div className="sim411-tabs-header">
        <button
          type="button"
          className={`sim411-tab-btn ${activeTab === 'controller' ? 'active' : ''}`}
          onClick={() => setActiveTab('controller')}
        >
          Primary Controller Parameters
        </button>
        <button
          type="button"
          className={`sim411-tab-btn ${activeTab === 'smith' ? 'active' : ''}`}
          onClick={() => setActiveTab('smith')}
        >
          Smith Model & Pipe Delay
        </button>
        <button
          type="button"
          className={`sim411-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({logEntries.length} pts)
        </button>
      </div>

      {activeTab === 'controller' && (
        <div className="sim411-tab-content">
          <div className="sim411-mode-row">
            <span className="mode-label">Controller Mode:</span>
            <button
              type="button"
              className={`sim411-mode-btn ${isAuto ? 'auto' : 'man'}`}
              onClick={onToggleAuto}
            >
              {isAuto ? 'AUTO' : 'MANUAL'}
            </button>
            <span className="sim411-info-badge">
              Feedback: <strong>Tank 2 Level PV ({tank2Pv.toFixed(1)}%)</strong>
            </span>
          </div>

          <div className="sim411-sliders-grid">
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
              label="Manual Valve OP (%)"
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
          </div>

          {/* Add Load Row */}
          <div className="sim411-load-row">
            <span className="load-label">Disturbance Load (%):</span>
            <input
              type="number"
              className="sim411-load-input"
              value={loadVal}
              min={-50}
              max={50}
              onChange={(e) => onLoadValChange(parseFloat(e.target.value) || 0)}
            />
            <button
              type="button"
              className="sim411-add-load-btn"
              onClick={onAddLoad}
              disabled={!isRunning}
            >
              Add Load
            </button>
            <span className="sim411-tele-hint">
              Predicted Delay-Free y_pred: <strong>{predPv.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      )}

      {activeTab === 'smith' && (
        <div className="sim411-tab-content">
          <div className="sim411-sliders-grid">
            <SimACE401Slider
              label="Internal Model Gain Km"
              min={0.2}
              max={3.0}
              step={0.1}
              ticks={[0.2, 1.0, 2.0, 3.0]}
              value={modelKm}
              decimals={1}
              onChange={onModelKmChange}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Model Tau 1 (s)"
              min={1}
              max={50}
              step={1}
              ticks={[1, 15, 30, 50]}
              value={modelTau1}
              onChange={onModelTau1Change}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Model Tau 2 (s)"
              min={1}
              max={50}
              step={1}
              ticks={[1, 15, 30, 50]}
              value={modelTau2}
              onChange={onModelTau2Change}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Model Delay Theta_m (s)"
              min={0}
              max={25}
              step={0.5}
              ticks={[0, 5, 15, 25]}
              value={modelTheta}
              onChange={onModelThetaChange}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Physical Pipe Delay (s)"
              min={0}
              max={25}
              step={0.5}
              ticks={[0, 5, 15, 25]}
              value={deadTime}
              onChange={onDeadTimeChange}
              enabled={!isRunning}
            />
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="sim411-log-panel">
          <table className="sim411-log-table">
            <thead>
              <tr>
                <th>Time (s)</th>
                <th>SP (%)</th>
                <th>Actual Tank 2 PV (%)</th>
                <th>Predicted Delay-Free PV (%)</th>
                <th>Valve OP (%)</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-text">
                    Log table is empty. Click Run to begin recording telemetry.
                  </td>
                </tr>
              ) : (
                logEntries.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.timeS.toFixed(1)}</td>
                    <td>{row.sp.toFixed(1)}</td>
                    <td>{row.tank2Pv.toFixed(1)}</td>
                    <td>{row.predPv.toFixed(1)}</td>
                    <td>{row.valveOp.toFixed(1)}</td>
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
