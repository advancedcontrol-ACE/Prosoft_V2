import React, { useState } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE412Parameters.css';

export interface ImcLogEntry {
  time: string;
  timeS: number;
  sp: number;
  pv: number;
  op: number;
  dist: number;
}

interface SimACE412ParametersProps {
  isRunning: boolean;
  isAuto: boolean;
  onToggleAuto: () => void;
  sp: number;
  onSpChange: (v: number) => void;
  pv: number;
  manualOp: number;
  onManualOpChange: (v: number) => void;
  // FOPDT Plant Model
  gainK: number;
  onGainKChange: (v: number) => void;
  tau: number;
  onTauChange: (v: number) => void;
  theta: number;
  onThetaChange: (v: number) => void;
  // IMC Filter
  filterLambda: number;
  onFilterLambdaChange: (v: number) => void;
  // Synthesized PID
  eqKc: number;
  eqTi: number;
  eqTd: number;
  onAddLoad: () => void;
  loadVal: number;
  onLoadValChange: (v: number) => void;
  logEntries: ImcLogEntry[];
}

export const SimACE412Parameters: React.FC<SimACE412ParametersProps> = ({
  isRunning,
  isAuto,
  onToggleAuto,
  sp,
  onSpChange,
  pv,
  manualOp,
  onManualOpChange,
  gainK,
  onGainKChange,
  tau,
  onTauChange,
  theta,
  onThetaChange,
  filterLambda,
  onFilterLambdaChange,
  eqKc,
  eqTi,
  eqTd,
  onAddLoad,
  loadVal,
  onLoadValChange,
  logEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'imc' | 'pid' | 'log'>('imc');

  const eqPb = eqKc > 0 ? 100 / eqKc : 999;

  return (
    <div className="sim412-params-card">
      {/* Tab Navigation */}
      <div className="sim412-tabs-header">
        <button
          type="button"
          className={`sim412-tab-btn ${activeTab === 'imc' ? 'active' : ''}`}
          onClick={() => setActiveTab('imc')}
        >
          IMC Filter & Plant Model
        </button>
        <button
          type="button"
          className={`sim412-tab-btn ${activeTab === 'pid' ? 'active' : ''}`}
          onClick={() => setActiveTab('pid')}
        >
          Equivalent PID Controller
        </button>
        <button
          type="button"
          className={`sim412-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({logEntries.length} pts)
        </button>
      </div>

      {activeTab === 'imc' && (
        <div className="sim412-tab-content">
          <div className="sim412-mode-row">
            <span className="mode-label">Mode:</span>
            <button
              type="button"
              className={`sim412-mode-btn ${isAuto ? 'auto' : 'man'}`}
              onClick={onToggleAuto}
            >
              {isAuto ? 'AUTO (IMC ACTIVE)' : 'MANUAL'}
            </button>
            <div className="sim412-imc-equation">
              <span>q(s) = [(&tau;s + 1) / K] &middot; [1 / (&lambda;s + 1)]</span>
            </div>
          </div>

          <div className="sim412-sliders-grid">
            <SimACE401Slider
              label="IMC Filter Lambda (s)"
              min={0.5}
              max={30}
              step={0.5}
              ticks={[0.5, 5, 15, 30]}
              value={filterLambda}
              onChange={onFilterLambdaChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Model Static Gain K"
              min={0.1}
              max={5.0}
              step={0.1}
              ticks={[0.1, 1.5, 3.0, 5.0]}
              value={gainK}
              decimals={1}
              onChange={onGainKChange}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Model Tau (s)"
              min={1}
              max={60}
              step={1}
              ticks={[1, 20, 40, 60]}
              value={tau}
              onChange={onTauChange}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Model Delay Theta (s)"
              min={0.1}
              max={20}
              step={0.5}
              ticks={[0.1, 5, 10, 20]}
              value={theta}
              onChange={onThetaChange}
              enabled={!isRunning}
            />

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

            {!isAuto && (
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
            )}
          </div>

          {/* Add Load Row */}
          <div className="sim412-load-row">
            <span className="load-label">Disturbance Load (%):</span>
            <input
              type="number"
              className="sim412-load-input"
              value={loadVal}
              min={-50}
              max={50}
              onChange={(e) => onLoadValChange(parseFloat(e.target.value) || 0)}
            />
            <button
              type="button"
              className="sim412-add-load-btn"
              onClick={onAddLoad}
              disabled={!isRunning}
            >
              Add Load
            </button>
            <span className="sim412-tele-hint">
              Level PV: <strong>{pv.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      )}

      {activeTab === 'pid' && (
        <div className="sim412-tab-content">
          <div className="sim412-pid-card">
            <h4 className="pid-card-title">Synthesized Direct Equivalent PID Parameters</h4>
            <div className="sim412-pid-metrics">
              <div className="metric-box">
                <span className="m-title">Equivalent Gain (Kc)</span>
                <span className="m-val">{eqKc.toFixed(3)}</span>
              </div>
              <div className="metric-box">
                <span className="m-title">Equivalent PB (%)</span>
                <span className="m-val">{eqPb.toFixed(1)}%</span>
              </div>
              <div className="metric-box">
                <span className="m-title">Integral Time (Ti, s)</span>
                <span className="m-val">{eqTi.toFixed(2)} s</span>
              </div>
              <div className="metric-box">
                <span className="m-title">Derivative Time (Td, s)</span>
                <span className="m-val">{eqTd.toFixed(2)} s</span>
              </div>
            </div>

            <div className="pid-formula-box">
              <span className="formula-line">Kc = (2&tau; + &theta;) / [2K(&lambda; + &theta;)]</span>
              <span className="formula-line">Ti = &tau; + &theta; / 2</span>
              <span className="formula-line">Td = &tau;&theta; / (2&tau; + &theta;)</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="sim412-log-panel">
          <table className="sim412-log-table">
            <thead>
              <tr>
                <th>Time (s)</th>
                <th>SP (%)</th>
                <th>PV (%)</th>
                <th>Valve OP (%)</th>
                <th>Disturbance</th>
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
                    <td>{row.pv.toFixed(1)}</td>
                    <td>{row.op.toFixed(1)}</td>
                    <td>{row.dist.toFixed(1)}</td>
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
