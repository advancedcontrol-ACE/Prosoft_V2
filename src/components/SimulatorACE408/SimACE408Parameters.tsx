import React, { useState } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE408Parameters.css';

export interface RatioLogEntry {
  time: string;
  timeS: number;
  wildFlow: number;
  ratioSet: number;
  contSp: number;
  contPv: number;
  valveOp: number;
  currentRatio: number;
}

interface SimACE408ParametersProps {
  isRunning: boolean;
  isAuto: boolean;
  onToggleAuto: () => void;
  ratioSet: number;
  onRatioSetChange: (v: number) => void;
  wildFlow: number;
  onWildFlowChange: (v: number) => void;
  contSp: number;
  contPv: number;
  manualOp: number;
  onManualOpChange: (v: number) => void;
  pb: number;
  onPbChange: (v: number) => void;
  it: number;
  onItChange: (v: number) => void;
  dt: number;
  onDtChange: (v: number) => void;
  currentRatio: number;
  logEntries: RatioLogEntry[];
}

export const SimACE408Parameters: React.FC<SimACE408ParametersProps> = ({
  isRunning,
  isAuto,
  onToggleAuto,
  ratioSet,
  onRatioSetChange,
  wildFlow,
  onWildFlowChange,
  contSp,
  contPv,
  manualOp,
  onManualOpChange,
  pb,
  onPbChange,
  it,
  onItChange,
  dt,
  onDtChange,
  currentRatio,
  logEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'log'>('parameters');

  return (
    <div className="sim408-params-card">
      {/* Tab Navigation */}
      <div className="sim408-tabs-header">
        <button
          type="button"
          className={`sim408-tab-btn ${activeTab === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveTab('parameters')}
        >
          Ratio Control Parameters
        </button>
        <button
          type="button"
          className={`sim408-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({logEntries.length} pts)
        </button>
      </div>

      {activeTab === 'parameters' ? (
        <div className="sim408-content-flex">
          {/* Top Quick Actions */}
          <div className="sim408-top-row">
            <div className="top-item">
              <span className="item-label">Controller Mode:</span>
              <button
                type="button"
                className={`sim408-auto-btn ${isAuto ? 'auto' : 'man'}`}
                onClick={onToggleAuto}
              >
                {isAuto ? 'AUTO' : 'MANUAL'}
              </button>
            </div>

            <div className="top-item">
              <span className="item-label">Ratio Set Presets:</span>
              <div className="btn-group">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`preset-btn ${Math.abs(ratioSet - r) < 0.01 ? 'active' : ''}`}
                    onClick={() => onRatioSetChange(r)}
                  >
                    {r.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="top-item">
              <span className="item-label">Step Wild Flow:</span>
              <div className="btn-group">
                <button
                  type="button"
                  className={`preset-btn ${wildFlow === 40 ? 'active' : ''}`}
                  onClick={() => onWildFlowChange(40)}
                >
                  40%
                </button>
                <button
                  type="button"
                  className={`preset-btn ${wildFlow === 60 ? 'active' : ''}`}
                  onClick={() => onWildFlowChange(60)}
                >
                  60%
                </button>
              </div>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="sim408-sliders-grid">
            <SimACE401Slider
              label="Ratio Set RS (FT1/FT2)"
              min={0.5}
              max={2.0}
              step={0.05}
              ticks={[0.5, 1.0, 1.5, 2.0]}
              value={ratioSet}
              decimals={2}
              onChange={onRatioSetChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Wild Flow FT2 (%)"
              min={10}
              max={100}
              step={1}
              ticks={[10, 25, 50, 75, 100]}
              value={wildFlow}
              onChange={onWildFlowChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Computed SP1 (%) [FT2*RS]"
              min={0}
              max={100}
              step={1}
              ticks={[0, 25, 50, 75, 100]}
              value={contSp}
              readOnly={true}
              enabled={false}
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
              max={200}
              step={1}
              ticks={[1, 50, 100, 200]}
              value={it}
              onChange={onItChange}
              enabled={isRunning}
            />

            <SimACE401Slider
              label="Derivative Time DT (s)"
              min={0}
              max={20}
              step={0.5}
              ticks={[0, 5, 10, 20]}
              value={dt}
              onChange={onDtChange}
              enabled={isRunning}
            />
          </div>

          {/* Telemetry Bar */}
          <div className="sim408-telemetry-bar">
            <span>Wild Flow FT2: <strong>{wildFlow.toFixed(1)}%</strong></span>
            <span>Controlled Flow FT1: <strong>{contPv.toFixed(1)}%</strong></span>
            <span>Target Ratio RS: <strong>{ratioSet.toFixed(2)}</strong></span>
            <span>Current Ratio RC: <strong className="highlight">{currentRatio.toFixed(2)}</strong></span>
          </div>
        </div>
      ) : (
        <div className="sim408-log-panel">
          <table className="sim408-log-table">
            <thead>
              <tr>
                <th>Time (s)</th>
                <th>Wild Flow (%)</th>
                <th>Ratio Set</th>
                <th>Controlled SP (%)</th>
                <th>Controlled PV (%)</th>
                <th>Valve OP (%)</th>
                <th>Current Ratio</th>
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
                    <td>{row.wildFlow.toFixed(1)}</td>
                    <td>{row.ratioSet.toFixed(2)}</td>
                    <td>{row.contSp.toFixed(1)}</td>
                    <td>{row.contPv.toFixed(1)}</td>
                    <td>{row.valveOp.toFixed(1)}</td>
                    <td>{row.currentRatio.toFixed(2)}</td>
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
