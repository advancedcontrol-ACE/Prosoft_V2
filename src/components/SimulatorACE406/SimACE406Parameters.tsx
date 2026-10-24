import React, { useState } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE406Parameters.css';

export interface CascadeLogEntry {
  time: string;
  timeS: number;
  sp1: number;
  pv1: number;
  op1: number;
  sp2: number;
  pv2: number;
  op2: number;
}

interface SimACE406ParametersProps {
  isRunning: boolean;
  // Primary (Master)
  masterAuto: boolean;
  onToggleMasterAuto: () => void;
  sp1: number;
  onSp1Change: (v: number) => void;
  pv1: number;
  op1: number;
  onOp1Change: (v: number) => void;
  pb1: number;
  onPb1Change: (v: number) => void;
  it1: number;
  onIt1Change: (v: number) => void;
  dt1: number;
  onDt1Change: (v: number) => void;
  onAddLoad: () => void;
  loadVal: number;
  onLoadValChange: (v: number) => void;
  // Secondary (Slave)
  slaveAuto: boolean;
  onToggleSlaveAuto: () => void;
  sp2: number;
  pv2: number;
  op2: number;
  onOp2Change: (v: number) => void;
  pb2: number;
  onPb2Change: (v: number) => void;
  it2: number;
  onIt2Change: (v: number) => void;
  dt2: number;
  onDt2Change: (v: number) => void;
  // Log
  logEntries: CascadeLogEntry[];
}

