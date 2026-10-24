import React from 'react';
import type { TransferFunction } from '../../utils/controlMath';
import './SimACE404TfInputs.css';

interface SimACE404TfInputsProps {
  tf: TransferFunction;
  onTfChange: (tf: TransferFunction) => void;
  feedbackH: number;
  onFeedbackHChange: (h: number) => void;
  pidMode: 'p' | 'pi' | 'pd' | 'pid';
  onPidModeChange: (m: 'p' | 'pi' | 'pd' | 'pid') => void;
  pidTopology: 'parallel' | 'series';
  onPidTopologyChange: (top: 'parallel' | 'series') => void;
  kc: number;
  onKcChange: (val: number) => void;
  ti: number;
  onTiChange: (val: number) => void;
  td: number;
  onTdChange: (val: number) => void;
  samplingTimeTs: number;
  onSamplingTimeChange: (ts: number) => void;
}

export const PRESET_SYSTEMS: { name: string; tf: TransferFunction }[] = [
  {
    name: '1st Order Level Tank: 2 / (10s + 1)',
    tf: { num: [0, 0, 0, 2], den: [0, 0, 0, 10, 1] },
  },
  {
    name: '2nd Order Underdamped: 4 / (s^2 + 1.2s + 4)',
    tf: { num: [0, 0, 0, 4], den: [0, 0, 1, 1.2, 4] },
  },
  {
    name: '3rd Order Non-Interacting Tanks: 1 / (s^3 + 6s^2 + 11s + 6)',
    tf: { num: [0, 0, 0, 1], den: [0, 1, 6, 11, 6] },
  },
  {
    name: '4th Order Thermal Process: 24 / (s^4 + 10s^3 + 35s^2 + 50s + 24)',
    tf: { num: [0, 0, 0, 24], den: [1, 10, 35, 50, 24] },
  },
  {
    name: '2nd Order with Zero: (2s + 3) / (s^2 + 3s + 2)',
    tf: { num: [0, 0, 2, 3], den: [0, 0, 1, 3, 2] },
  },
];

