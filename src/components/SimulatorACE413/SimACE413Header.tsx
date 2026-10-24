import React from 'react';
import './SimACE413Header.css';

export type BlockDiagramModel =
  | 'fopdt'
  | 'two-interacting'
  | 'three-interacting'
  | 'two-non-interacting'
  | 'cascade'
  | 'feedforward'
  | 'smith';

interface SimACE413HeaderProps {
  onHome: () => void;
  selectedModel: BlockDiagramModel;
  onModelChange: (m: BlockDiagramModel) => void;
}

export const SimACE413Header: React.FC<SimACE413HeaderProps> = ({
  onHome,
  selectedModel,
  onModelChange,
}) => {
  const modelTitles: Record<BlockDiagramModel, string> = {
    fopdt: 'FOPDT Single Loop System',
    'two-interacting': 'Two Tank Interacting System',
    'three-interacting': 'Three Tank Interacting System',
    'two-non-interacting': 'Two Tank Non-Interacting System',
    cascade: 'Cascade Dual-Loop Control System',
    feedforward: 'Feedforward + Feedback System',
    smith: 'Dead Time Compensator (Smith Predictor)',
  };

  return (
    <header className="sim413-header">
      <div className="sim413-header-left">
        <button
          type="button"
          className="sim413-home-btn"
          onClick={onHome}
          title="Return to Main Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </button>
        <div className="sim413-title-block">
          <h1 className="sim413-title">ACE 404: Block Diagram Analysis</h1>
          <span className="sim413-subtitle">
            Dynamic Control Topologies, Transfer Functions & Transient Response Synthesis
          </span>
        </div>
      </div>

      <div className="sim413-header-right">
        <label className="sim413-select-label">Topology:</label>
        <select
          className="sim413-dropdown"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as BlockDiagramModel)}
        >
          <option value="fopdt">1. FOPDT Model</option>
          <option value="two-interacting">2. Two Tank Interacting</option>
          <option value="three-interacting">3. Three Tank Interacting</option>
          <option value="two-non-interacting">4. Two Tank Non-Interacting</option>
          <option value="cascade">5. Cascade Control</option>
          <option value="feedforward">6. Feedforward + Feedback</option>
          <option value="smith">7. Dead Time Compensator (Smith)</option>
        </select>

        <div className="sim413-badge">
          Model: <strong>{modelTitles[selectedModel]}</strong>
        </div>
      </div>
    </header>
  );
};
