import React from 'react';
import './TrainerToolbar.css';

interface TrainerToolbarProps {
  isRunning: boolean;
  isLogging: boolean;
  isAuto: boolean;
  isGraphHold: boolean;
  isConnected: boolean;
  isExperimentSelected: boolean;
  onRun: () => void;
  onStop: () => void;
  onToggleAuto: () => void;
  onToggleLog: () => void;
  onSaveLog: () => void;
  onClearLog: () => void;
  onToggleHold: () => void;
  onExportGraph: () => void;
  onUserGuide: () => void;
  onHome: () => void;
  onExit: () => void;
}

export const TrainerToolbar: React.FC<TrainerToolbarProps> = ({
  isRunning,
  isLogging,
  isAuto,
  isGraphHold,
  isConnected,
  isExperimentSelected,
  onRun,
  onStop,
  onToggleAuto,
  onToggleLog,
  onSaveLog,
  onClearLog,
  onToggleHold,
  onExportGraph,
  onUserGuide,
  onHome,
  onExit,
}) => {
  return (
    <div className="trainer-toolbar" role="toolbar">
      {/* Run Button (Enabled only when COM port connected AND experiment selected) */}
      <button
        type="button"
        className={`tb-btn ${isRunning ? 'active-run' : ''}`}
        disabled={!isConnected || !isExperimentSelected || isRunning}
        onClick={onRun}
        title={
          !isConnected
            ? 'Connect to COM Port first'
            : !isExperimentSelected
            ? 'Select an Experiment from the menu first'
            : isRunning
            ? 'Simulation is running'
            : 'Run Simulation / Acquisition'
        }
      >
        <span className="tb-icon run-icon">▶</span>
        <span className="tb-label">Run</span>
      </button>

      {/* Stop Button (Enabled only while running) */}
      <button
        type="button"
        className={`tb-btn ${!isRunning ? 'active-stop' : ''}`}
        disabled={!isRunning}
        onClick={onStop}
        title={!isRunning ? 'Click RUN to start' : 'Stop Experiment'}
      >
        <span className="tb-icon stop-icon">■</span>
        <span className="tb-label">Stop</span>
      </button>

      {/* Auto / Manual Button (Enabled when Experiment is selected) */}
      <button
        type="button"
        className={`tb-btn ${isAuto ? 'active' : 'mode-manual'}`}
        disabled={!isConnected || !isExperimentSelected}
        onClick={onToggleAuto}
        title={
          !isConnected
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
        title="Return to Main Menu"
      >
        <span className="tb-icon home-icon">🏠</span>
        <span className="tb-label">Home</span>
      </button>

      {/* Exit Button */}
      <button
        type="button"
        className="tb-btn exit-btn"
        onClick={onExit}
        title="Exit Application"
      >
        <span className="tb-icon exit-icon">✕</span>
        <span className="tb-label">Exit</span>
      </button>
    </div>
  );
};
