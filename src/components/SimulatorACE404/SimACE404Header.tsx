import React from 'react';
import './SimACE404Header.css';

interface SimACE404HeaderProps {
  onHome: () => void;
  activeView: string;
}

export const SimACE404Header: React.FC<SimACE404HeaderProps> = ({ onHome, activeView }) => {
  return (
    <header className="sim404-header">
      <div className="sim404-header-left">
        <button
          type="button"
          className="sim404-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim404-title-block">
          <h1 className="sim404-title">ACE 405: Model Analysis & PID Controller Design</h1>
          <span className="sim404-subtitle">
            Transfer Function Representations, Frequency & Time-Domain Analysis, Closed-Loop PID Tuning
          </span>
        </div>
      </div>

      <div className="sim404-header-right">
        <div className="sim404-badge">
          Current View: <strong>{activeView}</strong>
        </div>
      </div>
    </header>
  );
};
