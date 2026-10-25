import React, { useState, useRef, useEffect } from 'react';
import { LabViewSlider } from './LabViewSlider';
import './ControllerParametersPanel.css';

export interface ControllerState {
  sp: number;
  pv: number;
  op: number;
  bias: number;
  pb: number;
  it: number;
  dt: number;
  hysteresis: number;
  action: 'Direct' | 'Reverse';
  deviceId: number;
  selectedExperiment: string;
}

export interface LogEntry {
  timeStr: string;
  timeSec: number;
  sp: number;
  pv: number;
  op: number;
  pb: number;
  it: number;
  dt: number;
}

interface ControllerParametersPanelProps {
  state: ControllerState;
  isRunning?: boolean;
  isConnected: boolean;
  isAuto?: boolean;
  comPort: string;
  logEntries?: LogEntry[];
  onOpenComModal: () => void;
  onStateChange: (updater: (prev: ControllerState) => ControllerState) => void;
  onParamWrite?: (param: string, value: number | string) => void;
  onSaveSettings?: (settings: { deviceId: number; action: 'Direct' | 'Reverse' }) => void;
}

export function getEnabledParameters(experiment: string) {
  const norm = (experiment || '').trim().toLowerCase();

  switch (norm) {
    case 'open loop':
    case 'process reaction':
    case 'two point method':
    case 'classical method':
    case 'machine learning control':
    case 'ml control':
      return {
        sp: false,
        pv: false,
        op: true,
        bias: false,
        pb: false,
        it: false,
        dt: false,
        hysteresis: false,
      };

    case 'on / off control':
    case 'on/off control':
      return {
        sp: true,
        pv: false,
        op: false,
        bias: false,
        pb: false,
        it: false,
        dt: false,
        hysteresis: true,
      };

    case 'p mode':
      return {
        sp: true,
        pv: false,
        op: false,
        bias: true,
        pb: true,
        it: false,
        dt: false,
        hysteresis: false,
      };

    case 'pi mode':
      return {
        sp: true,
        pv: false,
        op: false,
        bias: false,
        pb: true,
        it: true,
        dt: false,
        hysteresis: false,
      };

    case 'pd mode':
      return {
        sp: true,
        pv: false,
        op: false,
        bias: false,
        pb: true,
        it: false,
        dt: true,
        hysteresis: false,
      };

    case 'pid mode':
      return {
        sp: true,
        pv: false,
        op: false,
        bias: false,
        pb: true,
        it: true,
        dt: true,
        hysteresis: false,
      };

    case 'closed loop':
      return {
        sp: true,
        pv: false,
        op: false,
        bias: true,
        pb: true,
        it: false,
        dt: false,
        hysteresis: false,
      };

    default:
      // When loading or no experiment selected: ALL disabled like PV
      return {
        sp: false,
        pv: false,
        op: false,
        bias: false,
        pb: false,
        it: false,
        dt: false,
        hysteresis: false,
      };
  }
}

