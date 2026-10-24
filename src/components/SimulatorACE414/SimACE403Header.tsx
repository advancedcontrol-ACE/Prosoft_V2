import React from 'react';
import './SimACE403Header.css';

interface SimACE403HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  activeMethod: 'reaction' | 'classical' | 'twopoint';
}

export const SimACE403Header: React.FC<SimACE403HeaderProps> = ({
  onHome,
  isRunning,
  activeMethod,
}) => {
  const methodLabels = {
    reaction: 'Process Reaction Method (Tangent Slope)',
    classical: 'Classical Method (63.2% Transient Response)',
    twopoint: 'Two Point Method (28.3% & 63.2%)',
  };

  return (
    <header className="sim403-header">
      <div className="sim403-header-left">
        <button
          type="button"
          className="sim403-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim403-title-block">
          <h1 className="sim403-title">ACE 414: Empirical Model Estimator</h1>
          <span className="sim403-subtitle">
            First Order Plus Dead Time (FOPDT) Identification & ZN Controller Design
          </span>
        </div>
      </div>

      <div className="sim403-header-right">
        <div className="sim403-badge sim403-method-badge">
          Method: <strong>{methodLabels[activeMethod]}</strong>
        </div>
        <div className={`sim403-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'ESTIMATION RUNNING' : 'SYSTEM READY'}
        </div>
      </div>
    </header>
  );
};
