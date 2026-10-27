import React from 'react';
import './Ace2007HmiModal.css';
import { Ace2007ScreenSvg } from './Ace2007ScreenSvg';
import { type CalibrationConfig } from '../../services/tcp/calibrationUtils';

interface Ace2007HmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  isAuto?: boolean;
  isConnected?: boolean;
  calibrationConfig?: CalibrationConfig;
  rawInputs?: {
    ip0?: number;
    ip1?: number;
    ip2?: number;
    ip3?: number;
  };
}

export const Ace2007HmiModal: React.FC<Ace2007HmiModalProps> = ({
  isOpen,
  onClose,
  pv,
  sp,
  op,
  isRunning = false,
  isAuto = true,
  isConnected = true,
  calibrationConfig,
  rawInputs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="ace2007-modal-overlay" onClick={onClose}>
      <div className="ace2007-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ace2007-modal-header">
          <div className="ace2007-modal-title">
            <span className="hmi-badge">ACE 2007</span>
            <span>WiFi DAQ Module — Hardware &amp; Channel View</span>
          </div>
          <button type="button" className="ace2007-modal-close" onClick={onClose} title="Close HMI View">
            ✕
          </button>
        </div>

        {/* HMI Bezel Frame & Screen */}
        <div className="ace2007-hmi-container">
          <div className="ace2007-screen-wrapper">
            <Ace2007ScreenSvg
              pv={pv}
              sp={sp}
              op={op}
              isRunning={isRunning}
              isAuto={isAuto}
              isConnected={isConnected}
              calibrationConfig={calibrationConfig}
              rawInputs={rawInputs}
              showFrame={true}
              style={{ width: '100%', maxHeight: '78vh' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