export const ControllerParametersPanel: React.FC<ControllerParametersPanelProps> = ({
  state,
  isRunning = false,
  isConnected,
  isAuto = true,
  comPort,
  logEntries,
  onOpenComModal,
  onStateChange,
  onParamWrite,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'log'>('params');
  const logTableWrapperRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll log table so slider moves along with newest entry at bottom
  useEffect(() => {
    if (activeTab === 'log' && logTableWrapperRef.current) {
      logTableWrapperRef.current.scrollTop = logTableWrapperRef.current.scrollHeight;
    }
  }, [logEntries?.length, activeTab]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const repeatRef = useRef<number | null>(null);

  const enabledParams = getEnabledParameters(state.selectedExperiment);
  const normExp = (state.selectedExperiment || '').trim().toLowerCase();
  const isPidMode =
    normExp === 'p mode' ||
    normExp === 'pi mode' ||
    normExp === 'pd mode' ||
    normExp === 'pid mode';
  // Controller Output is editable in Open Loop and in P, PI, PD, PID modes when in Manual mode (!isAuto)
  const isOpEditable = (normExp === 'open loop' || isPidMode) && !isAuto;

  const handleSaveSettings = async () => {
    if (isRunning) return;
    const devId = Number(state.deviceId) || 1;
    const act = state.action || 'Direct';

    // 1. Save to browser / WebView localStorage
    try {
      localStorage.setItem(
        'ace_prosoft_controller_settings',
        JSON.stringify({ deviceId: devId, action: act })
      );
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    // 2. Persist to disk via /api/settings (essential for installed desktop version)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: devId, action: act }),
      });
    } catch (e) {
      console.warn('Backend settings save warning:', e);
    }

    // 3. Sync Action to hardware register if connected
    onParamWrite?.('action', act);

    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 2000);
    onSaveSettings?.({ deviceId: devId, action: act });
  };

  const startRepeat = (action: () => void) => {
    if (isRunning) return;
    action();
    const timeout = window.setTimeout(() => {
      repeatRef.current = window.setInterval(action, 75);
    }, 280);

    const stopRepeat = () => {
      window.clearTimeout(timeout);
      if (repeatRef.current) window.clearInterval(repeatRef.current);
      window.removeEventListener('mouseup', stopRepeat);
      window.removeEventListener('pointerup', stopRepeat);
    };

    window.addEventListener('mouseup', stopRepeat);
    window.addEventListener('pointerup', stopRepeat);
  };

  const handleDeviceIncrement = () => {
    if (isRunning) return;
    onStateChange((prev) => ({
      ...prev,
      deviceId: Math.min(247, ((Number(prev.deviceId) || 1) + 1)),
    }));
  };

  const handleDeviceDecrement = () => {
    if (isRunning) return;
    onStateChange((prev) => ({
      ...prev,
      deviceId: Math.max(1, ((Number(prev.deviceId) || 1) - 1)),
    }));
  };

  return (
    <div className="controller-panel-wrapper">
      {/* Top Tabs */}
      <div className="controller-tabs">
        <button
          type="button"
          className={`controller-tab ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
        >
          Controller Parameters
        </button>
        <button
          type="button"
          className={`controller-tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table
        </button>
      </div>


      {activeTab === 'params' ? (
        <div className="controller-content">
          {/* Left sub-box: Controller Setting matching Figure 1 (Disabled when RUN is hit) */}
          <div
            className={`controller-settings-card ${isRunning ? 'disabled' : ''}`}
            title={isRunning ? 'Controller settings are locked while experiment is running. Click Stop to edit.' : undefined}
          >
            <div className="settings-card-title">Controller Setting</div>

            <div className="setting-row">
              <span className="setting-label">COM Port</span>
              <div className="setting-frame-box">
                <button
                  type="button"
                  className={`setting-btn port-btn ${isConnected || isRunning ? 'disabled' : ''}`}
                  disabled={isConnected || isRunning}
                  onClick={onOpenComModal}
                  title={isRunning ? 'Locked while running' : isConnected ? 'Connected' : 'Select COM Port to connect'}
                >
                  {comPort || 'Select Port'}
                </button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Status</span>
              <div className="setting-frame-box">
                <div className={`setting-status-val ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Controller</span>
              <div className="setting-frame-box">
                <div className="setting-readonly-val">DELTA DTB9696</div>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Device ID</span>
              <div className={`device-id-spinner-box ${isRunning ? 'disabled' : ''}`}>
                <div className="device-id-spinners">
                  <button
                    type="button"
                    className="device-id-spin-btn spin-up"
                    disabled={isRunning}
                    onMouseDown={(e) => {
                      if (isRunning) return;
                      e.preventDefault();
                      startRepeat(handleDeviceIncrement);
                    }}
                    title="Increment Device ID"
                    aria-label="Increment Device ID"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="device-id-spin-btn spin-down"
                    disabled={isRunning}
                    onMouseDown={(e) => {
                      if (isRunning) return;
                      e.preventDefault();
                      startRepeat(handleDeviceDecrement);
                    }}
                    title="Decrement Device ID"
                    aria-label="Decrement Device ID"
                  >
                    ▼
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  className="device-id-input"
                  disabled={isRunning}
                  value={
                    state.deviceId === ('' as any)
                      ? ''
                      : (Number(state.deviceId) || 1)
                  }
                  title={isRunning ? 'Locked while running' : 'Device ID (Numeric only, 1-247)'}
                  onChange={(e) => {
                    if (isRunning) return;
                    const cleaned = e.target.value.replace(/\D/g, '');
                    if (cleaned === '') {
                      onStateChange((prev) => ({ ...prev, deviceId: '' as any }));
                    } else {
                      const val = Math.min(247, Math.max(1, parseInt(cleaned, 10)));
                      onStateChange((prev) => ({ ...prev, deviceId: val }));
                    }
                  }}
                  onBlur={() => {
                    if (state.deviceId === ('' as any) || !state.deviceId || isNaN(Number(state.deviceId))) {
                      onStateChange((prev) => ({ ...prev, deviceId: 1 }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (isRunning) return;
                    if (
                      [
                        'Backspace',
                        'Delete',
                        'Tab',
                        'Escape',
                        'Enter',
                        'ArrowLeft',
                        'ArrowRight',
                        'ArrowUp',
                        'ArrowDown',
                      ].includes(e.key)
                    ) {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        handleDeviceIncrement();
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        handleDeviceDecrement();
                      }
                      return;
                    }
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Action</span>
              <div className="setting-frame-box action-frame-box">
                <select
                  className="setting-select-val"
                  disabled={isRunning}
                  value={state.action}
                  title={isRunning ? 'Locked while running' : 'Control Action (Direct / Reverse)'}
                  onChange={(e) => {
                    if (isRunning) return;
                    const val = e.target.value as 'Direct' | 'Reverse';
                    onStateChange((prev) => ({ ...prev, action: val }));
                    onParamWrite?.('action', val);
                  }}
                >
                  <option value="Direct">Direct</option>
                  <option value="Reverse">Reverse</option>
                </select>
                <span className="action-down-arrow" aria-hidden="true">
                  <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L4 4L7 1" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Experiment</span>
              <div className="setting-frame-box">
                <div className="setting-exp-val">
                  {state.selectedExperiment || 'Select Experiment'}
                </div>
              </div>
            </div>

            <div className="setting-save-row">
              <button
                type="button"
                className={`save-settings-btn ${saveSuccess ? 'saved' : ''} ${isRunning ? 'disabled' : ''}`}
                disabled={isRunning}
                onClick={handleSaveSettings}
                title={isRunning ? 'Locked while running' : 'Save Device ID and Action locally'}
              >
                {saveSuccess ? 'Settings Saved ✓' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Right sub-box: Sliders Grid matching Figure (Row 1 & Row 2) */}
          <div className="sliders-grid">
            {/* Row 1: Set Point, Process Variable, Controller Output, Bias */}
            <div className="sliders-row">
              <LabViewSlider
                label="Set Point (%)"
                min={0}
                max={100}
                step={1}
                ticks={[0, 25, 50, 75, 100]}
                value={state.sp}
                decimals={0}
                enabled={isRunning && enabledParams.sp}
                onChange={(val) => {
                  onStateChange((prev) => ({ ...prev, sp: val }));
                  onParamWrite?.('sp', val);
                }}
              />

              <LabViewSlider
                label="Process Variable (%)"
                min={0}
                max={100}
                step={0.1}
                ticks={[0, 25, 50, 75, 100]}
                value={state.pv}
                decimals={1}
                enabled={false}
                onChange={(val) => onStateChange((prev) => ({ ...prev, pv: val }))}
              />

              <LabViewSlider
                label="Controller Output (%)"
                min={0}
                max={100}
                step={0.1}
                ticks={[0, 25, 50, 75, 100]}
                value={state.op}
                decimals={1}
                enabled={isOpEditable}
                onChange={(val) => {
                  onStateChange((prev) => ({ ...prev, op: val }));
                  onParamWrite?.('op', val);
                }}
              />

              <LabViewSlider
                label="Bias (%)"
                min={0}
                max={100}
                step={0.1}
                ticks={[0, 25, 50, 75, 100]}
                value={state.bias}
                decimals={1}
                enabled={isRunning && enabledParams.bias}
                onChange={(val) => {
                  onStateChange((prev) => ({ ...prev, bias: val }));
                  onParamWrite?.('bias', val);
                }}
              />
            </div>

            {/* Row 2: PB %, IT s, DT s, Hystresis (%) */}
            <div className="sliders-row">
              <LabViewSlider
                label="PB %"
                min={0}
                max={400}
                step={1}
                ticks={[0, 100, 200, 300, 400]}
                value={state.pb}
                decimals={0}
                enabled={isRunning && enabledParams.pb}
                onChange={(val) => {
                  onStateChange((prev) => ({ ...prev, pb: val }));
                  onParamWrite?.('pb', val);
                }}
              />

              <LabViewSlider
                label="IT s"
                min={0}
                max={1000}
                step={1}
                ticks={[0, 250, 500, 750, 1000]}
                value={state.it}
                decimals={0}
                enabled={isRunning && enabledParams.it}
                onChange={(val) => {
                  onStateChange((prev) => ({ ...prev, it: val }));
                  onParamWrite?.('it', val);
                }}
              />

              <LabViewSlider
                label="DT s"
                min={0}
                max={20}
                step={1}
                ticks={[0, 5, 10, 15, 20]}
                value={state.dt}
                decimals={0}
                enabled={isRunning && enabledParams.dt}
                onChange={(val) => {
                  onStateChange((prev) => ({ ...prev, dt: val }));
                  onParamWrite?.('dt', val);
                }}
              />

              <LabViewSlider
                label="Hystresis (%)"
                min={0}
                max={20}
                step={1}
                ticks={[0, 5, 10, 15, 20]}
                value={state.hysteresis}
                decimals={0}
                enabled={isRunning && enabledParams.hysteresis}
                onChange={(val) => onStateChange((prev) => ({ ...prev, hysteresis: val }))}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="log-table-container">
          <div className="log-table-scroll" ref={logTableWrapperRef}>
            <table className="log-table">
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
                {logEntries && logEntries.length > 0 ? (
                  logEntries.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.timeStr}</td>
                      <td>{row.timeSec.toFixed(1)}</td>
                      <td>{row.sp.toFixed(1)}</td>
                      <td>{row.pv.toFixed(1)}</td>
                      <td>{row.op.toFixed(1)}</td>
                      <td>{row.pb}</td>
                      <td>{row.it}</td>
                      <td>{row.dt}</td>
                    </tr>
                  ))
                ) : (
                  Array.from({ length: 14 }, (_, i) => (
                    <tr key={i}>
                      <td>&nbsp;</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
