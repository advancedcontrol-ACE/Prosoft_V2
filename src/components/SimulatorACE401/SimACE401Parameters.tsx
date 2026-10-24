import React, { useRef, useEffect } from 'react';
import { SimACE401Slider } from './SimACE401Slider';
import type { SimExperiment } from './SimACE401ExperimentCards';
import './SimACE401Parameters.css';

export interface SimLogEntry {
  time: string;
  timeS: number;
  sp: number;
  pv: number;
  op: number;
  pb: number;
  it: number;
  dt: number;
}

interface SimACE401ParametersProps {
  experiment: SimExperiment;
  isRunning: boolean;
  activeTab: 'plant' | 'controller' | 'log';
  onTabChange: (tab: 'plant' | 'controller' | 'log') => void;

  // Plant parameters
  tankDiameter: number;
  onTankDiameterChange: (val: number) => void;
  tankHeight: number;
  onTankHeightChange: (val: number) => void;
  steadyStateFlow: number;
  onSteadyStateFlowChange: (val: number) => void;
  maxInflow: number;
  onMaxInflowChange: (val: number) => void;
  timeLag: number;
  onTimeLagChange: (val: number) => void;

  // Controller parameters
  sp: number;
  onSpChange: (val: number) => void;
  pv: number;
  onPvManualChange?: (val: number) => void;
  constantPV?: boolean;
  op: number;
  onOpManualChange: (val: number) => void;
  load: number;
  onLoadChange: (val: number) => void;
  onAddLoad: () => void;
  isAddLoadActive?: boolean;
  bias: number;
  onBiasChange: (val: number) => void;

  pb: number;
  onPbChange: (val: number) => void;
  it: number;
  onItChange: (val: number) => void;
  dt: number;
  onDtChange: (val: number) => void;
  outFlowPercent: number;
  onOutFlowPercentChange?: (val: number) => void;
  constantOutflow?: boolean;
  hysteresis: number;
  onHysteresisChange: (val: number) => void;

  pbContribution: number;
  itContribution: number;
  dtContribution: number;

  // Log Table
  logEntries: SimLogEntry[];
}

