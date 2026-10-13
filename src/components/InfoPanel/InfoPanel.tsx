import React from 'react';
import './InfoPanel.css';

export type BorderColor = 'green' | 'orange';

interface InfoPanelProps {
  items: string[];
  borderColor?: BorderColor;
  className?: string;
}

/**
 * InfoPanel — one of the four white rounded panels on the home page.
 * Renders a compact bullet list with a coloured border.
 */
const InfoPanel: React.FC<InfoPanelProps> = ({
  items,
  borderColor = 'green',
  className = '',
}) => (
  <div className={`info-panel border-${borderColor} ${className}`}>
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  </div>
);

export default InfoPanel;
