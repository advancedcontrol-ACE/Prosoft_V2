import React from 'react';
import './SimACE410Header.css';

interface SimACE410HeaderProps {
  onHome: () => void;
  isRunning: boolean;
  activeView: 'design' | 'process';
  onViewChange: (view: 'design' | 'process') => void;
}

export const SimACE410Header: React.FC<SimACE410HeaderProps> = ({
  onHome,
  isRunning,
  activeView,
  onViewChange,
}) => {
  return (
    <header className="sim410-header">
      <div className="sim410-header-left">
        <button
          type="button"
          className="sim410-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim410-title-block">
          <h1 className="sim410-title">ACE 411: Fuzzy Logic Controller Design & Simulator</h1>
          <span className="sim410-subtitle">
            Mamdani FIS Membership Functions, Rule Base Matrix & Closed-Loop Simulation
          </span>
        </div>
      </div>

      <div className="sim410-header-right">
        <div className="sim410-view-toggle">
          <button
            type="button"
            className={`view-btn ${activeView === 'design' ? 'active' : ''}`}
            onClick={() => onViewChange('design')}
          >
            Fuzzy Designer
          </button>
          <button
            type="button"
            className={`view-btn ${activeView === 'process' ? 'active' : ''}`}
            onClick={() => onViewChange('process')}
          >
            Process Simulator
          </button>
        </div>

        <div className={`sim410-badge ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning ? 'SIMULATION RUNNING' : 'SYSTEM READY'}
        </div>
      </div>
    </header>
  );
};
