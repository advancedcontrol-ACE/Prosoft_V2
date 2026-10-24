import React from 'react';
import './SimACE402Header.css';

export const SimACE402Header: React.FC = () => {
  return (
    <header className="sim402-header">
      {/* Left Branding */}
      <div className="sim402-brand">
        <img
          src="./images/ace_logo.png"
          alt="ACE Logo"
          className="sim402-logo"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="sim402-titles">
          <span className="sim402-main-title">Advanced Control Equipments</span>
          <span className="sim402-sub-title">(Ahead Traditional Control)</span>
        </div>
      </div>

      {/* Right Product Identification */}
      <div className="sim402-product-badge">
        <h1 className="sim402-product-title">
          Model Based Closed Loop Simulator with PID Controller (ACE 402)
        </h1>
      </div>
    </header>
  );
};
