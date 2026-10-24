import React from 'react';
import './SimACE411Header.css';

interface SimACE411HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  smithEnabled: boolean;
  onToggleSmith: () => void;
}

export const SimACE411Header: React.FC<SimACE411HeaderProps> = ({
  onHome,
  isRunning,
  smithEnabled,
  onToggleSmith,
}) => {
  return (
    <header className="sim411-header">
      <div className="sim411-header-left">
        <button
          type="button"
          className="sim411-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim411-title-block">
          <h1 className="sim411-title">ACE 412: Non-Interacting Level Tank Simulator with Smith Predictor</h1>
          <span className="sim411-subtitle">
            Dead-Time Compensation via Internal Delay-Free Predictive Minor Feedback Loop
          </span>
        </div>
      </div>

      <div className="sim411-header-right">
        <button
          type="button"
          className={`smith-toggle-btn ${smithEnabled ? 'enabled' : 'disabled'}`}
          onClick={onToggleSmith}
        >
          Smith Predictor: {smithEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
        </button>

        <div className={`sim411-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM STOPPED'}
        </div>
      </div>
    </header>
  );
};
