import React from 'react';
import './SimACE406Header.css';

interface SimACE406HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  masterAuto: boolean;
  slaveAuto: boolean;
}

export const SimACE406Header: React.FC<SimACE406HeaderProps> = ({
  onHome,
  isRunning,
  masterAuto,
  slaveAuto,
}) => {
  return (
    <header className="sim406-header">
      <div className="sim406-header-left">
        <button
          type="button"
          className="sim406-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim406-title-block">
          <h1 className="sim406-title">ACE 407: Cascade Process Simulator</h1>
          <span className="sim406-subtitle">
            Master (Primary Level Loop) &rarr; Slave (Secondary Flow Loop) Dual PID Architecture
          </span>
        </div>
      </div>

      <div className="sim406-header-right">
        <div className="sim406-badge">
          Master (Level): <strong>{masterAuto ? 'AUTO' : 'MANUAL'}</strong>
        </div>
        <div className="sim406-badge">
          Slave (Flow): <strong>{slaveAuto ? 'AUTO' : 'MANUAL'}</strong>
        </div>
        <div className={`sim406-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM STOPPED'}
        </div>
      </div>
    </header>
  );
};
