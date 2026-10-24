import React from 'react';
import './SimACE405Inputs.css';

export interface TuningResult {
  p: { kc: number; pb: number; ti: number; td: number };
  pi: { kc: number; pb: number; ti: number; td: number };
  pd: { kc: number; pb: number; ti: number; td: number };
  pid: { kc: number; pb: number; ti: number; td: number };
}

interface SimACE405InputsProps {
  family: 'ultimate' | 'reaction';
  onFamilyChange: (f: 'ultimate' | 'reaction') => void;
  // Ultimate Gain Inputs
  ku: number;
  onKuChange: (v: number) => void;
  pu: number;
  onPuChange: (v: number) => void;
  // Process Reaction Inputs
  gainK: number;
  onGainKChange: (v: number) => void;
  tau: number;
  onTauChange: (v: number) => void;
  theta: number;
  onThetaChange: (v: number) => void;
  // Active Algorithm
  algorithm: string;
  onAlgorithmChange: (alg: string) => void;
  tuningResults: TuningResult;
}

export const SimACE405Inputs: React.FC<SimACE405InputsProps> = ({
  family,
  onFamilyChange,
  ku,
  onKuChange,
  pu,
  onPuChange,
  gainK,
  onGainKChange,
  tau,
  onTauChange,
  theta,
  onThetaChange,
  algorithm,
  onAlgorithmChange,
  tuningResults,
}) => {
  return (
    <div className="sim405-inputs-container">
      {/* Method Family Switcher */}
      <div className="sim405-family-tabs">
        <button
          type="button"
          className={`sim405-family-btn ${family === 'ultimate' ? 'active' : ''}`}
          onClick={() => {
            onFamilyChange('ultimate');
            onAlgorithmChange('zn_closed');
          }}
        >
          1. Ultimate Gain Methods
        </button>
        <button
          type="button"
          className={`sim405-family-btn ${family === 'reaction' ? 'active' : ''}`}
          onClick={() => {
            onFamilyChange('reaction');
            onAlgorithmChange('zn_open');
          }}
        >
          2. Process Reaction Curve Methods
        </button>
      </div>

      {/* Input Parameters Card */}
      <div className="sim405-card">
        {family === 'ultimate' ? (
          <>
            <h4 className="sim405-card-title">Ultimate Oscillation Parameters</h4>
            <div className="sim405-grid-2">
              <div className="sim405-field">
                <label>Ultimate Gain (Ku):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={ku}
                  onChange={(e) => onKuChange(Math.max(0.01, parseFloat(e.target.value) || 1))}
                  className="sim405-input"
                />
              </div>
              <div className="sim405-field">
                <label>Ultimate Period (Pu, s):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pu}
                  onChange={(e) => onPuChange(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="sim405-input"
                />
              </div>
            </div>

            <div className="sim405-alg-selector">
              <label>Select Algorithm:</label>
              <div className="sim405-btn-row">
                <button
                  type="button"
                  className={`sim405-alg-btn ${algorithm === 'zn_closed' ? 'active' : ''}`}
                  onClick={() => onAlgorithmChange('zn_closed')}
                >
                  Ziegler-Nichols (Closed-Loop)
                </button>
                <button
                  type="button"
                  className={`sim405-alg-btn ${algorithm === 'tyreus_luyben' ? 'active' : ''}`}
                  onClick={() => onAlgorithmChange('tyreus_luyben')}
                >
                  Tyreus-Luyben
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h4 className="sim405-card-title">FOPDT Open-Loop Plant Parameters</h4>
            <div className="sim405-grid-3">
              <div className="sim405-field">
                <label>Static Gain (K):</label>
                <input
                  type="number"
                  step="0.1"
                  value={gainK}
                  onChange={(e) => onGainKChange(parseFloat(e.target.value) || 1)}
                  className="sim405-input"
                />
              </div>
              <div className="sim405-field">
                <label>Time Constant (&tau;, s):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={tau}
                  onChange={(e) => onTauChange(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="sim405-input"
                />
              </div>
              <div className="sim405-field">
                <label>Time Delay (&theta;, s):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={theta}
                  onChange={(e) => onThetaChange(Math.max(0.05, parseFloat(e.target.value) || 0.1))}
                  className="sim405-input"
                />
              </div>
            </div>

            <div className="sim405-alg-selector">
              <label>Select Algorithm:</label>
              <div className="sim405-btn-row">
                <button
                  type="button"
                  className={`sim405-alg-btn ${algorithm === 'zn_open' ? 'active' : ''}`}
                  onClick={() => onAlgorithmChange('zn_open')}
                >
                  Ziegler-Nichols (Open)
                </button>
                <button
                  type="button"
                  className={`sim405-alg-btn ${algorithm === 'cohen_coon' ? 'active' : ''}`}
                  onClick={() => onAlgorithmChange('cohen_coon')}
                >
                  Cohen-Coon
                </button>
                <button
                  type="button"
                  className={`sim405-alg-btn ${algorithm === 'chr_0' ? 'active' : ''}`}
                  onClick={() => onAlgorithmChange('chr_0')}
                >
                  CHR (0% Overshoot)
                </button>
                <button
                  type="button"
                  className={`sim405-alg-btn ${algorithm === 'chr_20' ? 'active' : ''}`}
                  onClick={() => onAlgorithmChange('chr_20')}
                >
                  CHR (20% Overshoot)
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Calculated Tuning Parameters Table */}
      <div className="sim405-card">
        <h4 className="sim405-card-title">Tuned Controller Parameters Table</h4>
        <table className="sim405-table">
          <thead>
            <tr>
              <th>Mode</th>
              <th>Gain (Kc)</th>
              <th>PB (%)</th>
              <th>Integral Ti (s)</th>
              <th>Derivative Td (s)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mode-col p">P</td>
              <td>{tuningResults.p.kc.toFixed(3)}</td>
              <td>{tuningResults.p.pb.toFixed(1)}%</td>
              <td>&infin;</td>
              <td>0.00</td>
            </tr>
            <tr>
              <td className="mode-col pi">PI</td>
              <td>{tuningResults.pi.kc.toFixed(3)}</td>
              <td>{tuningResults.pi.pb.toFixed(1)}%</td>
              <td>{tuningResults.pi.ti.toFixed(2)}s</td>
              <td>0.00</td>
            </tr>
            <tr>
              <td className="mode-col pd">PD</td>
              <td>{tuningResults.pd.kc.toFixed(3)}</td>
              <td>{tuningResults.pd.pb.toFixed(1)}%</td>
              <td>&infin;</td>
              <td>{tuningResults.pd.td.toFixed(2)}s</td>
            </tr>
            <tr>
              <td className="mode-col pid">PID</td>
              <td>{tuningResults.pid.kc.toFixed(3)}</td>
              <td>{tuningResults.pid.pb.toFixed(1)}%</td>
              <td>{tuningResults.pid.ti.toFixed(2)}s</td>
              <td>{tuningResults.pid.td.toFixed(2)}s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
