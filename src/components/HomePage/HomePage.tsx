import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../../config/constants';
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
 */
const HomePage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(() => formatSystemClock());

  useEffect(() => {
    const updateTime = () => setCurrentTime(formatSystemClock());
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="home-page">
      <div className="landing-image-wrapper">
        <img
          src="/images/landing.png?v=7"
          alt="ACE Prosoft — The Process Software overview"
          className="landing-image"
          draggable={false}
        />
      </div>

      <footer className="landing-footer">
        <span className="version-label">{APP_VERSION}</span>
        <div className="landing-clock">
          <span className="landing-clock-icon">🕒</span>
          <span className="landing-clock-text">{currentTime}</span>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
