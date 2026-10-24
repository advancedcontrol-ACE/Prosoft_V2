import React from 'react';
import './SimACE405Header.css';

interface SimACE405HeaderProps {
  onHome: () => void;
  tuningFamily: 'ultimate' | 'reaction';
}

export const SimACE405Header: React.FC<SimACE405HeaderProps> = ({ onHome, tuningFamily }) => {
  return (
    <header className="sim405-header">
      <div className="sim405-header-left">
        <button
          type="button"
          className="sim405-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim405-title-block">
          <h1 className="sim405-title">ACE 406: PID Tuning Techniques</h1>
          <span className="sim405-subtitle">
            Ziegler-Nichols (Open/Closed), Cohen-Coon, Tyreus-Luyben, CHR & Comparative Response Analysis
          </span>
        </div>
      </div>

      <div className="sim405-header-right">
        <div className="sim405-badge">
          Family: <strong>{tuningFamily === 'ultimate' ? 'Ultimate Gain Methods' : 'Process Reaction Curve'}</strong>
        </div>
      </div>
    </header>
  );
};
