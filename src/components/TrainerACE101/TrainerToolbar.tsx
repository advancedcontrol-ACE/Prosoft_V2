import React from 'react';
import './TrainerToolbar.css';

interface TrainerToolbarProps {
  isRunning: boolean;
  isLogging: boolean;
  isAuto: boolean;
  isGraphHold: boolean;
  enabled: boolean;
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
  enabled,
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
      {/* Run Button */}
      <button
        type="button"
        className={`tb-btn ${isRunning ? 'active-run' : ''}`}
        disabled={!enabled || isRunning}
        onClick={onRun}
        title="Run Simulation / Acquisition"
      >
        <span className="tb-icon run-icon">▶</span>
        <span className="tb-label">Run</span>
      </button>

      {/* Stop Button */}
      <button
        type="button"
        className={`tb-btn ${!isRunning ? 'active-stop' : ''}`}
        disabled={!enabled || !isRunning}
        onClick={onStop}
        title="Stop"
      >
        <span className="tb-icon stop-icon">■</span>
        <span className="tb-label">Stop</span>
      </button>

      {/* Auto Button */}
      <button
        type="button"
        className={`tb-btn ${isAuto ? 'active' : ''}`}
        disabled={!enabled}
        onClick={onToggleAuto}
        title="Automatic PID Control Mode"
      >
        <span className="tb-icon gear-icon">⚙</span>
        <span className="tb-label">Auto</span>
      </button>

      {/* Log ON Button */}
      <button
        type="button"
        className={`tb-btn log-btn ${isLogging ? 'logging-active' : ''}`}
        disabled={!enabled}
        onClick={onToggleLog}
        title="Toggle Real-Time Logging"
      >
        <span className={`tb-led ${isLogging ? 'on' : 'off'}`} />
        <span className="tb-label">Log ON</span>
      </button>

      {/* Save Log Data */}
      <button
        type="button"
        className="tb-btn"
        disabled={!enabled}
        onClick={onSaveLog}
        title="Save Logged Data to CSV / Excel"
      >
        <span className="tb-icon disk-icon">💾</span>
        <span className="tb-label">Save Log<br />Data</span>
      </button>

      {/* Clear Log */}
      <button
        type="button"
        className="tb-btn"
        disabled={!enabled}
        onClick={onClearLog}
        title="Clear Log History"
      >
        <span className="tb-icon minus-icon">➖</span>
        <span className="tb-label">Clear Log</span>
      </button>

      {/* Hold Graph */}
      <button
        type="button"
        className={`tb-btn ${isGraphHold ? 'active' : ''}`}
        disabled={!enabled}
        onClick={onToggleHold}
        title="Pause / Resume Live Waveform Graph"
      >
        <span className="tb-icon pause-icon">⏸</span>
        <span className="tb-label">Hold<br />Graph</span>
      </button>

      {/* Export Graph */}
      <button
        type="button"
        className="tb-btn"
        disabled={!enabled}
        onClick={onExportGraph}
        title="Export Graph Image"
      >
        <span className="tb-icon chart-icon">📊</span>
        <span className="tb-label">Export<br />Graph</span>
      </button>

      {/* User Guide */}
      <button
        type="button"
        className="tb-btn"
        onClick={onUserGuide}
        title="Open User Guide and Hardware Manual"
      >
        <span className="tb-icon help-icon">❓</span>
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