export const SimACE404TfInputs: React.FC<SimACE404TfInputsProps> = ({
  tf,
  onTfChange,
  feedbackH,
  onFeedbackHChange,
  pidMode,
  onPidModeChange,
  pidTopology,
  onPidTopologyChange,
  kc,
  onKcChange,
  ti,
  onTiChange,
  td,
  onTdChange,
  samplingTimeTs,
  onSamplingTimeChange,
}) => {
  // Num is [b3, b2, b1, b0] (order 3 max)
  // Den is [a4, a3, a2, a1, a0] (order 4 max)

  const handleNumChange = (idx: number, val: number) => {
    const newNum = [...tf.num];
    newNum[idx] = val;
    onTfChange({ ...tf, num: newNum });
  };

  const handleDenChange = (idx: number, val: number) => {
    const newDen = [...tf.den];
    newDen[idx] = val;
    onTfChange({ ...tf, den: newDen });
  };

  const handlePresetSelect = (presetIdx: number) => {
    if (presetIdx >= 0 && presetIdx < PRESET_SYSTEMS.length) {
      onTfChange(PRESET_SYSTEMS[presetIdx].tf);
    }
  };

  return (
    <div className="sim404-inputs-pane">
      {/* Preset Selector Card */}
      <div className="sim404-input-card">
        <label className="sim404-card-label">Load Standard Plant Transfer Function:</label>
        <select
          className="sim404-select"
          onChange={(e) => handlePresetSelect(Number(e.target.value))}
          defaultValue={0}
        >
          {PRESET_SYSTEMS.map((item, idx) => (
            <option key={idx} value={idx}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* Plant Transfer Function Polynomial Inputs */}
      <div className="sim404-input-card">
        <h4 className="sim404-card-title">Plant Transfer Function G(s)</h4>
        <div className="sim404-poly-group">
          <span className="poly-prefix">Numerator N(s):</span>
          <div className="poly-inputs-row">
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.num[0] ?? 0}
                onChange={(e) => handleNumChange(0, parseFloat(e.target.value) || 0)}
              />
              s<sup>3</sup> +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.num[1] ?? 0}
                onChange={(e) => handleNumChange(1, parseFloat(e.target.value) || 0)}
              />
              s<sup>2</sup> +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.num[2] ?? 0}
                onChange={(e) => handleNumChange(2, parseFloat(e.target.value) || 0)}
              />
              s +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.num[3] ?? 0}
                onChange={(e) => handleNumChange(3, parseFloat(e.target.value) || 0)}
              />
            </span>
          </div>
        </div>

        <div className="sim404-poly-divider"></div>

        <div className="sim404-poly-group">
          <span className="poly-prefix">Denominator D(s):</span>
          <div className="poly-inputs-row">
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.den[0] ?? 0}
                onChange={(e) => handleDenChange(0, parseFloat(e.target.value) || 0)}
              />
              s<sup>4</sup> +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.den[1] ?? 0}
                onChange={(e) => handleDenChange(1, parseFloat(e.target.value) || 0)}
              />
              s<sup>3</sup> +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.den[2] ?? 0}
                onChange={(e) => handleDenChange(2, parseFloat(e.target.value) || 0)}
              />
              s<sup>2</sup> +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.den[3] ?? 0}
                onChange={(e) => handleDenChange(3, parseFloat(e.target.value) || 0)}
              />
              s +
            </span>
            <span className="poly-term">
              <input
                type="number"
                step="any"
                className="sim404-coef-input"
                value={tf.den[4] ?? 0}
                onChange={(e) => handleDenChange(4, parseFloat(e.target.value) || 0)}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Feedback & Discrete Sampling */}
      <div className="sim404-input-card">
        <div className="sim404-row-2col">
          <div className="sim404-param-item">
            <label className="param-label">Feedback Gain H(s):</label>
            <input
              type="number"
              step="0.1"
              className="sim404-num-field"
              value={feedbackH}
              onChange={(e) => onFeedbackHChange(parseFloat(e.target.value) || 1)}
            />
          </div>
          <div className="sim404-param-item">
            <label className="param-label">Sampling Time Ts (s):</label>
            <input
              type="number"
              step="0.05"
              min={0.01}
              max={5}
              className="sim404-num-field"
              value={samplingTimeTs}
              onChange={(e) => onSamplingTimeChange(Math.max(0.01, parseFloat(e.target.value) || 0.1))}
            />
          </div>
        </div>
      </div>

      {/* PID Controller Configuration */}
      <div className="sim404-input-card">
        <h4 className="sim404-card-title">PID Controller Topology & Parameters</h4>
        <div className="sim404-row-2col">
          <div className="sim404-param-item">
            <label className="param-label">Mode:</label>
            <div className="sim404-btn-group">
              {(['p', 'pi', 'pd', 'pid'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`sim404-toggle-btn ${pidMode === m ? 'active' : ''}`}
                  onClick={() => onPidModeChange(m)}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="sim404-param-item">
            <label className="param-label">Topology:</label>
            <div className="sim404-btn-group">
              <button
                type="button"
                className={`sim404-toggle-btn ${pidTopology === 'parallel' ? 'active' : ''}`}
                onClick={() => onPidTopologyChange('parallel')}
              >
                Ideal (Parallel)
              </button>
              <button
                type="button"
                className={`sim404-toggle-btn ${pidTopology === 'series' ? 'active' : ''}`}
                onClick={() => onPidTopologyChange('series')}
              >
                Interactive (Series)
              </button>
            </div>
          </div>
        </div>

        {/* Sliders for Kc, Ti, Td */}
        <div className="sim404-pid-sliders">
          <div className="sim404-slider-row">
            <span className="slider-label">Gain Kc:</span>
            <input
              type="range"
              min={0.1}
              max={30}
              step={0.1}
              value={kc}
              onChange={(e) => onKcChange(parseFloat(e.target.value))}
              className="sim404-range"
            />
            <span className="slider-val">{kc.toFixed(2)}</span>
          </div>

          <div className="sim404-slider-row">
            <span className="slider-label">Integral Ti (s):</span>
            <input
              type="range"
              min={0.2}
              max={60}
              step={0.2}
              value={ti}
              onChange={(e) => onTiChange(parseFloat(e.target.value))}
              disabled={pidMode === 'p' || pidMode === 'pd'}
              className="sim404-range"
            />
            <span className="slider-val">{pidMode === 'p' || pidMode === 'pd' ? 'OFF' : `${ti.toFixed(2)}s`}</span>
          </div>

          <div className="sim404-slider-row">
            <span className="slider-label">Derivative Td (s):</span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={td}
              onChange={(e) => onTdChange(parseFloat(e.target.value))}
              disabled={pidMode === 'p' || pidMode === 'pi'}
              className="sim404-range"
            />
            <span className="slider-val">{pidMode === 'p' || pidMode === 'pi' ? 'OFF' : `${td.toFixed(2)}s`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
