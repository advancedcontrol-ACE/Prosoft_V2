import React from 'react';
import '../TrainerACE101/TrainerHeader.css';

export const TrainerHeader106: React.FC = () => {
  return (
    <header className="trainer-header">
      <div className="header-left">
        <img
          src="/images/ace_logo.png"
          alt="ACE Logo"
          className="header-logo"
        />
        <div className="header-brand-text">
          <span className="brand-title">Advanced Control Equipments</span>
          <span className="brand-subtitle">(Ahead Traditional Control)</span>
        </div>
      </div>

      <div className="header-right">
        <span className="header-trainer-category">Level Control</span>
        <span className="header-trainer-model">Cascade Process Trainer (ACE 106) — ACE 2007</span>
      </div>
    </header>
  );
};
