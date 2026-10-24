import React, { useRef, useEffect } from 'react';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import type { SimLogEntry } from '../SimulatorACE401/SimACE401Parameters';
import './SimACE403Parameters.css';

interface SimACE403ParametersProps {
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
  op: number;
  load: number;
  onLoadChange: (val: number) => void;
  onAddLoad?: () => void;
  isAddLoadActive?: boolean;
  bias: number;
  onBiasChange: (val: number) => void;

  // Base nominal & adapted PID
  pb: number;
  onPbChange: (val: number) => void;
  it: number;
  onItChange: (val: number) => void;
  dt: number;
  onDtChange: (val: number) => void;
  effectivePb: number;
  effectiveIt: number;
  effectiveDt: number;
  isTrained: boolean;

  outFlowPercent: number;
  pbContribution?: number;
  itContribution?: number;
  dtContribution?: number;
  logEntries: SimLogEntry[];
  isValidationReady?: boolean;
  controlLogic?: 'neural-mpc' | 'ml-adaptive-pid' | 'direct-neural';
  mpcHorizon?: number;
  onMpcHorizonChange?: (val: number) => void;
  mpcWeight?: number;
  onMpcWeightChange?: (val: number) => void;
  mpcCost?: number;
  predictedPv?: number;
}

export const SimACE403Parameters: React.FC<SimACE403ParametersProps> = ({
  isRunning,
  activeTab,
  onTabChange,
  isValidationReady = false,
  controlLogic = 'neural-mpc',
  mpcHorizon = 15,
  onMpcHorizonChange,
  mpcWeight = 0.08,
  onMpcWeightChange,
  mpcCost = 0,
  predictedPv = 0,
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
  op,
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
  effectivePb,
  effectiveIt,
  effectiveDt,
  isTrained,
  outFlowPercent,
  pbContribution = 0,
  itContribution = 0,
  dtContribution = 0,
  logEntries,
}) => {
  const isPidBased = !isTrained || controlLogic === 'ml-adaptive-pid';
  const logTableWrapperRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll log table so slider moves along with newest entry at bottom
  useEffect(() => {
    if (activeTab === 'log' && logTableWrapperRef.current) {
      logTableWrapperRef.current.scrollTop = logTableWrapperRef.current.scrollHeight;
    }
  }, [logEntries.length, activeTab]);

  return (
    <div className="sim403-params-card">
      {/* ── Top Tabs Bar ─────────────────────────────────────────── */}
      <div className="sim403-params-tab-bar">
        <button
          type="button"
          className={`sim403-params-tab-btn ${activeTab === 'plant' ? 'active' : ''}`}
          disabled={isRunning}
          onClick={() => onTabChange('plant')}
          title={isRunning ? 'Plant parameters locked during run' : 'Plant Parameters'}
        >
          Plant Parameters
        </button>
        <button
          type="button"
          className={`sim403-params-tab-btn ${activeTab === 'controller' ? 'active' : ''}`}
          disabled={!isValidationReady}
          onClick={() => onTabChange('controller')}
          title={
            !isValidationReady
              ? 'Hit Model Validation first to enable Controller Parameters'
              : 'Controller Parameters'
          }
        >
          Controller Parameters
        </button>
        <button
          type="button"
          className={`sim403-params-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          disabled={!isValidationReady}
          onClick={() => onTabChange('log')}
          title={
            !isValidationReady
              ? 'Hit Model Validation first to enable Log Table'
              : 'Log Table'
          }
        >
          Log Table
        </button>
      </div>

      {/* ── Tab Content Area ─────────────────────────────────────── */}
      <div className="sim403-params-body">
        {/* TAB 1: Plant Parameters (Figure 1 Matching: Increased Size & Pushed to Top) */}
        {activeTab === 'plant' && (
          <div className="sim403-plant-sliders-grid">
            <SimACE401Slider
              label="Tank Diameter (cms)"
              min={0}
              max={40}
              step={0.5}
              ticks={[0, 10, 20, 30, 40]}
              value={tankDiameter}
              decimals={1}
              enabled={!isRunning}
              onChange={onTankDiameterChange}
              width={112}
              plateHeight={100}
            />
            <SimACE401Slider
              label="Tank Height (cms)"
              min={0}
              max={200}
              step={1}
              ticks={[0, 50, 100, 150, 200]}
              value={tankHeight}
              decimals={0}
              enabled={!isRunning}
              onChange={onTankHeightChange}
              width={112}
              plateHeight={100}
            />
            <SimACE401Slider
              label="Steady State Flow @50% of PV (LPH)"
              min={0}
              max={100}
              step={0.5}
              ticks={[0, 25, 50, 75, 100]}
              value={steadyStateFlow}
              decimals={1}
              enabled={!isRunning}
              onChange={onSteadyStateFlowChange}
              width={124}
              plateHeight={100}
            />
            <SimACE401Slider
              label="Max. Inflow (LPH)"
              min={0}
              max={400}
              step={1}
              ticks={[0, 100, 200, 300, 400]}
              value={maxInflow}
              decimals={0}
              enabled={!isRunning}
              onChange={onMaxInflowChange}
              width={112}
              plateHeight={100}
            />
            <SimACE401Slider
              label="Time Lag (s)"
              min={0}
              max={10}
              step={0.1}
              ticks={[0, 2, 4, 6, 8, 10]}
              value={timeLag}
              decimals={1}
              enabled={!isRunning}
              onChange={onTimeLagChange}
              width={112}
              plateHeight={100}
            />
          </div>
        )}

        {/* TAB 2: Controller Parameters (Figure 1 Matching Layout, Shifted Out Flow in place of Bias) */}
        {activeTab === 'controller' && (
          <div className="sim403-ctrl-layout">
            {/* Left Sliders Grid in 2 Rows (Exact Alignment) */}
            <div className="sim403-ctrl-sliders-grid">
              {/* Row 1: SP, PV, OP, Load, Out Flow (Shifted in place of Bias slider) */}
              <div className="sim403-ctrl-row">
                <SimACE401Slider
                  label="Set Point (%)"
                  min={0}
                  max={100}
                  step={1}
                  ticks={[0, 25, 50, 75, 100]}
                  value={sp}
                  decimals={0}
                  enabled={true}
                  onChange={onSpChange}
                  width={96}
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
                  readOnly={true}
                  enabled={false}
                  width={96}
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
                  readOnly={true}
                  enabled={false}
                  width={96}
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
                  enabled={true}
                  onChange={onLoadChange}
                  width={96}
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
                  readOnly={true}
                  enabled={false}
                  width={96}
                  plateHeight={80}
                />
              </div>

              {/* Row 2: PID Parameters (when PID active) OR Model Parameters (when non-PID e.g. Neural MPC / Direct Neural) */}
              <div className="sim403-ctrl-row">
                {isPidBased ? (
                  <>
                    <SimACE401Slider
                      label="PB %"
                      min={1}
                      max={400}
                      step={1}
                      ticks={[0, 100, 200, 300, 400]}
                      value={isRunning && isTrained ? effectivePb : pb}
                      decimals={0}
                      enabled={!isRunning}
                      onChange={onPbChange}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="IT s"
                      min={0}
                      max={1000}
                      step={1}
                      ticks={[0, 250, 500, 750, 1000]}
                      value={isRunning && isTrained ? effectiveIt : it}
                      decimals={0}
                      enabled={!isRunning}
                      onChange={onItChange}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="DT s"
                      min={0}
                      max={20}
                      step={0.1}
                      ticks={[0, 5, 10, 15, 20]}
                      value={isRunning && isTrained ? effectiveDt : dt}
                      decimals={1}
                      enabled={!isRunning}
                      onChange={onDtChange}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Bias (%)"
                      min={0}
                      max={100}
                      step={0.1}
                      ticks={[0, 25, 50, 75, 100]}
                      value={bias}
                      decimals={1}
                      enabled={true}
                      onChange={onBiasChange}
                      width={96}
                      plateHeight={80}
                    />
                    {/* 5th slot empty placeholder to preserve exact alignment */}
                    <div className="sim403-removed-hys-slot" style={{ width: 96 }} />
                  </>
                ) : controlLogic === 'neural-mpc' ? (
                  <>
                    <SimACE401Slider
                      label="Horizon Np (s)"
                      min={5}
                      max={30}
                      step={1}
                      ticks={[5, 10, 15, 20, 25, 30]}
                      value={mpcHorizon}
                      decimals={0}
                      enabled={!isRunning}
                      onChange={onMpcHorizonChange}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Penalty Weight λ"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]}
                      value={mpcWeight}
                      decimals={2}
                      enabled={!isRunning}
                      onChange={onMpcWeightChange}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Predicted PV (%)"
                      min={0}
                      max={100}
                      step={0.1}
                      ticks={[0, 25, 50, 75, 100]}
                      value={predictedPv}
                      decimals={1}
                      readOnly={true}
                      enabled={false}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Horizon Cost (J)"
                      min={0}
                      max={100}
                      step={0.1}
                      ticks={[0, 25, 50, 75, 100]}
                      value={mpcCost}
                      decimals={1}
                      readOnly={true}
                      enabled={false}
                      width={96}
                      plateHeight={80}
                    />
                    <div className="sim403-removed-hys-slot" style={{ width: 96 }} />
                  </>
                ) : (
                  <>
                    <SimACE401Slider
                      label="Model Target (%)"
                      min={0}
                      max={100}
                      step={1}
                      ticks={[0, 25, 50, 75, 100]}
                      value={sp}
                      decimals={0}
                      readOnly={true}
                      enabled={false}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Neural FF OP (%)"
                      min={0}
                      max={100}
                      step={0.1}
                      ticks={[0, 25, 50, 75, 100]}
                      value={pbContribution}
                      decimals={1}
                      readOnly={true}
                      enabled={false}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Feedback Trim (%)"
                      min={0}
                      max={100}
                      step={0.1}
                      ticks={[0, 25, 50, 75, 100]}
                      value={itContribution}
                      decimals={1}
                      readOnly={true}
                      enabled={false}
                      width={96}
                      plateHeight={80}
                    />
                    <SimACE401Slider
                      label="Tracking Err (%)"
                      min={-50}
                      max={50}
                      step={0.1}
                      ticks={[-50, -25, 0, 25, 50]}
                      value={sp - pv}
                      decimals={1}
                      readOnly={true}
                      enabled={false}
                      width={96}
                      plateHeight={80}
                    />
                    <div className="sim403-removed-hys-slot" style={{ width: 96 }} />
                  </>
                )}
              </div>
            </div>

            {/* Right Dedicated Column: Add Load Button + Algorithm Contributions */}
            <div className="sim403-actions-contrib-col">
              <button
                type="button"
                className={`sim403-add-load-btn ${isAddLoadActive ? 'active' : ''}`}
                onClick={onAddLoad}
                title="Add Load (%) to current PV"
              >
                Add Load
              </button>

              {isPidBased ? (
                <>
                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">PB Contribution (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{pbContribution.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">IT Contribution (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{itContribution.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">DT Contribution (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{dtContribution.toFixed(1)}</span>
                    </div>
                  </div>
                </>
              ) : controlLogic === 'neural-mpc' ? (
                <>
                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">Horizon Cost (J)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{mpcCost.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">Predicted PV (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{predictedPv.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">Tracking Error (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{Math.abs(sp - pv).toFixed(1)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">Neural FF (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{pbContribution.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">Feedback Trim (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{itContribution.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="sim403-contrib-box-group">
                    <span className="sim403-contrib-box-label">Tracking Error (%)</span>
                    <div className="sim403-contrib-box-display">
                      <span>{Math.abs(sp - pv).toFixed(1)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Log Table */}
        {activeTab === 'log' && (
          <div className="sim403-log-table-wrapper" ref={logTableWrapperRef}>
            <table className="sim403-log-table">
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
                    <td colSpan={8} className="sim403-no-log">
                      No log entries recorded. Turn Log ON and click Run to capture data.
                    </td>
                  </tr>
                ) : (
                  logEntries.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{entry.time}</td>
                      <td>{entry.timeS}</td>
                      <td>{entry.sp.toFixed(1)}</td>
                      <td>{entry.pv.toFixed(1)}</td>
                      <td>{entry.op.toFixed(1)}</td>
                      <td>{entry.pb.toFixed(1)}</td>
                      <td>{entry.it.toFixed(1)}</td>
                      <td>{entry.dt.toFixed(1)}</td>
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
