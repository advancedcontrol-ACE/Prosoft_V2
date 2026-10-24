import React from 'react';
import './SimACE412Header.css';

interface SimACE412HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  filterLambda: number;
}

export const SimACE412Header: React.FC<SimACE412HeaderProps> = ({
  onHome,
  isRunning,
  filterLambda,
}) => {
  return (
    <header className="sim412-header">
      <div className="sim412-header-left">
        <button
          type="button"
          className="sim412-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim412-title-block">
          <h1 className="sim412-title">ACE 413: Internal Model Control Design & Simulator (IMC)</h1>
          <span className="sim412-subtitle">
            Model Inversion & Low-Pass Filter Design with Direct Equivalent PID Synthesis
          </span>
        </div>
      </div>

      <div className="sim412-header-right">
        <div className="sim412-badge">
          IMC Filter &lambda;: <strong>{filterLambda.toFixed(2)} s</strong>
        </div>
        <div className={`sim412-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM STOPPED'}
        </div>
      </div>
    </header>
  );
};
