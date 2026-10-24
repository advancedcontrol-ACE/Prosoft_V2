import React, { useState } from 'react';
import './SimACE410FuzzyDesign.css';

export interface FuzzyRuleMatrix {
  [delE: string]: { [e: string]: string };
}

export const DEFAULT_RULES: FuzzyRuleMatrix = {
  'delE-N': {
    NL: 'CO-NegL',
    NS: 'CO-NegL',
    Zero: 'CO-NegS',
    PS: 'CO-Nil',
    PL: 'CO-PosS',
  },
  'delE-Zero': {
    NL: 'CO-NegL',
    NS: 'CO-NegS',
    Zero: 'CO-Nil',
    PS: 'CO-PosS',
    PL: 'CO-PosL',
  },
  'delE-P': {
    NL: 'CO-NegS',
    NS: 'CO-Nil',
    Zero: 'CO-PosS',
    PS: 'CO-PosL',
    PL: 'CO-PosL',
  },
};

interface SimACE410FuzzyDesignProps {
  rules: FuzzyRuleMatrix;
  onRulesChange: (r: FuzzyRuleMatrix) => void;
  onProceedToProcess: () => void;
}

export const SimACE410FuzzyDesign: React.FC<SimACE410FuzzyDesignProps> = ({
  rules,
  onRulesChange,
  onProceedToProcess,
}) => {
  const [selectedVar, setSelectedVar] = useState<'error' | 'dError' | 'delCO'>('error');

  const errorSets = ['NL', 'NS', 'Zero', 'PS', 'PL'];
  const dErrorSets = ['delE-N', 'delE-Zero', 'delE-P'];
  const outputSets = ['CO-NegL', 'CO-NegS', 'CO-Nil', 'CO-PosS', 'CO-PosL'];

  const handleCellChange = (delE: string, e: string, val: string) => {
    const updated = {
      ...rules,
      [delE]: {
        ...rules[delE],
        [e]: val,
      },
    };
    onRulesChange(updated);
  };

  return (
    <div className="sim410-design-container">
      {/* Upper Half: Membership Function Curves & Details */}
      <div className="sim410-mf-card">
        <div className="sim410-mf-header">
          <div className="sim410-var-tabs">
            <button
              type="button"
              className={`var-tab ${selectedVar === 'error' ? 'active' : ''}`}
              onClick={() => setSelectedVar('error')}
            >
              1. Input: Error (e) [-50 to +50 cm]
            </button>
            <button
              type="button"
              className={`var-tab ${selectedVar === 'dError' ? 'active' : ''}`}
              onClick={() => setSelectedVar('dError')}
            >
              2. Input: de/dt (Change in Error) [-20 to +20 cm/s]
            </button>
            <button
              type="button"
              className={`var-tab ${selectedVar === 'delCO' ? 'active' : ''}`}
              onClick={() => setSelectedVar('delCO')}
            >
              3. Output: &Delta;CO (Controller Increment) [-50 to +50%]
            </button>
          </div>
          <span className="sim410-mf-note">Mamdani Min-Max Inference & Centroid Defuzzification</span>
        </div>

        {/* SVG Membership Curves Visualization */}
        <div className="sim410-svg-box">
          <svg className="sim410-mf-svg" viewBox="0 0 700 180">
            {/* Background */}
            <rect x="0" y="0" width="700" height="180" fill="#0f172a" rx="4" />
            <line x1="50" y1="140" x2="660" y2="140" stroke="#475569" strokeWidth="1.5" />
            <line x1="50" y1="30" x2="50" y2="140" stroke="#475569" strokeWidth="1.5" />
            <text x="42" y="35" fill="#94a3b8" fontSize="10" textAnchor="end">1.0</text>
            <text x="42" y="140" fill="#94a3b8" fontSize="10" textAnchor="end">0.0</text>

            {selectedVar === 'error' && (
              <>
                {/* NL: Trapezoid */}
                <polygon points="50,40 100,40 170,140 50,140" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" />
                <text x="80" y="32" fill="#ef4444" fontSize="11" fontWeight="bold">NL</text>

                {/* NS: Triangle */}
                <polygon points="120,140 210,40 280,140" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2" />
                <text x="210" y="32" fill="#f97316" fontSize="11" fontWeight="bold">NS</text>

                {/* Zero: Triangle */}
                <polygon points="260,140 355,40 450,140" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
                <text x="355" y="32" fill="#22c55e" fontSize="11" fontWeight="bold">ZERO</text>

                {/* PS: Triangle */}
                <polygon points="430,140 500,40 590,140" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="2" />
                <text x="500" y="32" fill="#06b6d4" fontSize="11" fontWeight="bold">PS</text>

                {/* PL: Trapezoid */}
                <polygon points="540,140 610,40 660,40 660,140" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="2" />
                <text x="630" y="32" fill="#a855f7" fontSize="11" fontWeight="bold">PL</text>

                {/* Scale Axis */}
                <text x="50" y="158" fill="#64748b" fontSize="10" textAnchor="middle">-50</text>
                <text x="210" y="158" fill="#64748b" fontSize="10" textAnchor="middle">-25</text>
                <text x="355" y="158" fill="#64748b" fontSize="10" textAnchor="middle">0</text>
                <text x="500" y="158" fill="#64748b" fontSize="10" textAnchor="middle">+25</text>
                <text x="660" y="158" fill="#64748b" fontSize="10" textAnchor="middle">+50 cm</text>
              </>
            )}

            {selectedVar === 'dError' && (
              <>
                {/* delE-N */}
                <polygon points="50,40 180,40 355,140 50,140" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" />
                <text x="140" y="32" fill="#ef4444" fontSize="11" fontWeight="bold">delE-N</text>

                {/* delE-Zero */}
                <polygon points="230,140 355,40 480,140" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
                <text x="355" y="32" fill="#22c55e" fontSize="11" fontWeight="bold">delE-Zero</text>

                {/* delE-P */}
                <polygon points="355,140 530,40 660,40 660,140" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="2" />
                <text x="570" y="32" fill="#06b6d4" fontSize="11" fontWeight="bold">delE-P</text>

                <text x="50" y="158" fill="#64748b" fontSize="10" textAnchor="middle">-20</text>
                <text x="355" y="158" fill="#64748b" fontSize="10" textAnchor="middle">0</text>
                <text x="660" y="158" fill="#64748b" fontSize="10" textAnchor="middle">+20 cm/s</text>
              </>
            )}

            {selectedVar === 'delCO' && (
              <>
                <polygon points="50,40 110,40 180,140 50,140" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" />
                <text x="80" y="32" fill="#ef4444" fontSize="11" fontWeight="bold">CO-NegL</text>

                <polygon points="120,140 210,40 290,140" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2" />
                <text x="210" y="32" fill="#f97316" fontSize="11" fontWeight="bold">CO-NegS</text>

                <polygon points="260,140 355,40 450,140" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
                <text x="355" y="32" fill="#22c55e" fontSize="11" fontWeight="bold">CO-Nil</text>

                <polygon points="420,140 500,40 590,140" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="2" />
                <text x="500" y="32" fill="#06b6d4" fontSize="11" fontWeight="bold">CO-PosS</text>

                <polygon points="530,140 600,40 660,40 660,140" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="2" />
                <text x="625" y="32" fill="#a855f7" fontSize="11" fontWeight="bold">CO-PosL</text>

                <text x="50" y="158" fill="#64748b" fontSize="10" textAnchor="middle">-50%</text>
                <text x="355" y="158" fill="#64748b" fontSize="10" textAnchor="middle">0%</text>
                <text x="660" y="158" fill="#64748b" fontSize="10" textAnchor="middle">+50%</text>
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Lower Half: 15-Rule Mamdani Matrix */}
      <div className="sim410-rules-card">
        <div className="rules-header-row">
          <h4 className="rules-title">Fuzzy Associative Memory (15 Mamdani Rules Matrix)</h4>
          <div className="rules-btn-actions">
            <button
              type="button"
              className="rules-action-btn"
              onClick={() => onRulesChange(DEFAULT_RULES)}
            >
              Reset Default Rules
            </button>
            <button
              type="button"
              className="rules-proceed-btn"
              onClick={onProceedToProcess}
            >
              Proceed to Process Simulator &rarr;
            </button>
          </div>
        </div>

        <table className="sim410-rule-table">
          <thead>
            <tr>
              <th className="corner-th">de/dt &darr; &nbsp;|&nbsp; Error &rarr;</th>
              {errorSets.map((e) => (
                <th key={e}>{e}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dErrorSets.map((delE) => (
              <tr key={delE}>
                <td className="row-header-td">{delE}</td>
                {errorSets.map((e) => (
                  <td key={e} className="rule-cell">
                    <select
                      className="rule-select"
                      value={rules[delE]?.[e] || 'CO-Nil'}
                      onChange={(evt) => handleCellChange(delE, e, evt.target.value)}
                    >
                      {outputSets.map((out) => (
                        <option key={out} value={out}>
                          {out}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
