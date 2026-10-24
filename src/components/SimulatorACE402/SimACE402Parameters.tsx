import React from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import type { SimLogEntry } from '../SimulatorACE401/SimACE401Parameters';
import './SimACE402Parameters.css';

interface SimACE402ParametersProps {
  activeTab: 'pid' | 'log';
  onTabChange: (tab: 'pid' | 'log') => void;
  isRunning: boolean;

  // Controller parameters
  sp: number;
  onSpChange: (val: number) => void;
  pv: number;
  op: number;
  onOpChange: (val: number) => void;
  bias: number;
  onBiasChange: (val: number) => void;
  isBiasEnabled?: boolean;

  pb: number;
  onPbChange: (val: number) => void;
  it: number;
  onItChange: (val: number) => void;
  dt: number;
  onDtChange: (val: number) => void;

  pbContribution: number;
  itContribution: number;
  dtContribution: number;

  load: number;
  onLoadChange: (val: number) => void;
  onAddLoad: () => void;
  isAddLoadActive?: boolean;

  isAuto: boolean;
  onToggleAuto: () => void;

  logEntries: SimLogEntry[];
}

export const SimACE402Parameters: React.FC<SimACE402ParametersProps> = ({
  activeTab,
  onTabChange,
  isRunning,
  sp,
  onSpChange,
  pv,
  op,
  onOpChange,
  bias,
  onBiasChange,
  isBiasEnabled = false,
  pb,
  onPbChange,
  it,
  onItChange,
  dt,
  onDtChange,
  pbContribution,
  itContribution,
  dtContribution,
  load,
  onLoadChange,
  onAddLoad,
  isAddLoadActive = false,
  isAuto,
  onToggleAuto,
  logEntries,
}) => {
  return (
    <div className="sim402-tabs-card">
      {/* Tab Header Buttons */}
      <div className="sim402-tabs-header">
        <button
          type="button"
          className={`sim402-tab-btn ${activeTab === 'pid' ? 'active' : ''} ${!isRunning ? 'disabled' : ''}`}
          onClick={() => isRunning && onTabChange('pid')}
          disabled={!isRunning}
          title={!isRunning ? 'Click Run in toolbar to enable PID Controller Parameters' : 'PID Controller Parameters'}
        >
          PID Controller Parameters
        </button>
        <button
          type="button"
          className={`sim402-tab-btn ${activeTab === 'log' ? 'active' : ''} ${!isRunning ? 'disabled' : ''}`}
          onClick={() => isRunning && onTabChange('log')}
          disabled={!isRunning}
          title={!isRunning ? 'Click Run in toolbar to enable Log Table' : 'Log Table'}
        >
          Log Table
        </button>
      </div>

      {/* Tab Content Panel */}
      <div className="sim402-tab-content">
        {/* TAB 1: PID Controller Parameters */}
        {activeTab === 'pid' && (
          <div className="sim402-ctrl-layout">
            {/* Left Area: Sliders shifted up with full visibility */}
            <div className="sim402-ctrl-left-area">
              <div className="sim402-ctrl-sliders-grid">
                {/* Row 1: SP, PV, OP, Bias */}
                <div className="sim402-ctrl-row">
                  <SimACE401Slider
                    label="Set Point (%)"
                    min={0}
                    max={100}
                    step={1}
                    ticks={[0, 25, 50, 75, 100]}
                    value={sp}
                    decimals={0}
                    onChange={onSpChange}
                    width={104}
                    plateHeight={80}
                  />
                  <SimACE401Slider
                    label="Process Variable (%)"
                    min={0}
                    max={100}
                    step={0.1}
                    ticks={[0, 25, 50, 75, 100]}
                    value={pv}
                    decimals={1}
                    readOnly
                    width={104}
                    plateHeight={80}
                  />
                  <SimACE401Slider
                    label="Controller Output (%)"
                    min={0}
                    max={100}
                    step={0.1}
                    ticks={[0, 25, 50, 75, 100]}
                    value={op}
                    decimals={1}
                    readOnly={isAuto}
                    onChange={onOpChange}
                    width={104}
                    plateHeight={80}
                  />
                  <SimACE401Slider
                    label="Bias (%)"
                    min={0}
                    max={100}
                    step={0.5}
                    ticks={[0, 25, 50, 75, 100]}
                    value={bias}
                    decimals={1}
                    enabled={isBiasEnabled}
                    onChange={isBiasEnabled ? onBiasChange : undefined}
                    width={104}
                    plateHeight={80}
                  />
                </div>

                {/* Row 2: PB, IT, DT, Load */}
                <div className="sim402-ctrl-row">
                  <SimACE401Slider
                    label="Proportional Band (%)"
                    min={0}
                    max={400}
                    step={1}
                    ticks={[0, 100, 200, 300, 400]}
                    value={pb}
                    decimals={0}
                    onChange={onPbChange}
                    width={104}
                    plateHeight={80}
                  />
                  <SimACE401Slider
                    label="Integral Time (s)"
                    min={0}
                    max={1000}
                    step={1}
                    ticks={[0, 250, 500, 750, 1000]}
                    value={it}
                    decimals={0}
                    onChange={onItChange}
                    width={104}
                    plateHeight={80}
                  />
                  <SimACE401Slider
                    label="Derivative Time (s)"
                    min={0}
                    max={20}
                    step={0.1}
                    ticks={[0, 5, 10, 15, 20]}
                    value={dt}
                    decimals={1}
                    onChange={onDtChange}
                    width={104}
                    plateHeight={80}
                  />
                  <SimACE401Slider
                    label="Load (%)"
                    min={-100}
                    max={100}
                    step={1}
                    ticks={[-100, -50, 0, 50, 100]}
                    value={load}
                    decimals={0}
                    onChange={onLoadChange}
                    width={104}
                    plateHeight={80}
                  />
                </div>
              </div>
            </div>

            {/* Right Dedicated Column: Auto/Manual, Add Load, Contributions */}
            <div className="sim402-actions-contrib-col">
              <button
                type="button"
                className={`sim402-mode-btn ${isAuto ? 'mode-auto' : 'mode-manual'}`}
                onClick={onToggleAuto}
                title="Toggle Auto / Manual mode"
              >
                {isAuto ? 'Auto' : 'Manual'}
              </button>

              <button
                type="button"
                className={`sim402-add-load-btn ${isAddLoadActive ? 'active' : ''}`}
                onClick={onAddLoad}
                title="Add Load (%) disturbance"
              >
                Add Load
              </button>

              <div className="sim402-contrib-box-group">
                <span className="sim402-contrib-box-label">PB Contribution (%)</span>
                <div className="sim402-contrib-box-display">
                  <span>{pbContribution.toFixed(1)}</span>
                </div>
              </div>

              <div className="sim402-contrib-box-group">
                <span className="sim402-contrib-box-label">IT Contribution (%)</span>
                <div className="sim402-contrib-box-display">
                  <span>{itContribution.toFixed(1)}</span>
                </div>
              </div>

              <div className="sim402-contrib-box-group">
                <span className="sim402-contrib-box-label">DT Contribution (%)</span>
                <div className="sim402-contrib-box-display">
                  <span>{dtContribution.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Log Table */}
        {activeTab === 'log' && (
          <div className="sim402-log-table-wrapper">
            <table className="sim402-log-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Time s</th>
                  <th>SP %</th>
                  <th>PV %</th>
                  <th>OP %</th>
                  <th>PB %</th>
                  <th>IT s</th>
                  <th>DT s</th>
                </tr>
              </thead>
              <tbody>
                {logEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="sim402-no-log">
                      No log entries recorded. Turn Log ON and click Run to capture data.
                    </td>
                  </tr>
                ) : (
                  logEntries.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.time}</td>
                      <td>{row.timeS}</td>
                      <td>{row.sp.toFixed(1)}</td>
                      <td>{row.pv.toFixed(1)}</td>
                      <td>{row.op.toFixed(1)}</td>
                      <td>{row.pb.toFixed(1)}</td>
                      <td>{row.it.toFixed(1)}</td>
                      <td>{row.dt.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
