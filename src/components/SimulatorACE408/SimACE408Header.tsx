import React from 'react';
import './SimACE408Header.css';

interface SimACE408HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  ratioSet: number;
  currentRatio: number;
}

export const SimACE408Header: React.FC<SimACE408HeaderProps> = ({
  onHome,
  isRunning,
  ratioSet,
  currentRatio,
}) => {
  return (
    <header className="sim408-header">
      <div className="sim408-header-left">
        <button
          type="button"
          className="sim408-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim408-title-block">
          <h1 className="sim408-title">ACE 409: Ratio Control Process Simulator</h1>
          <span className="sim408-subtitle">
            Controlled Flow (FT1) : Wild Flow (FT2) Mixing Ratio Regulation
          </span>
        </div>
      </div>

      <div className="sim408-header-right">
        <div className="sim408-badge">
          Ratio Set (RS): <strong>{ratioSet.toFixed(2)}</strong>
        </div>
        <div className="sim408-badge">
          Current Ratio (RC): <strong>{currentRatio.toFixed(2)}</strong>
        </div>
        <div className={`sim408-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM STOPPED'}
        </div>
      </div>
    </header>
  );
};
