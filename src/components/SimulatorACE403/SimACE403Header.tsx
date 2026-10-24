import React from 'react';
import '../SimulatorACE401/SimACE401Header.css';

export const SimACE403Header: React.FC = () => {
  return (
    <header className="sim401-header">
      <div className="sim401-header-left">
        <img
          src="/images/ace_logo.png"
          alt="ACE Logo"
          className="sim401-header-logo"
        />
        <div className="sim401-header-brand-text">
          <span className="sim401-brand-title">Advanced Control Equipments</span>
          <span className="sim401-brand-subtitle">(Ahead Traditional Control)</span>
        </div>
      </div>

      <div className="sim401-header-right">
        <span className="sim401-header-model">ML Based Control (ACE 403)</span>
      </div>
    </header>
  );
};