export const SimACE406Parameters: React.FC<SimACE406ParametersProps> = ({
  isRunning,
  masterAuto,
  onToggleMasterAuto,
  sp1,
  onSp1Change,
  pv1,
  op1,
  onOp1Change,
  pb1,
  onPb1Change,
  it1,
  onIt1Change,
  dt1,
  onDt1Change,
  onAddLoad,
  loadVal,
  onLoadValChange,
  slaveAuto,
  onToggleSlaveAuto,
  sp2,
  pv2,
  op2,
  onOp2Change,
  pb2,
  onPb2Change,
  it2,
  onIt2Change,
  dt2,
  onDt2Change,
  logEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'controllers' | 'log'>('controllers');

  return (
    <div className="sim406-params-card">
      {/* Tab Header */}
      <div className="sim406-tabs-header">
        <button
          type="button"
          className={`sim406-tab-btn ${activeTab === 'controllers' ? 'active' : ''}`}
          onClick={() => setActiveTab('controllers')}
        >
          Cascade Controllers (Primary & Secondary)
        </button>
        <button
          type="button"
          className={`sim406-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({logEntries.length} pts)
        </button>
      </div>

      {activeTab === 'controllers' ? (
        <div className="sim406-controllers-grid">
          {/* PRIMARY CONTROLLER (MASTER: LEVEL) */}
          <div className="sim406-loop-panel primary">
            <div className="loop-header">
              <span className="loop-badge primary">PRIMARY LOOP (LIC-101: LEVEL)</span>
              <button
                type="button"
                className={`mode-toggle-btn ${masterAuto ? 'auto' : 'man'}`}
                onClick={onToggleMasterAuto}
              >
                {masterAuto ? 'AUTO' : 'MANUAL'}
              </button>
            </div>

            <div className="sim406-sliders-flex">
              <SimACE401Slider
                label="Level Setpoint SP1 (%)"
                min={0}
                max={100}
                step={1}
                ticks={[0, 25, 50, 75, 100]}
                value={sp1}
                onChange={onSp1Change}
                enabled={masterAuto}
              />

              <SimACE401Slider
                label="Master OP1 (%) [Slave SP]"
                min={0}
                max={100}
                step={1}
                ticks={[0, 25, 50, 75, 100]}
                value={op1}
                onChange={onOp1Change}
                enabled={!masterAuto}
              />

              <SimACE401Slider
                label="Prop Band PB1 (%)"
                min={1}
                max={500}
                step={5}
                ticks={[1, 100, 250, 500]}
                value={pb1}
                onChange={onPb1Change}
                enabled={isRunning}
              />

              <SimACE401Slider
                label="Integral Time IT1 (s)"
                min={1}
                max={2000}
                step={10}
                ticks={[1, 500, 1000, 2000]}
                value={it1}
                onChange={onIt1Change}
                enabled={isRunning}
              />

              <SimACE401Slider
                label="Derivative Time DT1 (s)"
                min={0}
                max={50}
                step={1}
                ticks={[0, 10, 25, 50]}
                value={dt1}
                onChange={onDt1Change}
                enabled={isRunning}
              />
            </div>

            <div className="sim406-load-row">
              <span className="load-label">Load Disturbance (%):</span>
              <input
                type="number"
                className="sim406-load-input"
                value={loadVal}
                min={-50}
                max={50}
                onChange={(e) => onLoadValChange(parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                className="sim406-add-load-btn"
                onClick={onAddLoad}
                disabled={!isRunning}
              >
                Add Load
              </button>
            </div>
          </div>

          {/* SECONDARY CONTROLLER (SLAVE: FLOW) */}
          <div className="sim406-loop-panel secondary">
            <div className="loop-header">
              <span className="loop-badge secondary">SECONDARY LOOP (FIC-101: FLOW)</span>
              <button
                type="button"
                className={`mode-toggle-btn ${slaveAuto ? 'auto' : 'man'}`}
                onClick={onToggleSlaveAuto}
              >
                {slaveAuto ? 'AUTO' : 'MANUAL'}
              </button>
            </div>

            <div className="sim406-sliders-flex">
              <SimACE401Slider
                label="Cascade Flow SP2 (%)"
                min={0}
                max={100}
                step={1}
                ticks={[0, 25, 50, 75, 100]}
                value={sp2}
                readOnly={true}
                enabled={false}
              />

              <SimACE401Slider
                label="Valve Output OP2 (%)"
                min={0}
                max={100}
                step={1}
                ticks={[0, 25, 50, 75, 100]}
                value={op2}
                onChange={onOp2Change}
                enabled={!slaveAuto}
              />

              <SimACE401Slider
                label="Prop Band PB2 (%)"
                min={1}
                max={500}
                step={5}
                ticks={[1, 100, 250, 500]}
                value={pb2}
                onChange={onPb2Change}
                enabled={isRunning}
              />

              <SimACE401Slider
                label="Integral Time IT2 (s)"
                min={1}
                max={2000}
                step={10}
                ticks={[1, 500, 1000, 2000]}
                value={it2}
                onChange={onIt2Change}
                enabled={isRunning}
              />

              <SimACE401Slider
                label="Derivative Time DT2 (s)"
                min={0}
                max={50}
                step={1}
                ticks={[0, 10, 25, 50]}
                value={dt2}
                onChange={onDt2Change}
                enabled={isRunning}
              />
            </div>

            <div className="sim406-flow-readout">
              <span>Actual Flow PV2: <strong>{pv2.toFixed(1)}%</strong></span>
              <span>Actual Level PV1: <strong>{pv1.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="sim406-log-panel">
          <table className="sim406-log-table">
            <thead>
              <tr>
                <th>Time (s)</th>
                <th>SP1 (Level %)</th>
                <th>PV1 (Level %)</th>
                <th>OP1 (Master %)</th>
                <th>SP2 (Flow %)</th>
                <th>PV2 (Flow %)</th>
                <th>OP2 (Valve %)</th>
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
                    <td>{row.sp1.toFixed(1)}</td>
                    <td>{row.pv1.toFixed(1)}</td>
                    <td>{row.op1.toFixed(1)}</td>
                    <td>{row.sp2.toFixed(1)}</td>
                    <td>{row.pv2.toFixed(1)}</td>
                    <td>{row.op2.toFixed(1)}</td>
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
