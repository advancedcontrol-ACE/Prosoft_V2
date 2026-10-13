import React from 'react';
import { APP_VERSION } from '../../config/constants';
import './HomePage.css';

/**
 * HomePage — displays the official ACE Prosoft landing-page graphic,
 * centred in the main content area at a comfortable reading size.
 * The image is the source-of-truth artwork supplied by ACE.
 */
const HomePage: React.FC = () => (
  <main className="home-page">
    <div className="landing-image-wrapper">
      <img
        src="/images/landing.png?v=4"
        alt="ACE Prosoft — Advanced Control Equipments overview"
        className="landing-image"
        draggable={false}
      />
    </div>
    <footer className="version-label">{APP_VERSION}</footer>
  </main>
);

export default HomePage;
