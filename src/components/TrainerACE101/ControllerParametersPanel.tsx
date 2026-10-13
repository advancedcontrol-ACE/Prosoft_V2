import React, { useState, useRef } from 'react';
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
  isConnected: boolean;
  comPort: string;
  logEntries?: LogEntry[];
  onOpenComModal: () => void;
  onStateChange: (updater: (prev: ControllerState) => ControllerState) => void;
  onParamWrite?: (param: string, value: number | string) => void;
  onSaveSettings?: (settings: { deviceId: number; action: 'Direct' | 'Reverse' }) => void;
}

export const ControllerParametersPanel: React.FC<ControllerParametersPanelProps> = ({
  state,
  isConnected,
  comPort,
  logEntries,
  onOpenComModal,
  onStateChange,
  onParamWrite,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'log'>('params');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const repeatRef = useRef<number | null>(null);

  const handleSaveSettings = () => {
    try {
      const devId = Number(state.deviceId) || 1;
      const act = state.action || 'Direct';
      localStorage.setItem(
        'ace_prosoft_controller_settings',
        JSON.stringify({ deviceId: devId, action: act })
      );
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2000);
      onSaveSettings?.({ deviceId: devId, action: act });
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  };

  const startRepeat = (action: () => void) => {
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
    onStateChange((prev) => ({
      ...prev,
      deviceId: Math.min(247, ((Number(prev.deviceId) || 1) + 1)),
    }));
  };

  const handleDeviceDecrement = () => {
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
          {/* Left sub-box: Controller Setting matching Figure 1 */}
          <div className="controller-settings-card">
            <div className="settings-card-title">Controller Setting</div>

            <div className="setting-row">
              <span className="setting-label">COM Port</span>
              <button
                type="button"
                className="setting-btn port-btn"
                onClick={onOpenComModal}
                title="Select COM Port to connect"
              >
                {comPort || 'Select Port'}
              </button>
            </div>

            <div className="setting-row">
              <span className="setting-label">Status</span>
              <div className={`setting-status-val ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Controller</span>
              <div className="setting-readonly-val">DELTA DTB9696</div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Device ID</span>
              <div className="device-id-spinner-box">
                <div className="device-id-spinners">
                  <button
                    type="button"
                    className="device-id-spin-btn spin-up"
                    onMouseDown={(e) => {
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
                    onMouseDown={(e) => {
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
                  value={
                    state.deviceId === ('' as any)
                      ? ''
                      : (Number(state.deviceId) || 1)
                  }
                  title="Device ID (Numeric only, 1-247)"
                  onChange={(e) => {
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
              <select
                className="setting-select-val"
                value={state.action}
                title="Control Action (Direct / Reverse)"
                onChange={(e) => {
                  const val = e.target.value as 'Direct' | 'Reverse';
                  onStateChange((prev) => ({ ...prev, action: val }));
                  onParamWrite?.('action', val);
                }}
              >
                <option value="Direct">Direct</option>
                <option value="Reverse">Reverse</option>
              </select>
            </div>

            <div className="setting-row">
              <span className="setting-label">Experiment</span>
              <div className="setting-exp-val">
                {state.selectedExperiment || 'Select Experiment'}
              </div>
            </div>

            <div className="setting-save-row">
              <button
                type="button"
                className={`save-settings-btn ${saveSuccess ? 'saved' : ''}`}
                onClick={handleSaveSettings}
                title="Save Device ID and Action locally"
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
                enabled={true}
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
                enabled={true}
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
                enabled={true}
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
                enabled={true}
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
                enabled={true}
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
                enabled={true}
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
                enabled={true}
                onChange={(val) => onStateChange((prev) => ({ ...prev, hysteresis: val }))}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="log-table-container">
          <div className="log-table-scroll">
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
