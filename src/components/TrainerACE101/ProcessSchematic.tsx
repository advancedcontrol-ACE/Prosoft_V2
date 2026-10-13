import React, { useState, useEffect } from 'react';
import './ProcessSchematic.css';
import { ProcessSchematicSvg } from './ProcessSchematicSvg';

interface ProcessSchematicProps {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  firebaseUrl: string;
  enableIoT: boolean;
  onFirebaseUrlChange: (val: string) => void;
  onToggleIoT: () => void;
}

export const ProcessSchematic: React.FC<ProcessSchematicProps> = ({
  pv,
  sp,
  op,
  isRunning = false,
  firebaseUrl,
  enableIoT,
  onFirebaseUrlChange,
  onToggleIoT,
}) => {
  const [activeTab, setActiveTab] = useState<'schematic' | 'pid'>('schematic');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${month}/${day}/${year} - ${hours}:${minutes}:${seconds} ${ampm}`);
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
          <div className="pid-placeholder">
            <div className="pid-info-box">
              <h3>P &amp; I Diagram (Level Control ACE 101)</h3>
              <p>Piping and Instrumentation Diagram with ISA-5.1 tag annotations:</p>
              <ul>
                <li><strong>LIC-101:</strong> Level Indicating Controller (Delta DTB9696)</li>
                <li><strong>LT-101:</strong> Hydrostatic Level Transmitter (4-20 mA)</li>
                <li><strong>FY-101:</strong> Current-to-Pneumatic (I/P) Converter (4-20mA to 3-15 psi)</li>
                <li><strong>FCV-101:</strong> Pneumatic Control Valve (Air to Open)</li>
                <li><strong>FI-101:</strong> Variable Area Flowmeter (Rotameter)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar: Firebase URL + IoT Toggle + Live Timestamp */}
      <div className="schematic-footer">
        <div className="footer-left-controls">
          <div className="footer-field">
            <label htmlFor="firebase-url-input">Firebase URL</label>
            <input
              id="firebase-url-input"
              type="text"
              value={firebaseUrl}
              placeholder="https://your-project.firebaseio.com"
              onChange={(e) => onFirebaseUrlChange(e.target.value)}
              className="firebase-input"
            />
          </div>

          <div className="footer-iot-field">
            <span className="iot-label">Enable IoT</span>
            <button
              type="button"
              className={`iot-toggle-switch ${enableIoT ? 'on' : 'off'}`}
              onClick={onToggleIoT}
              title="Enable Industrial IoT Gateway"
            >
              <span className="iot-thumb" />
            </button>
          </div>
        </div>

        {/* Live Date/Time Stamp matching Figure 1 bottom center */}
        <div className="footer-timestamp">
          {currentTime || '10/10/2026 - 11:50:34 PM'}
        </div>
      </div>
    </div>
  );
};
