import React from 'react';
import './SimACE401Toolbar.css';

interface SimACE401ToolbarProps {
  isRunning: boolean;
  isPaused: boolean;
  isLogging: boolean;
  simSpeed: number;
  simTime: number;
  onRun: () => void;
  onPause: () => void;
  onSingleStep: () => void;
  onStop: () => void;
  onToggleLog: () => void;
  onSaveLog: () => void;
  onClearLog: () => void;
  onExportGraph: () => void;
  onSpeedChange: (speed: number) => void;
  onUserManual: () => void;
  onHome: () => void;
}

export const SimACE401Toolbar: React.FC<SimACE401ToolbarProps> = ({
  isRunning,
  isPaused,
  isLogging,
  simSpeed,
  simTime,
  onRun,
  onPause,
  onSingleStep,
  onStop,
  onToggleLog,
  onSaveLog,
  onClearLog,
  onExportGraph,
  onSpeedChange,
  onUserManual,
  onHome,
}) => {
  return (
    <div className="sim401-toolbar" role="toolbar">
      {/* Run Button */}
      <button
        type="button"
        className={`sim401-tb-btn ${isRunning && !isPaused ? 'active-run' : ''}`}
        onClick={onRun}
        title="Start Simulation"
      >
        <span className="sim401-btn-icon icon-run">▶</span>
        <span className="sim401-btn-label">Run</span>
      </button>

      {/* Pause Button */}
      <button
        type="button"
        className={`sim401-tb-btn ${isPaused ? 'active-pause' : ''}`}
        onClick={onPause}
        disabled={!isRunning && !isPaused}
        title="Pause Simulation"
      >
        <span className="sim401-btn-icon icon-pause">❚❚</span>
        <span className="sim401-btn-label">Pause</span>
      </button>

      {/* Single Step Button */}
      <button
        type="button"
        className="sim401-tb-btn"
        onClick={onSingleStep}
        title="Single Step (advance by 1s)"
      >
        <span className="sim401-btn-icon icon-step">▶▶</span>
        <span className="sim401-btn-label">Single Step</span>
      </button>

      {/* Stop Button */}
      <button
        type="button"
        className="sim401-tb-btn"
        onClick={onStop}
        title="Stop Simulation"
      >
        <span className="sim401-btn-icon icon-stop">■</span>
        <span className="sim401-btn-label">Stop</span>
      </button>

      <div className="sim401-tb-separator" />

      {/* Log ON / OFF Toggle */}
      <button
        type="button"
        className={`sim401-tb-btn sim401-log-btn ${isLogging ? 'logging-on' : ''}`}
        onClick={onToggleLog}
        title={isLogging ? 'Logging is Active' : 'Click to turn Logging ON'}
      >
        <span className={`sim401-led-indicator ${isLogging ? 'led-on' : 'led-off'}`} />
        <span className="sim401-btn-label">{isLogging ? 'Log ON' : 'Log OFF'}</span>
      </button>

      {/* Save Log Data */}
      <button
        type="button"
        className="sim401-tb-btn"
        onClick={onSaveLog}
        title="Save Log Data to CSV / Excel"
      >
        <svg className="sim401-btn-svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="#2563eb" d="M19 12v7H5v-7H3v7a2 2 0 002 2h14a2 2 0 002-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" />
        </svg>
        <span className="sim401-btn-label">Save Log Data</span>
      </button>

      {/* Clear Log */}
      <button
        type="button"
        className="sim401-tb-btn"
        onClick={onClearLog}
        title="Clear Log Table"
      >
        <span className="sim401-btn-icon icon-clear">—</span>
        <span className="sim401-btn-label">Clear Log</span>
      </button>

      <div className="sim401-tb-separator" />

      {/* Export Graph */}
      <button
        type="button"
        className="sim401-tb-btn"
        onClick={onExportGraph}
        title="Export Trend Graph as PNG image"
      >
        <svg className="sim401-btn-svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M3.5 18.5l6-6 4 4 7-7.5" stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 5h3v3" stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        <span className="sim401-btn-label">Export Graph</span>
      </button>

      {/* Sim Speed Dropdown */}
      <div className="sim401-speed-control">
        <label htmlFor="sim-speed-select" className="sim401-speed-label">Speed:</label>
        <select
          id="sim-speed-select"
          className="sim401-speed-select"
          value={simSpeed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          title="Simulation Time Acceleration"
        >
          <option value={1}>1x (Real-time)</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </div>

      <div className="sim401-time-display" title="Elapsed Simulation Time">
        <span className="sim401-time-label">T:</span>
        <span className="sim401-time-val">{simTime.toFixed(1)}s</span>
      </div>

      <div className="sim401-tb-separator" />

      {/* User Manual */}
      <button
        type="button"
        className="sim401-tb-btn"
        onClick={onUserManual}
        title="Open ACE 401 User Manual"
      >
        <span className="sim401-manual-icon">?</span>
        <span className="sim401-btn-label">User Manual</span>
      </button>

      {/* Home */}
      <button
        type="button"
        className="sim401-tb-btn sim401-home-btn"
        onClick={onHome}
        title="Return to Main Menu"
      >
        <svg className="sim401-btn-svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="#dc2626" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span className="sim401-btn-label">Home</span>
      </button>
    </div>
  );
};
