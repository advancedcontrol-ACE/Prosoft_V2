import React from 'react';
import './TrainerToolbar.css';

interface TrainerToolbarProps {
  isRunning: boolean;
  isLogging: boolean;
  isAuto: boolean;
  isAutoDisabled?: boolean;
  isGraphHold: boolean;
  isConnected: boolean;
  isExperimentSelected: boolean;
  isPaused?: boolean;
  onRun: () => void;
  onPause?: () => void;
  onSingleStep?: () => void;
  onStop: () => void;
  onToggleAuto: () => void;
  onToggleLog: () => void;
  onSaveLog: () => void;
  onClearLog: () => void;
  onToggleHold: () => void;
  onExportGraph: () => void;
  onUserGuide: () => void;
  onHome: () => void;
  onExit?: () => void;
  showExit?: boolean;
  speedMultiplier?: number;
  onSpeedChange?: (speed: number) => void;
}

export const TrainerToolbar: React.FC<TrainerToolbarProps> = ({
  isRunning,
  isLogging,
  isAuto,
  isAutoDisabled = false,
  isGraphHold,
  isConnected,
  isExperimentSelected,
  isPaused = false,
  onRun,
  onPause,
  onSingleStep,
  onStop,
  onToggleAuto,
  onToggleLog,
  onSaveLog,
  onClearLog,
  onToggleHold,
  onExportGraph,
  onUserGuide,
  onHome,
  speedMultiplier,
  onSpeedChange,
}) => {
  return (
    <div className="trainer-toolbar" role="toolbar">
      {/* Run Button */}
      <button
        type="button"
        className={`tb-btn ${isRunning && !isPaused ? 'active-run' : ''}`}
        disabled={!isConnected || !isExperimentSelected || (isRunning && !isPaused)}
        onClick={onRun}
        title={
          !isConnected
            ? 'Connect to COM Port first'
            : !isExperimentSelected
            ? 'Select an Experiment from the menu first'
            : isRunning && !isPaused
            ? 'Simulation is running'
            : 'Run Simulation / Acquisition'
        }
      >
        <span className="tb-icon run-icon">▶</span>
        <span className="tb-label">Run</span>
      </button>

      {/* Pause Button (Figure 2) */}
      {onPause && (
        <button
          type="button"
          className={`tb-btn ${isPaused ? 'active-pause' : ''}`}
          disabled={!isRunning && !isPaused}
          onClick={onPause}
          title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          <span className="tb-icon pause-icon">❚❚</span>
          <span className="tb-label">Pause</span>
        </button>
      )}

      {/* Single Step Button (Figure 2) */}
      {onSingleStep && (
        <button
          type="button"
          className="tb-btn"
          disabled={!isConnected || !isExperimentSelected}
          onClick={onSingleStep}
          title="Single Step (advance simulation by 1s)"
        >
          <span className="tb-icon step-icon">▶▶</span>
          <span className="tb-label">Single<br />Step</span>
        </button>
      )}

      {/* Stop Button */}
      <button
        type="button"
        className={`tb-btn ${!isRunning && !isPaused ? 'active-stop' : ''}`}
        disabled={!isRunning && !isPaused}
        onClick={onStop}
        title={!isRunning && !isPaused ? 'Click RUN to start' : 'Stop Simulation'}
      >
        <span className="tb-icon stop-icon">■</span>
        <span className="tb-label">Stop</span>
      </button>

      {/* Auto / Manual Button (Enabled when Experiment is selected and not fixed Manual) */}
      <button
        type="button"
        className={`tb-btn ${isAuto ? 'active' : 'mode-manual'}`}
        disabled={!isConnected || !isExperimentSelected || isAutoDisabled}
        onClick={onToggleAuto}
        title={
          isAutoDisabled
            ? 'Manual mode is fixed for this experiment'
            : !isConnected
            ? 'Connect to COM Port first'
            : !isExperimentSelected
            ? 'Select an Experiment from the menu first'
            : isAuto
            ? 'Auto mode active (Click to switch to Manual)'
            : 'Manual mode active (Click to switch to Auto)'
        }
      >
        <span className="tb-icon gear-icon">⚙</span>
        <span className="tb-label">{isAuto ? 'Auto' : 'Manual'}</span>
      </button>

      {/* Log ON Button (Enabled after RUN is hit) */}
      <button
        type="button"
        className={`tb-btn log-btn ${isLogging ? 'logging-active' : ''}`}
        disabled={!isRunning}
        onClick={onToggleLog}
        title="Toggle Real-Time Logging"
      >
        <span className={`tb-led ${isLogging ? 'on' : 'off'}`} />
        <span className="tb-label">Log ON</span>
      </button>

      {/* Save Log Data (Enabled after RUN is hit) */}
      <button
        type="button"
        className="tb-btn"
        disabled={!isRunning}
        onClick={onSaveLog}
        title="Save Logged Data to CSV / Excel"
      >
        <span className="tb-icon disk-icon">💾</span>
        <span className="tb-label">Save Log<br />Data</span>
      </button>

      {/* Clear Log (Enabled after RUN is hit) */}
      <button
        type="button"
        className="tb-btn"
        disabled={!isRunning}
        onClick={onClearLog}
        title="Clear Log History"
      >
        <span className="tb-icon minus-icon">➖</span>
        <span className="tb-label">Clear Log</span>
      </button>

      {/* Hold Graph (Enabled after RUN is hit) */}
      <button
        type="button"
        className={`tb-btn ${isGraphHold ? 'active' : ''}`}
        disabled={!isRunning}
        onClick={onToggleHold}
        title="Pause / Resume Live Waveform Graph"
      >
        <span className="tb-icon pause-icon">⏸</span>
        <span className="tb-label">Hold<br />Graph</span>
      </button>

      {/* Export Graph (Enabled after RUN is hit) */}
      <button
        type="button"
        className="tb-btn"
        disabled={!isRunning}
        onClick={onExportGraph}
        title="Export Graph Image"
      >
        <span className="tb-icon chart-icon">📊</span>
        <span className="tb-label">Export<br />Graph</span>
      </button>

      {/* Speed Multiplier Control (Simulation Mode) */}
      {onSpeedChange && (
        <div className="tb-speed-control" title="Simulation Time Acceleration">
          <label htmlFor="tb-speed-select" className="tb-speed-label">Speed</label>
          <select
            id="tb-speed-select"
            className="tb-speed-select"
            value={speedMultiplier ?? 1}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            title="Simulation Speed Multiplier"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      )}

      {/* User Guide (Enabled all the time) */}
      <button
        type="button"
        className="tb-btn"
        onClick={onUserGuide}
        title="Open User Guide and Hardware Manual"
      >
        <img src="/images/user_guide_icon.png" alt="User Guide" className="tb-icon-img" />
        <span className="tb-label">User<br />Guide</span>
      </button>

      {/* Home Button */}
      <button
        type="button"
        className="tb-btn home-btn"
        onClick={onHome}
        disabled={isRunning}
        title={isRunning ? 'Home is disabled while experiment is running. Click Stop first.' : 'Return to Main Menu'}
      >
        <span className="tb-icon home-icon">🏠</span>
        <span className="tb-label">Home</span>
      </button>
    </div>
  );
};
