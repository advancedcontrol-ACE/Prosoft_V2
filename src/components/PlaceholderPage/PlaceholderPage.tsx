import React from 'react';
import './PlaceholderPage.css';

interface PlaceholderPageProps {
  label: string;
}

/**
 * PlaceholderPage — shown when the user selects a menu item that has no
 * module yet.  Provides clear feedback that the module is under development.
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ label }) => (
  <div className="placeholder-page">
    <div className="placeholder-card">
      <div className="placeholder-icon">🔧</div>
      <h2 className="placeholder-title">{label}</h2>
      <p className="placeholder-msg">Module under development</p>
      <p className="placeholder-sub">
        This section will be available in a future release.
      </p>
    </div>
  </div>
);

export default PlaceholderPage;
