import React from 'react';
import './StopConfirmModal.css';

interface StopConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StopConfirmModal: React.FC<StopConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="stop-modal-backdrop" onClick={onCancel}>
      <div className="stop-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="stop-modal-titlebar">
          <div className="stop-title-left">
            <span className="stop-title-icon">⚠️</span>
            <span>Stop Experiment</span>
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

        <div className="stop-modal-body">
          <div className="stop-warning-icon-large">⚠️</div>
          <div className="stop-modal-message">
            All data and graphs will be cleared. Do you want to continue?
          </div>
        </div>

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
