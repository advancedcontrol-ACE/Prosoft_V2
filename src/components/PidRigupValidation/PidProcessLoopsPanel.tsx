import React from 'react';
import {
  PROCESS_LOOPS,
  type ProcessLoopDef,
  type ValidationResult,
  type PlacedComponent,
} from './pidRigupData';
import './PidProcessLoopsPanel.css';

interface PidProcessLoopsPanelProps {
  selectedLoop: ProcessLoopDef;
  onSelectLoop: (loop: ProcessLoopDef) => void;
  validationResult: ValidationResult | null;
  onRunValidation: () => void;
  placedComponents: PlacedComponent[];
  onToggleCollapse?: () => void;
}

export const PidProcessLoopsPanel: React.FC<PidProcessLoopsPanelProps> = ({
  selectedLoop,
  onSelectLoop,
  validationResult,
  onRunValidation,
  placedComponents,
  onToggleCollapse,
}) => {
  const panelRef = React.useRef<HTMLElement>(null);

  // Auto-scroll to top so validation result is immediately in the first frame
  React.useEffect(() => {
    if (validationResult && panelRef.current) {
      panelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [validationResult]);

  return (
    <aside ref={panelRef} className="pid-loops-panel">
      {/* Panel Header */}
      <div className="loops-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="loops-title">🎯 Process Loops</h3>
            <span className="loops-subtitle">Select loop &amp; validate student rigup</span>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              className="pane-collapse-btn"
              onClick={onToggleCollapse}
              title="Hide Process Loops"
            >
              ▶
            </button>
          )}
        </div>
      </div>

      {/* ── Validation Score & Diagnostics Box (Kept on First Frame when Validated) ── */}
      {validationResult && (
        <div className={`validation-result-box ${validationResult.isValid ? 'valid' : 'warning'}`} style={{ margin: '8px 12px 12px 12px' }}>
          <div className="result-header">
            <div className="score-circle">
              <span className="score-val">{validationResult.score}%</span>
              <span className="score-sub">SCORE</span>
            </div>
            <div className="result-heading-wrap">
              <h5 className="result-status-title">
                {validationResult.isValid ? '✅ Rigup Validated' : '⚠️ Rigup Discrepancies'}
              </h5>
              <span className="result-matched-stat">
                {validationResult.matchedConnections} of {validationResult.totalRequiredConnections} connections verified
              </span>
            </div>
          </div>

          <p className="result-summary-msg">{validationResult.summaryMessage}</p>

          {/* Connection Checklist */}
          <div className="connection-checklist-container">
            <span className="checklist-heading">Connection Rules:</span>
            <div className="checklist-items">
              {validationResult.connectionChecklist.map((item, idx) => (
                <div key={`check-${idx}`} className={`check-item ${item.isSatisfied ? 'pass' : 'fail'}`}>
                  <span className="item-icon">{item.isSatisfied ? '✅' : '❌'}</span>
                  <span className="item-desc">{item.desc}</span>
                  <span className={`item-type-pill type-${item.type}`}>{item.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unconnected Ports Warning */}
          {validationResult.unconnectedPorts.length > 0 && (
            <div className="unconnected-ports-alert">
              <span className="alert-title">⚠️ Open / Unconnected Ports ({validationResult.unconnectedPorts.length}):</span>
              <div className="unconnected-chips">
                {validationResult.unconnectedPorts.slice(0, 6).map((up, i) => (
                  <span key={`up-${i}`} className="unconnected-chip">
                    {up.compTag} &rsaquo; {up.portName}
                  </span>
                ))}
                {validationResult.unconnectedPorts.length > 6 && (
                  <span className="unconnected-chip more">
                    +{validationResult.unconnectedPorts.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7 Standard Process Loops List */}
      <div className="loops-selector-list">
        {PROCESS_LOOPS.map((loop) => {
          const isSelected = selectedLoop.id === loop.id;
          return (
            <button
              key={loop.id}
              type="button"
              className={`loop-tab-btn ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectLoop(loop)}
            >
              <div className="loop-tab-title-row">
                <span className="loop-icon">
                  {loop.id === 'level-process' && '🌊'}
                  {loop.id === 'flow-process' && '⚡'}
                  {loop.id === 'pressure-process' && '🎚️'}
                  {loop.id === 'temperature-process' && '🔥'}
                  {loop.id === 'cascade-process' && '🔗'}
                  {loop.id === 'ratio-control' && '⚖️'}
                  {loop.id === 'feedforward-control' && '⏩'}
                </span>
                <span className="loop-tab-name">{loop.name}</span>
              </div>
              <span className="loop-tab-category">{loop.category}</span>
            </button>
          );
        })}
      </div>

      {/* Active Loop Details & Validation Area */}
      <div className="active-loop-details">
        {/* Loop Header */}
        <div className="details-header-card">
          <div className="details-title-row">
            <h4 className="active-loop-name">{selectedLoop.name}</h4>
            <span className="active-loop-cat-badge">{selectedLoop.category}</span>
          </div>
          <p className="active-loop-obj">
            <strong>Objective:</strong> {selectedLoop.objective}
          </p>
        </div>

        {/* Required Components Checklist */}
        <div className="details-section">
          <div className="section-title-row">
            <h5 className="section-title">Required Components</h5>
            <span className="comp-counter-badge">
              {placedComponents.length} in workspace
            </span>
          </div>
          <div className="req-comp-grid">
            {selectedLoop.requiredComponents.map((req) => {
              const countPlaced = placedComponents.filter((c) => c.typeId === req.typeId).length;
              const isFulfilled = countPlaced >= req.count;
              return (
                <div
                  key={req.typeId}
                  className={`req-comp-chip ${isFulfilled ? 'fulfilled' : 'missing'}`}
                >
                  <span className="chip-status">{isFulfilled ? '✓' : '✗'}</span>
                  <span className="chip-label">{req.name}</span>
                  <span className="chip-count">({countPlaced}/{req.count})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Run Validation */}
        <div className="validation-action-wrap">
          <button
            type="button"
            className="btn-validate-rigup"
            onClick={onRunValidation}
          >
            🔍 Validate Rigup Connections
          </button>
        </div>

        {/* Key P&ID Engineering Guidelines */}
        <div className="details-section sop-rules-section">
          <h5 className="section-title">📘 SOP &amp; Instrumentation Guidelines</h5>
          <ul className="sop-rules-list">
            {selectedLoop.pidRules.map((rule, idx) => (
              <li key={`rule-${idx}`} className="sop-rule-item">
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
