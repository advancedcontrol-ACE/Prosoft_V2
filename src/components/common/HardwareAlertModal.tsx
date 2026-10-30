import React, { useEffect, useRef } from 'react';
import '../TrainerACE101/ConnectionNoticeModal.css';

export interface HardwareAlertModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onRetry: () => void;
  onRemoteLab: () => void;
  onHome: () => void;
}

export const HardwareAlertModal: React.FC<HardwareAlertModalProps> = ({
  isOpen,
  title = 'Hardware Connection Alert',
  message = 'No ACE DAQ is detected. Please check the connection and Retry',
  onRetry,
  onRemoteLab,
  onHome,
}) => {
  const retryBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => retryBtnRef.current?.focus(), 60);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="conn-modal-backdrop">
      <div className="conn-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Title Bar */}
        <div className="conn-modal-titlebar">
          <div className="conn-title-left">
            <span className="conn-title-icon">⚠️</span>
            <span>{title}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="conn-modal-body">
          <div className="conn-success-icon" style={{ fontSize: '38px' }}>
            ⚠️
          </div>
          <div className="conn-modal-text">
            <div
              className="conn-highlight-name"
              style={{
                color: '#991b1b',
                fontSize: '14.5px',
                lineHeight: '1.45',
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          </div>
        </div>

        {/* Modal Footer with Retry, Remote Lab, and Home */}
        <div
          className="conn-modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            padding: '12px 16px',
            background: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
          }}
        >
          <button
            ref={retryBtnRef}
            type="button"
            className="conn-ok-btn"
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 22px',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            🔄 Retry
          </button>
          <button
            type="button"
            className="conn-ok-btn"
            onClick={onRemoteLab}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              background: '#0d9488',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            🌐 Remote Lab
          </button>
          <button
            type="button"
            className="conn-ok-btn"
            onClick={onHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 22px',
              background: '#334155',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};
