import React, { useEffect, useRef } from 'react';
import './ConnectionNoticeModal.css';

interface ConnectionNoticeModalProps {
  isOpen: boolean;
  portName?: string;
  title?: string;
  message?: React.ReactNode;
  onClose: () => void;
}

export const ConnectionNoticeModal: React.FC<ConnectionNoticeModalProps> = ({
  isOpen,
  portName,
  title,
  message,
  onClose,
}) => {
  const okBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
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
    <div className="conn-modal-backdrop" onClick={onClose}>
      <div className="conn-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Title Bar */}
        <div className="conn-modal-titlebar">
          <div className="conn-title-left">
            <span className="conn-title-icon">🔌</span>
            <span>{title || 'Hardware Connection Status'}</span>
          </div>
          <button
            type="button"
            className="conn-close-x"
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="conn-modal-body">
          <div className="conn-success-icon">✅</div>
          <div className="conn-modal-text">
            <div className="conn-highlight-name">
              Communication Established {portName ? `(${portName})` : ''}
            </div>
            <div className="conn-modal-message">
              {message || (
                <>
                  Communication Established. Please set <strong>Remote Lab</strong> or Select Experiment from the <strong>Experiment Menu</strong>.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="conn-modal-footer">
          <button
            ref={okBtnRef}
            type="button"
            className="conn-modal-btn conn-btn-ok"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
