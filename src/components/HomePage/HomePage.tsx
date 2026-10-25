import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../../config/constants';
import { entitlementService } from '../../services/entitlementService';
import { hardwareSimulator } from '../../services/hardwareSimulator';
import './HomePage.css';

const formatSystemClock = (d: Date = new Date()): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} - ${hours}:${minutes}:${seconds}`;
};

/**
 * HomePage — displays the official ACE Prosoft landing-page graphic,
 * centred in the main content area at a comfortable reading size.
 * Also displays Version 2.0 at bottom-left and live system clock at bottom-right.
 * Displays "Hardware Simulator ON" when simulator is active (Ctrl+Shift+S).
 */
const HomePage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(() => formatSystemClock());
  const [isSimActive, setIsSimActive] = useState<boolean>(() => hardwareSimulator.isActive);
  const profile = entitlementService.getProfile();

  useEffect(() => {
    const updateTime = () => setCurrentTime(formatSystemClock());
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return hardwareSimulator.subscribe((active) => {
      setIsSimActive(active);
    });
  }, []);

  return (
    <main className="home-page">
      {/* Prominent Banner when Hardware Simulator is ON */}
      {isSimActive && (
        <div className="landing-sim-banner">
          <span className="sim-pulse-dot"></span>
          <span className="sim-banner-title">Hardware Simulator ON</span>
          <span className="sim-banner-sub">• Delta DTB9696 &amp; ACE 2007 DAQ</span>
        </div>
      )}

      <div className="landing-image-wrapper">
        <img
          src="/images/landing.png?v=7"
          alt="ACE Prosoft — The Process Software overview"
          className="landing-image"
          draggable={false}
        />
      </div>

      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="version-label">{APP_VERSION}</span>
          {profile?.collegeName && (
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
              • Licensed to: {profile.collegeName} ({profile.allowedModules.length} Modules)
            </span>
          )}
          {isSimActive && (
            <span className="landing-sim-pill-on">
              <span className="sim-pulse-dot-sm"></span>
              Hardware Simulator ON
            </span>
          )}
        </div>
        <div className="landing-clock">
          <span className="landing-clock-icon">🕒</span>
          <span className="landing-clock-text">{currentTime}</span>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
