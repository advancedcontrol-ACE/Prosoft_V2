import React, { useEffect, useRef } from 'react';
import './ExperimentNoticeModal.css';

interface ExperimentNoticeModalProps {
  isOpen: boolean;
  experimentName: string;
  onClose: () => void;
}

export const ExperimentNoticeModal: React.FC<ExperimentNoticeModalProps> = ({
  isOpen,
  experimentName,
  onClose,
}) => {
  const okBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the OK button on open
      setTimeout(() => okBtnRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
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
    <div className="exp-modal-backdrop" onClick={onClose}>
      <div className="exp-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Title Bar */}
        <div className="exp-modal-titlebar">
          <div className="exp-title-left">
            <span className="exp-title-icon">🔬</span>
            <span>Experiment Selection</span>
          </div>
          <button
            type="button"
            className="exp-close-x"
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="exp-modal-body">
          <div className="exp-info-icon">ℹ️</div>
          <div className="exp-modal-text">
            <div className="exp-highlight-name">{experimentName}</div>
            <div className="exp-modal-message">
              is selected. Press <strong>RUN</strong> to continue.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="exp-modal-footer">
          <button
            ref={okBtnRef}
            type="button"
            className="exp-modal-btn exp-btn-ok"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
