import React, { useState, useEffect } from 'react';
import '../TrainerACE101/ProcessSchematic.css';
import { ProcessSchematic106Svg } from './ProcessSchematic106Svg';
import piDiagramImg from '../../assets/pi_diagram.png';
import { CalibrationPanel } from './CalibrationPanel';
import { type CalibrationConfig } from '../../services/tcp/calibrationUtils';

interface ProcessSchematic106Props {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  isAuto?: boolean;
  isConnected?: boolean;
  calibrationConfig: CalibrationConfig;
  onCalibrationChange: (config: CalibrationConfig) => void;
  onCalibrationSave: (config: CalibrationConfig) => Promise<void> | void;
  rawInputs?: {
    ip0?: number;
    ip1?: number;
    ip2?: number;
    ip3?: number;
  };
}

export const ProcessSchematic106: React.FC<ProcessSchematic106Props> = ({
  pv,
  sp,
  op,
  isRunning = false,
  isAuto = true,
  isConnected = true,
  calibrationConfig,
  onCalibrationChange,
  onCalibrationSave,
  rawInputs,
}) => {
  const [activeTab, setActiveTab] = useState<'schematic' | 'pid' | 'calibration'>('schematic');
  const [isCalibrationVisible, setIsCalibrationVisible] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const formatSystemClock = (d: Date = new Date()): string => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
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

  // Keyboard shortcut: Ctrl + Shift + C toggles Calibration tab visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        setIsCalibrationVisible((prev) => {
          const next = !prev;
          if (!next && activeTab === 'calibration') {
            setActiveTab('schematic');
          } else if (next) {
            setActiveTab('calibration');
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="process-schematic-wrapper">
      {/* Upper Tabs (Process Schematic, P & I Diagram, and Calibration) */}
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
        {isCalibrationVisible && (
          <button
            type="button"
            className={`schematic-tab ${activeTab === 'calibration' ? 'active' : ''}`}
            onClick={() => setActiveTab('calibration')}
            style={{
              background: activeTab === 'calibration' ? '#425c77' : '#2d4358',
              color: '#38bdf8',
              borderBottom: activeTab === 'calibration' ? '3px solid #38bdf8' : 'none',
            }}
          >
            ⚙️ Calibration
          </button>
        )}
      </div>

      {/* Main Diagram / Calibration Panel */}
      <div className="schematic-panel">
        {activeTab === 'schematic' ? (
          <div className="schematic-content-area">
            <ProcessSchematic106Svg
              pv={pv}
              sp={sp}
              op={op}
              isRunning={isRunning}
              isAuto={isAuto}
              isConnected={isConnected}
            />
          </div>
        ) : activeTab === 'pid' ? (
          <div className="pid-content-area">
            <img
              src={piDiagramImg}
              alt="P & I Diagram (Level Control ACE 106)"
              className="pid-diagram-img"
            />
          </div>
        ) : (
          <div className="calibration-content-area">
            <CalibrationPanel
              config={calibrationConfig}
              onChange={onCalibrationChange}
              onSave={onCalibrationSave}
              rawInputs={rawInputs}
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
