import React, { useState } from 'react';
import './SimACE403MLParameters.css';

interface SimACE403MLParametersProps {
  sp: number;
  pv: number;
  op: number;
  isRunning: boolean;
  isMlActive: boolean;
  onToggleMlLoop: () => void;
}

export const SimACE403MLParameters: React.FC<SimACE403MLParametersProps> = ({
  sp,
  pv,
  op,
  isRunning,
  isMlActive,
  onToggleMlLoop,
}) => {
  const [mlAlgorithm, setMlAlgorithm] = useState<'ddpg' | 'narx' | 'dqn'>('ddpg');
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [discountFactor, setDiscountFactor] = useState<number>(0.99);
  const [explorationRate, setExplorationRate] = useState<number>(0.10);
  const [hiddenLayers, setHiddenLayers] = useState<string>('64 x 64');
  const [activation, setActivation] = useState<'relu' | 'tanh'>('relu');
  const [mlStatus, setMlStatus] = useState<string>('Pretrained Weights Ready');

  const errorVal = sp - pv;

  return (
    <div className="sim403-ml-params-container">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="sim403-ml-header-bar">
        <span className="sim403-ml-badge">Adaptive Machine Learning Controller</span>
        <span className={`sim403-ml-status-pill ${isMlActive ? 'active' : ''}`}>
          {isMlActive ? 'ML In-Loop Active' : 'ML Standby'}
        </span>
      </div>

      <div className="sim403-ml-frames-layout">
        {/* Frame 1: Algorithm Selection */}
        <div className="sim403-ml-frame">
          <div className="sim403-ml-frame-title">Control Algorithm</div>
          <div className="sim403-ml-algo-options">
            <label className={`sim403-ml-algo-label ${mlAlgorithm === 'ddpg' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sim403-ml-algo"
                checked={mlAlgorithm === 'ddpg'}
                disabled={isRunning}
                onChange={() => setMlAlgorithm('ddpg')}
              />
              <span className="sim403-ml-algo-name">Actor-Critic DDPG Neuro-Controller</span>
              <span className="sim403-ml-algo-desc">
                Deep deterministic policy gradient for continuous level control
              </span>
            </label>

            <label className={`sim403-ml-algo-label ${mlAlgorithm === 'narx' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sim403-ml-algo"
                checked={mlAlgorithm === 'narx'}
                disabled={isRunning}
                onChange={() => setMlAlgorithm('narx')}
              />
              <span className="sim403-ml-algo-name">NARX Recurrent Neural Network</span>
              <span className="sim403-ml-algo-desc">
                Nonlinear autoregressive dynamic model with exogenous inputs
              </span>
            </label>

            <label className={`sim403-ml-algo-label ${mlAlgorithm === 'dqn' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sim403-ml-algo"
                checked={mlAlgorithm === 'dqn'}
                disabled={isRunning}
                onChange={() => setMlAlgorithm('dqn')}
              />
              <span className="sim403-ml-algo-name">Deep Q-Network (DQN) Agent</span>
              <span className="sim403-ml-algo-desc">
                Value-iteration discrete setpoint optimizer with experience replay
              </span>
            </label>
          </div>
        </div>

        {/* Frame 2: Hyperparameters */}
        <div className="sim403-ml-frame">
          <div className="sim403-ml-frame-title">Hyperparameters &amp; Architecture</div>
          <div className="sim403-ml-hyper-grid">
            <div className="sim403-ml-field">
              <span className="sim403-ml-field-label">Learning Rate (&alpha;)</span>
              <select
                className="sim403-ml-select"
                value={learningRate}
                disabled={isRunning}
                onChange={(e) => setLearningRate(Number(e.target.value))}
              >
                <option value={0.0001}>0.0001</option>
                <option value={0.001}>0.0010 (Default)</option>
                <option value={0.005}>0.0050</option>
                <option value={0.01}>0.0100</option>
              </select>
            </div>

            <div className="sim403-ml-field">
              <span className="sim403-ml-field-label">Discount Factor (&gamma;)</span>
              <select
                className="sim403-ml-select"
                value={discountFactor}
                disabled={isRunning}
                onChange={(e) => setDiscountFactor(Number(e.target.value))}
              >
                <option value={0.95}>0.95</option>
                <option value={0.98}>0.98</option>
                <option value={0.99}>0.99 (Optimal)</option>
              </select>
            </div>

            <div className="sim403-ml-field">
              <span className="sim403-ml-field-label">Exploration Rate (&epsilon;)</span>
              <select
                className="sim403-ml-select"
                value={explorationRate}
                disabled={isRunning}
                onChange={(e) => setExplorationRate(Number(e.target.value))}
              >
                <option value={0.05}>0.05</option>
                <option value={0.10}>0.10 (Standard)</option>
                <option value={0.20}>0.20</option>
              </select>
            </div>

            <div className="sim403-ml-field">
              <span className="sim403-ml-field-label">Hidden Topology</span>
              <select
                className="sim403-ml-select"
                value={hiddenLayers}
                disabled={isRunning}
                onChange={(e) => setHiddenLayers(e.target.value)}
              >
                <option value="32 x 32">32 x 32 Dense</option>
                <option value="64 x 64">64 x 64 Dense</option>
                <option value="128 x 64">128 x 64 Dense</option>
              </select>
            </div>

            <div className="sim403-ml-field">
              <span className="sim403-ml-field-label">Activation Function</span>
              <select
                className="sim403-ml-select"
                value={activation}
                disabled={isRunning}
                onChange={(e) => setActivation(e.target.value as 'relu' | 'tanh')}
              >
                <option value="relu">ReLU</option>
                <option value="tanh">Tanh</option>
              </select>
            </div>

            <div className="sim403-ml-field">
              <span className="sim403-ml-field-label">Target Rate (&tau;)</span>
              <input
                type="text"
                className="sim403-ml-input"
                value="0.005"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Frame 3: Live Telemetry & Actions */}
        <div className="sim403-ml-frame">
          <div className="sim403-ml-frame-title">Telemetry &amp; Execution Controls</div>
          <div className="sim403-ml-metrics-row">
            <div className="sim403-ml-metric-box">
              <span className="sim403-ml-metric-lbl">Set Point (SP)</span>
              <span className="sim403-ml-metric-num">{sp.toFixed(1)} %</span>
            </div>
            <div className="sim403-ml-metric-box">
              <span className="sim403-ml-metric-lbl">Process Variable (PV)</span>
              <span className="sim403-ml-metric-num">{pv.toFixed(1)} %</span>
            </div>
            <div className="sim403-ml-metric-box">
              <span className="sim403-ml-metric-lbl">Error (e = SP - PV)</span>
              <span className={`sim403-ml-metric-num ${Math.abs(errorVal) > 5 ? 'warn' : 'ok'}`}>
                {errorVal.toFixed(1)} %
              </span>
            </div>
            <div className="sim403-ml-metric-box">
              <span className="sim403-ml-metric-lbl">Agent Output (OP)</span>
              <span className="sim403-ml-metric-num highlight">{op.toFixed(1)} %</span>
            </div>
          </div>

          <div className="sim403-ml-actions-row">
            <button
              type="button"
              className="sim403-ml-action-btn primary"
              disabled={isRunning}
              onClick={() => {
                setMlStatus('Optimizing neural policy (50 epochs)...');
                setTimeout(() => setMlStatus('Training converged. Loss: 0.0012, Reward: +98.4'), 900);
              }}
            >
              Train 50 Epochs
            </button>
            <button
              type="button"
              className={`sim403-ml-action-btn ${isMlActive ? 'active' : 'toggle'}`}
              onClick={onToggleMlLoop}
            >
              {isMlActive ? 'Disable ML Loop' : 'Enable ML Loop'}
            </button>
            <button
              type="button"
              className="sim403-ml-action-btn secondary"
              disabled={isRunning}
              onClick={() => setMlStatus('Network weights re-initialized to Gaussian N(0, 0.05)')}
            >
              Reset Weights
            </button>
          </div>

          <div className="sim403-ml-status-text">
            <span>Status:</span> <strong>{mlStatus}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
