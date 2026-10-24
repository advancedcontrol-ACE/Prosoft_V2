import React, { useState } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE409Parameters.css';

export interface NonInteractingLogEntry {
  time: string;
  timeS: number;
  sp: number;
  pv1: number;
  pv2: number;
  op: number;
}

interface SimACE409ParametersProps {
  isRunning: boolean;
  isAuto: boolean;
  onToggleAuto: () => void;
  sp: number;
  onSpChange: (v: number) => void;
  tank1Pv: number;
  tank2Pv: number;
  manualOp: number;
  onManualOpChange: (v: number) => void;
  pb: number;
  onPbChange: (v: number) => void;
  it: number;
  onItChange: (v: number) => void;
  dt: number;
  onDtChange: (v: number) => void;
  tank1Diameter: number;
  onTank1DiameterChange: (v: number) => void;
  tank2Diameter: number;
  onTank2DiameterChange: (v: number) => void;
  onAddLoad: () => void;
  loadVal: number;
  onLoadValChange: (v: number) => void;
  logEntries: NonInteractingLogEntry[];
}

export const SimACE409Parameters: React.FC<SimACE409ParametersProps> = ({
  isRunning,
  isAuto,
  onToggleAuto,
  sp,
  onSpChange,
  tank1Pv,
  tank2Pv,
  manualOp,
  onManualOpChange,
  pb,
  onPbChange,
  it,
  onItChange,
  dt,
  onDtChange,
  tank1Diameter,
  onTank1DiameterChange,
  tank2Diameter,
  onTank2DiameterChange,
  onAddLoad,
  loadVal,
  onLoadValChange,
  logEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'controller' | 'plant' | 'log'>('controller');

  return (
    <div className="sim409-params-card">
      {/* Tab Navigation */}
      <div className="sim409-tabs-header">
        <button
          type="button"
          className={`sim409-tab-btn ${activeTab === 'controller' ? 'active' : ''}`}
          onClick={() => setActiveTab('controller')}
        >
          Controller Parameters
        </button>
        <button
          type="button"
          className={`sim409-tab-btn ${activeTab === 'plant' ? 'active' : ''}`}
          onClick={() => setActiveTab('plant')}
        >
          Plant Dimensions
        </button>
        <button
          type="button"
          className={`sim409-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({logEntries.length} pts)
        </button>
      </div>

      {activeTab === 'controller' && (
        <div className="sim409-tab-content">
          <div className="sim409-mode-row">
            <span className="mode-label">Controller Mode:</span>
            <button
              type="button"
              className={`sim409-mode-btn ${isAuto ? 'auto' : 'man'}`}
              onClick={onToggleAuto}
            >
              {isAuto ? 'AUTO' : 'MANUAL'}
            </button>
            <span className="sim409-target-hint">
              Controlling Tank 2 Level via Inflow Valve CV1
            </span>
          </div>

          <div className="sim409-sliders-grid">
            <SimACE401Slider
              label="Tank 2 Setpoint SP (%)"
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
          <div className="sim409-load-row">
            <span className="load-label">Disturbance Load (%):</span>
            <input
              type="number"
              className="sim409-load-input"
              value={loadVal}
              min={-50}
              max={50}
              onChange={(e) => onLoadValChange(parseFloat(e.target.value) || 0)}
            />
            <button
              type="button"
              className="sim409-add-load-btn"
              onClick={onAddLoad}
              disabled={!isRunning}
            >
              Add Load
            </button>
            <span className="sim409-tele-hint">
              Tank 1: <strong>{tank1Pv.toFixed(1)}%</strong> &nbsp;|&nbsp; Tank 2: <strong>{tank2Pv.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      )}

      {activeTab === 'plant' && (
        <div className="sim409-tab-content">
          <div className="sim409-sliders-grid">
            <SimACE401Slider
              label="Tank 1 Diameter (cms)"
              min={5}
              max={40}
              step={0.5}
              ticks={[5, 15, 25, 40]}
              value={tank1Diameter}
              onChange={onTank1DiameterChange}
              enabled={!isRunning}
            />

            <SimACE401Slider
              label="Tank 2 Diameter (cms)"
              min={5}
              max={40}
              step={0.5}
              ticks={[5, 15, 25, 40]}
              value={tank2Diameter}
              onChange={onTank2DiameterChange}
              enabled={!isRunning}
            />
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="sim409-log-panel">
          <table className="sim409-log-table">
            <thead>
              <tr>
                <th>Time (s)</th>
                <th>SP (%)</th>
                <th>Tank 1 PV (%)</th>
                <th>Tank 2 PV (%)</th>
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
                    <td>{row.pv1.toFixed(1)}</td>
                    <td>{row.pv2.toFixed(1)}</td>
                    <td>{row.op.toFixed(1)}</td>
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
