import React from 'react';
import './SimACE401ExperimentCards.css';

export type SimExperiment = 'onoff' | 'p' | 'pi' | 'pd' | 'pid';

interface SimACE401ExperimentCardsProps {
  experiment: SimExperiment;
  onExperimentChange: (exp: SimExperiment) => void;

  bumplessTransfer: boolean;
  onToggleBumpless: () => void;
  antiResetWindup: boolean;
  onToggleAntiReset: () => void;
  constantOutflow: boolean;
  onToggleConstantOutflow: () => void;
  constantPV: boolean;
  onToggleConstantPV: () => void;
  action: 'direct' | 'reverse';
  onToggleAction: () => void;
}

export const SimACE401ExperimentCards: React.FC<SimACE401ExperimentCardsProps> = ({
  experiment,
  onExperimentChange,
  bumplessTransfer,
  onToggleBumpless,
  antiResetWindup,
  onToggleAntiReset,
  constantOutflow,
  onToggleConstantOutflow,
  constantPV,
  onToggleConstantPV,
  action,
  onToggleAction,
}) => {
  return (
    <div className="sim401-fig5-wrapper">
      {/* ── Figure 5: Select Experiment and Study Parameters ── */}
      <div className="sim401-fig5-row">
        {/* Select Experiment Card */}
        <div className="sim401-fig5-card sim401-exp-box">
          <div className="sim401-fig5-title">Select Experiment</div>
          <div className="sim401-exp-content">
            {/* Column 1 */}
            <div className="sim401-exp-col">
              <label
                className={`sim401-fig5-item ${experiment === 'onoff' ? 'selected' : ''}`}
                onClick={() => onExperimentChange('onoff')}
              >
                <span className={`sim401-fig5-led ${experiment === 'onoff' ? 'active' : ''}`} />
                <span className="sim401-fig5-label">On / Off Control</span>
              </label>

              <label
                className={`sim401-fig5-item ${experiment === 'p' ? 'selected' : ''}`}
                onClick={() => onExperimentChange('p')}
              >
                <span className={`sim401-fig5-led ${experiment === 'p' ? 'active' : ''}`} />
                <span className="sim401-fig5-label">P Mode</span>
              </label>

              <label
                className={`sim401-fig5-item ${experiment === 'pi' ? 'selected' : ''}`}
                onClick={() => onExperimentChange('pi')}
              >
                <span className={`sim401-fig5-led ${experiment === 'pi' ? 'active' : ''}`} />
                <span className="sim401-fig5-label">PI Mode</span>
              </label>
            </div>

            {/* Column 2 */}
            <div className="sim401-exp-col">
              <label
                className={`sim401-fig5-item ${experiment === 'pd' ? 'selected' : ''}`}
                onClick={() => onExperimentChange('pd')}
              >
                <span className={`sim401-fig5-led ${experiment === 'pd' ? 'active' : ''}`} />
                <span className="sim401-fig5-label">PD Mode</span>
              </label>

              <label
                className={`sim401-fig5-item ${experiment === 'pid' ? 'selected' : ''}`}
                onClick={() => onExperimentChange('pid')}
              >
                <span className={`sim401-fig5-led ${experiment === 'pid' ? 'active' : ''}`} />
                <span className="sim401-fig5-label">PID Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Study Parameters Card */}
        <div className="sim401-fig5-card sim401-study-box">
          <div className="sim401-fig5-title">Study Parameters</div>
          <div className="sim401-study-grid">
            {/* Col 1 */}
            <div className="sim401-study-col">
              <div
                className="sim401-fig5-item"
                onClick={onToggleBumpless}
                title="Bumpless Transfer"
              >
                <span className={`sim401-fig5-led ${bumplessTransfer ? 'active' : ''}`} />
                <span className="sim401-fig5-label">Bumpless Transfer</span>
              </div>

              <div
                className="sim401-fig5-item"
                onClick={onToggleAntiReset}
                title="Anti Reset Windup"
              >
                <span className={`sim401-fig5-led ${antiResetWindup ? 'active' : ''}`} />
                <span className="sim401-fig5-label">Anti Reset Windup</span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="sim401-study-col">
              <div
                className="sim401-fig5-item"
                onClick={onToggleConstantOutflow}
                title="Constant Outflow"
              >
                <span className={`sim401-fig5-led ${constantOutflow ? 'active' : ''}`} />
                <span className="sim401-fig5-label">Constant Outflow</span>
              </div>

              <div
                className="sim401-fig5-item"
                onClick={onToggleConstantPV}
                title="Constant PV"
              >
                <span className={`sim401-fig5-led ${constantPV ? 'active' : ''}`} />
                <span className="sim401-fig5-label">Constant PV</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="sim401-action-row">
            <span className="sim401-action-label">Action</span>
            <button
              type="button"
              className="sim401-action-btn"
              onClick={onToggleAction}
              title="Toggle Controller Action"
            >
              {action === 'direct' ? 'Direct' : 'Reverse'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
