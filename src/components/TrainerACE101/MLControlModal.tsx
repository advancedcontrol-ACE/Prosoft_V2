import React, { useEffect, useRef } from 'react';
import { MLControlPanel } from './MLControlPanel';
import type { NNWeights, MLLogicType } from '../../services/ml/mlControlAlgorithms';
import './MLControlModal.css';

interface MLControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isRunning: boolean;
  currentPV: number;
  currentOP: number;
  deviceId: number;
  onSetManual: () => Promise<void>;
  onStartValidationOnMainScreen: (params: {
    weights: NNWeights;
    logic: MLLogicType;
    setpoint: number;
    horizon: number;
  }) => void;
}

export const MLControlModal: React.FC<MLControlModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  isRunning,
  currentPV,
  currentOP,
  deviceId,
  onSetManual,
  onStartValidationOnMainScreen,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ml-modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="ml-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="ml-modal-titlebar">
          <div className="ml-title-left">
            <span className="ml-title-icon">🤖</span>
            <span className="ml-title-text">
              Machine Learning Control System — Level Process Trainer
            </span>
          </div>

          <div className="ml-title-right">
            <span className="ml-mode-indicator">Manual Mode</span>

            <button
              type="button"
              className="ml-close-btn"
              onClick={onClose}
              title="Close ML Control Window"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body filling complete window space */}
        <div className="ml-modal-body">
          <MLControlPanel
            isConnected={isConnected}
            isRunning={isRunning}
            currentPV={currentPV}
            currentOP={currentOP}
            deviceId={deviceId}
            onSetManual={onSetManual}
            onStartValidationOnMainScreen={onStartValidationOnMainScreen}
          />
        </div>

        {/* Footer */}
        <div className="ml-modal-footer">
          <div className="ml-footer-hint">
            <span>
              💡 <strong>Workflow:</strong> 1. Generate Input &amp; Collect Data → 2. Train Model &amp; Export ONNX → 3. Validate on Main Screen
            </span>
          </div>
          <button
            type="button"
            className="ml-footer-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
