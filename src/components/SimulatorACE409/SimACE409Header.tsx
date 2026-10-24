import React from 'react';
import './SimACE409Header.css';

interface SimACE409HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  isAuto: boolean;
}

export const SimACE409Header: React.FC<SimACE409HeaderProps> = ({
  onHome,
  isRunning,
  isAuto,
}) => {
  return (
    <header className="sim409-header">
      <div className="sim409-header-left">
        <button
          type="button"
          className="sim409-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim409-title-block">
          <h1 className="sim409-title">ACE 410: Non-Interacting Level Tank Process Simulator</h1>
          <span className="sim409-subtitle">
            Two-Tank Series Non-Interacting Higher-Order Dynamics & Lag Compensation
          </span>
        </div>
      </div>

      <div className="sim409-header-right">
        <div className="sim409-badge">
          Mode: <strong>{isAuto ? 'AUTO' : 'MANUAL'}</strong>
        </div>
        <div className={`sim409-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM STOPPED'}
        </div>
      </div>
    </header>
  );
};
