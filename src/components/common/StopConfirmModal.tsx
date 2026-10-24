import React from 'react';
import './StopConfirmModal.css';

export interface StopConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const StopConfirmModal: React.FC<StopConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Stop Experiment',
  message = 'All data and graphs will be cleared. Do you want to continue?',
}) => {
  if (!isOpen) return null;

  return (
    <div className="stop-modal-backdrop" onClick={onCancel}>
      <div
        className="stop-modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="stop-modal-titlebar">
          <div className="stop-title-left">
            <svg
              className="stop-title-icon-svg"
              viewBox="0 0 24 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10.268 1.498a2 2 0 0 1 3.464 0l9.526 16.5A2 2 0 0 1 21.526 21H2.474a2 2 0 0 1-1.732-3.002l9.526-16.5z"
                fill="#f5a623"
              />
              <path
                d="M12 7v6"
                stroke="#000000"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16.5" r="1.3" fill="#000000" />
            </svg>
            <span id="stop-modal-title">{title}</span>
          </div>
          <button
            type="button"
            className="stop-close-x"
            onClick={onCancel}
            title="Cancel"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="stop-modal-body">
          <div className="stop-warning-icon-large" aria-hidden="true">
            <svg
              className="stop-warning-large-svg"
              viewBox="0 0 52 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.113 2.502c1.283-2.222 4.49-2.222 5.774 0l22.04 38.174c1.283 2.223-.32 5.004-2.887 5.004H3.96c-2.567 0-4.17-2.781-2.887-5.004L23.113 2.502z"
                fill="#f5a623"
              />
              <path
                d="M26 14v14"
                stroke="#000000"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="26" cy="36.5" r="2.8" fill="#000000" />
            </svg>
          </div>
          <p className="stop-modal-message">
            {message}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="stop-modal-footer">
          <button
            type="button"
            className="stop-modal-btn stop-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stop-modal-btn stop-btn-confirm"
            onClick={onConfirm}
            autoFocus
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};
