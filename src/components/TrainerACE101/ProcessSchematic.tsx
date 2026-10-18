import React, { useState, useEffect } from 'react';
import './ProcessSchematic.css';
import { ProcessSchematicSvg } from './ProcessSchematicSvg';
import piDiagramImg from '../../assets/pi_diagram.png';

interface ProcessSchematicProps {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  firebaseUrl?: string;
  enableIoT?: boolean;
  onFirebaseUrlChange?: (val: string) => void;
  onToggleIoT?: () => void;
}

export const ProcessSchematic: React.FC<ProcessSchematicProps> = ({
  pv,
  sp,
  op,
  isRunning = false,
}) => {
  const [activeTab, setActiveTab] = useState<'schematic' | 'pid'>('schematic');
  const [currentTime, setCurrentTime] = useState<string>('');

  const formatSystemClock = (d: Date = new Date()): string => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    // Match exact Windows system format: dd-MM-yyyy (e.g. 18-10-2026) and 24-hour HH:mm:ss (e.g. 20:47:55)
    return `${day}-${month}-${year} - ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatSystemClock());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="process-schematic-wrapper">
      {/* Upper Tabs */}
      <div className="schematic-tabs">
        <button
          type="button"
          className={`schematic-tab ${activeTab === 'schematic' ? 'active' : ''}`}
          onClick={() => setActiveTab('schematic')}
        >
          Process Schematic
        </button>
        <button
          type="button"
          className={`schematic-tab ${activeTab === 'pid' ? 'active' : ''}`}
          onClick={() => setActiveTab('pid')}
        >
          P &amp; I Diagram
        </button>
      </div>

      {/* Main Diagram Panel */}
      <div className="schematic-panel">
        {activeTab === 'schematic' ? (
          <div className="schematic-content-area">
            {/* Dynamic Interactive SCADA Vector Diagram */}
            <ProcessSchematicSvg
              pv={pv}
              sp={sp}
              op={op}
              isRunning={isRunning}
            />
          </div>
        ) : (
          <div className="pid-content-area">
            <img
              src={piDiagramImg}
              alt="P & I Diagram (Level Control ACE 101)"
              className="pid-diagram-img"
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar: Live System Clock */}
      <div className="schematic-footer">
        <div className="footer-timestamp">
          <span className="clock-icon">🕒</span>
          <span className="clock-text">{currentTime || formatSystemClock()}</span>
        </div>
      </div>
    </div>
  );
};