export const SimACE401Parameters: React.FC<SimACE401ParametersProps> = ({
  experiment,
  isRunning,
  activeTab,
  onTabChange,
  tankDiameter,
  onTankDiameterChange,
  tankHeight,
  onTankHeightChange,
  steadyStateFlow,
  onSteadyStateFlowChange,
  maxInflow,
  onMaxInflowChange,
  timeLag,
  onTimeLagChange,
  sp,
  onSpChange,
  pv,
  onPvManualChange,
  constantPV = false,
  op,
  onOpManualChange,
  load,
  onLoadChange,
  onAddLoad,
  isAddLoadActive = false,
  bias,
  onBiasChange,
  pb,
  onPbChange,
  it,
  onItChange,
  dt,
  onDtChange,
  outFlowPercent,
  onOutFlowPercentChange,
  constantOutflow = false,
  hysteresis,
  onHysteresisChange,
  pbContribution,
  itContribution,
  dtContribution,
  logEntries,
}) => {
  const logTableWrapperRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll log table so slider moves along with newest entry at bottom
  useEffect(() => {
    if (activeTab === 'log' && logTableWrapperRef.current) {
      logTableWrapperRef.current.scrollTop = logTableWrapperRef.current.scrollHeight;
    }
  }, [logEntries.length, activeTab]);

  // Mode rules for slider enabled states per user specification:
  // - Except P mode, Bias is disabled (varies internally in PI & PID mode, constant in PD mode)
  const isPbEnabled = experiment !== 'onoff';
  const isItEnabled = experiment === 'pi' || experiment === 'pid';
  const isDtEnabled = experiment === 'pd' || experiment === 'pid';
  const isHysEnabled = experiment === 'onoff';
  const isBiasEnabled = experiment === 'p';

  return (
    <div className="sim401-tabs-card">
      {/* Tab Header Buttons */}
      <div className="sim401-tabs-header">
        <button
          type="button"
          className={`sim401-tab-btn ${activeTab === 'plant' ? 'active' : ''} ${isRunning ? 'disabled' : ''}`}
          onClick={() => !isRunning && onTabChange('plant')}
          disabled={isRunning}
          title={isRunning ? 'Plant parameters cannot be altered while simulation is running' : 'Plant Parameters'}
        >
          Plant Parameters
        </button>
        <button
          type="button"
          className={`sim401-tab-btn ${activeTab === 'controller' ? 'active' : ''} ${!isRunning ? 'disabled' : ''}`}
          onClick={() => isRunning && onTabChange('controller')}
          disabled={!isRunning}
          title={!isRunning ? 'Click Run in toolbar to enable Controller Parameters' : 'Controller Parameters'}
        >
          Controller Parameters
        </button>
        <button
          type="button"
          className={`sim401-tab-btn ${activeTab === 'log' ? 'active' : ''} ${!isRunning ? 'disabled' : ''}`}
          onClick={() => isRunning && onTabChange('log')}
          disabled={!isRunning}
          title={!isRunning ? 'Click Run in toolbar to enable Log Table' : 'Log Table'}
        >
          Log Table
        </button>
      </div>

      {/* Tab Content Panel */}
      <div className="sim401-tab-content">
        {/* TAB 1: Plant Parameters */}
        {activeTab === 'plant' && (
          <div className="sim401-plant-grid">
            <SimACE401Slider
              label="Tank Diameter (cms)"
              min={0}
              max={40}
              step={0.5}
              ticks={[0, 10, 20, 30, 40]}
              value={tankDiameter}
              decimals={1}
              onChange={onTankDiameterChange}
              width={128}
              plateHeight={125}
            />
            <SimACE401Slider
              label="Tank Height (cms)"
              min={0}
              max={200}
              step={1}
              ticks={[0, 50, 100, 150, 200]}
              value={tankHeight}
              decimals={0}
              onChange={onTankHeightChange}
              width={128}
              plateHeight={125}
            />
            <SimACE401Slider
              label={'Steady State Flow\n@50% of PV (LPH)'}
              min={0}
              max={100}
              step={1}
              ticks={[0, 25, 50, 75, 100]}
              value={steadyStateFlow}
              decimals={1}
              onChange={onSteadyStateFlowChange}
              width={145}
              plateHeight={125}
            />
            <SimACE401Slider
              label="Max. Inflow (LPH)"
              min={0}
              max={400}
              step={1}
              ticks={[0, 100, 200, 300, 400]}
              value={maxInflow}
              decimals={0}
              onChange={onMaxInflowChange}
              width={128}
              plateHeight={125}
            />
            <SimACE401Slider
              label="Time Lag (s)"
              min={0}
              max={10}
              step={1}
              ticks={[0, 2, 4, 6, 8, 10]}
              value={timeLag}
              decimals={0}
              onChange={onTimeLagChange}
              width={128}
              plateHeight={125}
            />
          </div>
        )}

        {/* TAB 2: Controller Parameters */}
        {activeTab === 'controller' && (
          <div className="sim401-ctrl-layout">
            {/* Left Sliders Grid in 2 Rows */}
            <div className="sim401-ctrl-sliders-grid">
              {/* Row 1: SP, PV, OP, Load, Bias */}
              <div className="sim401-ctrl-row">
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
                  readOnly={!constantPV}
                  onChange={constantPV ? onPvManualChange : undefined}
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
                  readOnly
                  onChange={onOpManualChange}
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

              {/* Row 2: PB, IT, DT, Out Flow, Hysteresis */}
              <div className="sim401-ctrl-row">
                <SimACE401Slider
                  label="PB %"
                  min={0}
                  max={400}
                  step={1}
                  ticks={[0, 100, 200, 300, 400]}
                  value={pb}
                  decimals={0}
                  enabled={isPbEnabled}
                  onChange={onPbChange}
                  width={104}
                  plateHeight={80}
                />
                <SimACE401Slider
                  label="IT s"
                  min={0}
                  max={1000}
                  step={1}
                  ticks={[0, 250, 500, 750, 1000]}
                  value={it}
                  decimals={0}
                  enabled={isItEnabled}
                  onChange={onItChange}
                  width={104}
                  plateHeight={80}
                />
                <SimACE401Slider
                  label="DT s"
                  min={0}
                  max={20}
                  step={0.1}
                  ticks={[0, 5, 10, 15, 20]}
                  value={dt}
                  decimals={1}
                  enabled={isDtEnabled}
                  onChange={onDtChange}
                  width={104}
                  plateHeight={80}
                />
                <SimACE401Slider
                  label="Out Flow (%)"
                  min={0}
                  max={100}
                  step={0.1}
                  ticks={[0, 25, 50, 75, 100]}
                  value={outFlowPercent}
                  decimals={1}
                  readOnly={!constantOutflow}
                  enabled={constantOutflow}
                  onChange={constantOutflow ? onOutFlowPercentChange : undefined}
                  width={104}
                  plateHeight={80}
                />
                <SimACE401Slider
                  label="Hystresis (%)"
                  min={0}
                  max={20}
                  step={0.5}
                  ticks={[0, 5, 10, 15, 20]}
                  value={hysteresis}
                  decimals={0}
                  enabled={isHysEnabled}
                  onChange={onHysteresisChange}
                  width={104}
                  plateHeight={80}
                />
              </div>
            </div>

            {/* Right Dedicated Column: Add Load Button + PB/IT/DT Contributions (Figure 2) */}
            <div className="sim401-actions-contrib-col">
              <button
                type="button"
                className={`sim401-add-load-btn ${isAddLoadActive ? 'active' : ''}`}
                onClick={onAddLoad}
                title="Add Load (%) to current PV"
              >
                Add Load
              </button>

              <div className="sim401-contrib-box-group">
                <span className="sim401-contrib-box-label">PB Contribution (%)</span>
                <div className="sim401-contrib-box-display">
                  <span>{pbContribution.toFixed(1)}</span>
                </div>
              </div>

              <div className="sim401-contrib-box-group">
                <span className="sim401-contrib-box-label">IT Contribution (%)</span>
                <div className="sim401-contrib-box-display">
                  <span>{itContribution.toFixed(1)}</span>
                </div>
              </div>

              <div className="sim401-contrib-box-group">
                <span className="sim401-contrib-box-label">DT Contribution (%)</span>
                <div className="sim401-contrib-box-display">
                  <span>{dtContribution.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Log Table */}
        {activeTab === 'log' && (
          <div className="sim401-log-table-wrapper" ref={logTableWrapperRef}>
            <table className="sim401-log-table">
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
                    <td colSpan={8} className="sim401-no-log">
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
