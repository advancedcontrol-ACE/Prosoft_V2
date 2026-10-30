import React from 'react';
import './PidRigupHeader.css';

interface PidRigupHeaderProps {
  onHome: () => void;
  viewMode: 'figure' | 'symbol';
  onToggleViewMode: (mode: 'figure' | 'symbol') => void;
  onClearCanvas: () => void;
  onValidate: () => void;
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  title?: string;
  category?: string;
}

export const PidRigupHeader: React.FC<PidRigupHeaderProps> = ({
  onHome,
  viewMode,
  onToggleViewMode,
  onClearCanvas,
  onValidate,
  showLeftPanel = true,
  showRightPanel = true,
  onToggleLeftPanel,
  onToggleRightPanel,
  title = 'P&ID Rigup and Validation',
  category = 'Common Experiments',
}) => {
  return (
    <header className="pid-header-container">
      {/* ── Top Header Row (Exact match to Figure 2 / ACE 101: 60px height) ── */}
      <div className="pid-top-header">
        {/* Left: Brand Logo & Text */}
        <div className="pid-header-left">
          <img
            src="/images/ace_logo.png"
            alt="ACE Logo"
            className="pid-header-logo"
          />
          <div className="pid-header-brand-text">
            <span className="pid-brand-title">Advanced Control Equipments</span>
            <span className="pid-brand-subtitle">(Ahead Traditional Control)</span>
          </div>
        </div>

        {/* Right: Category & Experiment Model Title */}
        <div className="pid-header-right">
          <span className="pid-header-category">{category}</span>
          <span className="pid-header-model">{title}</span>
        </div>
      </div>

      {/* ── Second Row: Action Toolbar (Figure 2 Style: 38px height) ── */}
      <div className="pid-toolbar-row">
        {/* Left Group: View Mode Switcher */}
        <div className="pid-toolbar-group">
          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'figure' ? 'active' : ''}`}
              onClick={() => onToggleViewMode('figure')}
              title="Display Realistic 3D Industrial Apparatus Figures"
            >
              🎨 3D Apparatus Figures
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'symbol' ? 'active' : ''}`}
              onClick={() => onToggleViewMode('symbol')}
              title="Display Standard ISA 5.1 P&ID Symbols"
            >
              📐 ISA 5.1 Symbols
            </button>
          </div>
        </div>

        {/* Center Group: Primary Actions */}
        <div className="pid-toolbar-group">
          {onToggleLeftPanel && (
            <button
              type="button"
              className={`pid-tb-btn ${showLeftPanel ? 'panel-active' : ''}`}
              onClick={onToggleLeftPanel}
              title={showLeftPanel ? 'Hide Left Symbol Library' : 'Show Left Symbol Library'}
            >
              <span className="tb-btn-icon">{showLeftPanel ? '◧' : '◻'}</span>
              <span>{showLeftPanel ? 'Hide Library' : 'Show Library'}</span>
            </button>
          )}

          {onToggleRightPanel && (
            <button
              type="button"
              className={`pid-tb-btn ${showRightPanel ? 'panel-active' : ''}`}
              onClick={onToggleRightPanel}
              title={showRightPanel ? 'Hide Right Process Loops' : 'Show Right Process Loops'}
            >
              <span className="tb-btn-icon">{showRightPanel ? '◨' : '◻'}</span>
              <span>{showRightPanel ? 'Hide Loops' : 'Show Loops'}</span>
            </button>
          )}

          <button
            type="button"
            className="pid-tb-btn pid-btn-validate"
            onClick={onValidate}
            title="Validate P&ID loop connections and components against loop requirements"
          >
            <span className="tb-btn-icon">✅</span>
            <span>Validate Rigup</span>
          </button>

          <button
            type="button"
            className="pid-tb-btn pid-btn-clear"
            onClick={onClearCanvas}
            title="Clear all components and connections from the workspace"
          >
            <span className="tb-btn-icon">🗑️</span>
            <span>Clear Workspace</span>
          </button>
        </div>

        {/* Right Group: Navigation */}
        <div className="pid-toolbar-group">
          <button
            type="button"
            className="pid-tb-btn pid-btn-home"
            onClick={onHome}
            title="Return to Prosoft Main Menu"
          >
            <span className="tb-btn-icon">🏠</span>
            <span>Home</span>
          </button>
        </div>
      </div>
    </header>
  );
};
