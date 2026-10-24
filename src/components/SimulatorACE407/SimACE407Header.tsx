import React from 'react';
import './SimACE407Header.css';

interface SimACE407HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  ffFactor: number;
}

export const SimACE407Header: React.FC<SimACE407HeaderProps> = ({
  onHome,
  isRunning,
  ffFactor,
}) => {
  return (
    <header className="sim407-header">
      <div className="sim407-header-left">
        <button
          type="button"
          className="sim407-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim407-title-block">
          <h1 className="sim407-title">ACE 408: Feedforward + Feedback Process Simulator</h1>
          <span className="sim407-subtitle">
            Disturbance Rejection via Dynamic Outflow Feedforward Compensation & PID Level Control
          </span>
        </div>
      </div>

      <div className="sim407-header-right">
        <div className="sim407-badge">
          FF Factor: <strong>{ffFactor.toFixed(2)}</strong>
        </div>
        <div className={`sim407-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM STOPPED'}
        </div>
      </div>
    </header>
  );
};
