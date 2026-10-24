import React, { useState, useRef } from 'react';
import type { DataPoint } from './SimACE403TrainingGraphs';
import './SimACE403DataCollection.css';

export type ExcitationType = 'step' | 'multi-step' | 'prbs' | 'sinusoidal';
export type ControlLogicType = 'neural-mpc' | 'ml-adaptive-pid' | 'direct-neural';

export interface MultiStepItem {
  endTime: number;
  amplitude: number;
}

export interface DataCollectionParams {
  type: ExcitationType;
  // Step params
  initialValue: number;
  finalValue: number;
  stepTime: number;
  endTime: number;
  // Multi-step params (matching Figure 1)
  multiInitialValue: number;
  multiStartTime: number;
  multiSteps: MultiStepItem[];
  // PRBS params
  prbsMin: number;
  prbsMax: number;
  prbsInterval: number;
  // Sinusoidal params
  sineBaseline: number;
  sineAmplitude: number;
  sinePeriod: number;
}

export interface ModelHyperparams {
  controlLogic: ControlLogicType;
  hiddenNeurons: number;
  activation: 'relu' | 'tanh' | 'sigmoid';
  epochs: number;
  learningRate: number;
  batchSize: number;
}

interface SimACE403DataCollectionProps {
  params: DataCollectionParams;
  onParamsChange: (newParams: DataCollectionParams) => void;
  hyperparams: ModelHyperparams;
  onHyperparamsChange: (newH: ModelHyperparams) => void;
  isGenerating: boolean;
  sampleCount: number;
  isTrained: boolean;
  isTraining: boolean;
  trainingEpoch: number;
  trainingLoss: number;
  onStartDataCollection: () => void;
  onStopDataCollection?: () => void;
  onResetData: () => void;
  onImportData?: (dataset: DataPoint[]) => void;
  onExportData: () => void;
  onGenerateModel: () => void;
  onModelValidation: () => void;
  onExportOnnx: () => void;
  disabled: boolean;
}

// ── LabVIEW-Style Beveled Spinner Input matching Figure 1 ─────────
interface LabViewSpinnerProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (val: number) => void;
  width?: string | number;
}

const LabViewSpinner: React.FC<LabViewSpinnerProps> = ({
  value,
  min = 0,
  max = 9999,
  step = 1,
  disabled = false,
  onChange,
  width = 90,
}) => {
  const repeatRef = useRef<number | null>(null);
  const [localText, setLocalText] = useState(String(value));
  const isFocusedRef = useRef(false);

  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalText(String(value));
    }
  }, [value]);

  const handleInc = () => {
    if (disabled) return;
    const cur = typeof value === 'number' && !isNaN(value) ? value : min;
    const next = Math.min(max, cur + step);
    onChange(next);
    setLocalText(String(next));
  };

  const handleDec = () => {
    if (disabled) return;
    const cur = typeof value === 'number' && !isNaN(value) ? value : min;
    const next = Math.max(min, cur - step);
    onChange(next);
    setLocalText(String(next));
  };

  const startRepeat = (action: () => void) => {
    if (disabled) return;
    action();
    const timeout = window.setTimeout(() => {
      repeatRef.current = window.setInterval(action, 80);
    }, 280);

    const stopRepeat = () => {
      window.clearTimeout(timeout);
      if (repeatRef.current) window.clearInterval(repeatRef.current);
      window.removeEventListener('mouseup', stopRepeat);
      window.removeEventListener('pointerup', stopRepeat);
    };

    window.addEventListener('mouseup', stopRepeat);
    window.addEventListener('pointerup', stopRepeat);
  };

  return (
    <div
      className={`sim403-beveled-input ${disabled ? 'disabled' : ''}`}
      style={{ width }}
    >
      <div className="sim403-spinners">
        <button
          type="button"
          className="sim403-spin-btn spin-up"
          disabled={disabled || value >= max}
          onMouseDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            startRepeat(handleInc);
          }}
          title="Increment"
          aria-label="Increment"
        >
          ▲
        </button>
        <button
          type="button"
          className="sim403-spin-btn spin-down"
          disabled={disabled || value <= min}
          onMouseDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            startRepeat(handleDec);
          }}
          title="Decrement"
          aria-label="Decrement"
        >
          ▼
        </button>
      </div>
      <input
        type="text"
        inputMode="numeric"
        className="sim403-input-val"
        disabled={disabled}
        value={localText}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onChange={(e) => {
          setLocalText(e.target.value);
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          let parsed = parseFloat(localText);
          if (isNaN(parsed)) parsed = min;
          parsed = Math.min(max, Math.max(min, parsed));
          onChange(parsed);
          setLocalText(String(parsed));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
};

export const SimACE403DataCollection: React.FC<SimACE403DataCollectionProps> = ({
  params,
  onParamsChange,
  hyperparams,
  onHyperparamsChange,
  isGenerating,
  sampleCount,
  isTrained,
  isTraining,
  trainingEpoch,
  trainingLoss,
  onStartDataCollection,
  onStopDataCollection,
  onResetData,
  onImportData,
  onExportData,
  onGenerateModel,
  onModelValidation,
  onExportOnnx,
  disabled,
}) => {
  const [activeTab, setActiveTab] = useState<ExcitationType>(params.type);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (t: ExcitationType) => {
    setActiveTab(t);
    onParamsChange({ ...params, type: t });
  };

  const updateParam = <K extends keyof DataCollectionParams>(key: K, val: DataCollectionParams[K]) => {
    onParamsChange({ ...params, [key]: val });
  };

  const updateHyperparam = <K extends keyof ModelHyperparams>(key: K, val: ModelHyperparams[K]) => {
    onHyperparamsChange({ ...hyperparams, [key]: val });
  };

  // ── File Import Handler for CSV / JSON Datasets ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        let parsed: DataPoint[] = [];
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(content);
          if (Array.isArray(json)) {
            parsed = json.map((item, idx) => ({
              t: Number(item.t ?? item.time ?? idx),
              op: Number(item.op ?? item.OP ?? item.u ?? 0),
              pv: Number(item.pv ?? item.PV ?? item.y ?? 0),
            }));
          }
        } else {
          // Parse CSV / TXT
          const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            let startIdx = 0;
            // Check if line 0 is a text header
            if (/[a-zA-Z]/.test(lines[0])) {
              startIdx = 1;
            }
            for (let i = startIdx; i < lines.length; i++) {
              const parts = lines[i].split(/[,;\t]+/).map(Number);
              if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                parsed.push({ t: parts[0], op: parts[1], pv: parts[2] });
              } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                parsed.push({ t: i - startIdx, op: parts[0], pv: parts[1] });
              }
            }
          }
        }

        if (parsed.length > 0) {
          onImportData?.(parsed);
        } else {
          alert('Could not parse valid data points from the file. Ensure file contains Time, OP, PV columns.');
        }
      } catch (err) {
        alert('Error parsing dataset file: ' + String(err));
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="sim403-dc-container">
      {/* ── Frame 1: Generate Input — Data Collection (Matching Figure 1) ── */}
      <div className="sim403-dc-card">
        <div className="sim403-dc-card-header">
          <div className="sim403-dc-title-group">
            <span className="sim403-dc-step-num">1</span>
            <h3 className="sim403-dc-card-title">Generate Input — Data Collection</h3>
          </div>
          <span
            className={`sim403-dc-status-badge ${
              isGenerating ? 'active' : sampleCount > 0 ? 'done' : 'idle'
            }`}
          >
            {isGenerating
              ? 'Collecting Data...'
              : sampleCount > 0
              ? `${sampleCount} samples`
              : 'Idle'}
          </span>
        </div>

        {/* Input Profile Subtabs */}
        <div className="sim403-dc-tab-bar">
          <button
            type="button"
            className={`sim403-dc-tab-btn ${activeTab === 'step' ? 'active' : ''}`}
            disabled={disabled || isGenerating}
            onClick={() => handleTabChange('step')}
          >
            Step
          </button>
          <button
            type="button"
            className={`sim403-dc-tab-btn ${activeTab === 'multi-step' ? 'active' : ''}`}
            disabled={disabled || isGenerating}
            onClick={() => handleTabChange('multi-step')}
          >
            Multi-Step
          </button>
          <button
            type="button"
            className={`sim403-dc-tab-btn ${activeTab === 'prbs' ? 'active' : ''}`}
            disabled={disabled || isGenerating}
            onClick={() => handleTabChange('prbs')}
          >
            PRBS
          </button>
          <button
            type="button"
            className={`sim403-dc-tab-btn ${activeTab === 'sinusoidal' ? 'active' : ''}`}
            disabled={disabled || isGenerating}
            onClick={() => handleTabChange('sinusoidal')}
          >
            Sinusoidal
          </button>
        </div>

        {/* Parameter Fields Area */}
        <div className="sim403-dc-params-area">
          {/* 1. Step Subtab */}
          {activeTab === 'step' && (
            <div className="sim403-inputs-vertical">
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Initial Value (%)</label>
                <LabViewSpinner
                  value={params.initialValue}
                  min={0}
                  max={100}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('initialValue', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Final Value (%)</label>
                <LabViewSpinner
                  value={params.finalValue}
                  min={0}
                  max={100}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('finalValue', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Step Time (s)</label>
                <LabViewSpinner
                  value={params.stepTime}
                  min={1}
                  max={600}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('stepTime', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">End Time (s)</label>
                <LabViewSpinner
                  value={params.endTime}
                  min={10}
                  max={1200}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('endTime', val)}
                />
              </div>
            </div>
          )}

          {/* 2. Multi-Step Subtab (Exact Figure 1 Matching) */}
          {activeTab === 'multi-step' && (
            <div className="sim403-multistep-container">
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Initial Value (%)</label>
                <LabViewSpinner
                  value={params.multiInitialValue}
                  min={0}
                  max={100}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('multiInitialValue', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Start Time (s)</label>
                <LabViewSpinner
                  value={params.multiStartTime}
                  min={0}
                  max={600}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('multiStartTime', val)}
                />
              </div>

              {/* Multi-Step Table */}
              <div className="sim403-multistep-table-box">
                <div className="sim403-multistep-header">
                  <span className="col-idx">#</span>
                  <span className="col-time">End Time (s)</span>
                  <span className="col-amp">Amp (%)</span>
                  <span className="col-del" />
                </div>
                <div className="sim403-multistep-rows">
                  {params.multiSteps.map((st, i) => (
                    <div key={i} className="sim403-multistep-row">
                      <span className="row-idx">#{i + 1}</span>
                      <input
                        type="number"
                        className="sim403-multistep-input"
                        min={0}
                        max={3600}
                        value={st.endTime}
                        disabled={disabled || isGenerating}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = params.multiSteps.map((s, idx) =>
                            idx === i ? { ...s, endTime: val } : s
                          );
                          updateParam('multiSteps', updated);
                        }}
                      />
                      <input
                        type="number"
                        className="sim403-multistep-input"
                        min={0}
                        max={100}
                        value={st.amplitude}
                        disabled={disabled || isGenerating}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = params.multiSteps.map((s, idx) =>
                            idx === i ? { ...s, amplitude: val } : s
                          );
                          updateParam('multiSteps', updated);
                        }}
                      />
                      <button
                        type="button"
                        className="sim403-multistep-btn-del"
                        disabled={disabled || isGenerating || params.multiSteps.length <= 1}
                        onClick={() => {
                          const updated = params.multiSteps.filter((_, idx) => idx !== i);
                          updateParam('multiSteps', updated);
                        }}
                        title="Delete this step"
                        aria-label={`Delete step ${i + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="sim403-multistep-btn-add"
                  disabled={disabled || isGenerating}
                  onClick={() => {
                    const lastEnd =
                      params.multiSteps.length > 0
                        ? params.multiSteps[params.multiSteps.length - 1].endTime + 60
                        : 60;
                    updateParam('multiSteps', [
                      ...params.multiSteps,
                      { endTime: lastEnd, amplitude: 50 },
                    ]);
                  }}
                >
                  + Add Step
                </button>
              </div>
            </div>
          )}

          {/* 3. PRBS Subtab */}
          {activeTab === 'prbs' && (
            <div className="sim403-inputs-vertical">
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Min Value (%)</label>
                <LabViewSpinner
                  value={params.prbsMin}
                  min={0}
                  max={100}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('prbsMin', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Max Value (%)</label>
                <LabViewSpinner
                  value={params.prbsMax}
                  min={0}
                  max={100}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('prbsMax', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Min Period (s)</label>
                <LabViewSpinner
                  value={params.prbsInterval}
                  min={2}
                  max={60}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('prbsInterval', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">End Time (s)</label>
                <LabViewSpinner
                  value={params.endTime}
                  min={10}
                  max={1200}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('endTime', val)}
                />
              </div>
            </div>
          )}

          {/* 4. Sinusoidal Subtab */}
          {activeTab === 'sinusoidal' && (
            <div className="sim403-inputs-vertical">
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Period (s)</label>
                <LabViewSpinner
                  value={params.sinePeriod}
                  min={5}
                  max={300}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('sinePeriod', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Amplitude (%)</label>
                <LabViewSpinner
                  value={params.sineAmplitude}
                  min={1}
                  max={50}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('sineAmplitude', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">Reference (%)</label>
                <LabViewSpinner
                  value={params.sineBaseline}
                  min={0}
                  max={100}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('sineBaseline', val)}
                />
              </div>
              <div className="sim403-dc-field-row">
                <label className="sim403-dc-label">End Time (s)</label>
                <LabViewSpinner
                  value={params.endTime}
                  min={10}
                  max={1200}
                  disabled={disabled || isGenerating}
                  onChange={(val) => updateParam('endTime', val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Row (Figure 1: Start, Reset, Import Data, Save Data to Excel) */}
        <div className="sim403-dc-btn-row">
          {!isGenerating ? (
            <button
              type="button"
              className="sim403-btn sim403-btn-start"
              disabled={disabled}
              onClick={onStartDataCollection}
              title="Start excitation and record PV process response"
            >
              ▶ Start
            </button>
          ) : (
            <button
              type="button"
              className="sim403-btn sim403-btn-stop"
              onClick={onStopDataCollection}
              title="Stop excitation collection"
            >
              ■ Stop
            </button>
          )}

          <button
            type="button"
            className="sim403-btn sim403-btn-reset"
            disabled={disabled || isGenerating || sampleCount === 0}
            onClick={onResetData}
            title="Reset dataset and parameters"
          >
            ↺ Reset
          </button>

          {/* Hidden File Input for Import Data */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="sim403-btn sim403-btn-import"
            disabled={disabled || isGenerating}
            onClick={() => fileInputRef.current?.click()}
            title="Import dataset from CSV or JSON file"
          >
            📁 Import Data
          </button>

          <button
            type="button"
            className="sim403-btn sim403-btn-excel"
            disabled={sampleCount === 0}
            onClick={onExportData}
            title="Export Collected (OP, PV) Dataset to Excel / CSV"
          >
            💾 Save Data to Excel
          </button>
        </div>
      </div>

      {/* ── Frame 2: Model Generation (Matching Figure 1) ─────────────── */}
      <div className="sim403-dc-card">
        <div className="sim403-dc-card-header">
          <div className="sim403-dc-title-group">
            <span className="sim403-dc-step-num">2</span>
            <h3 className="sim403-dc-card-title">Model Generation</h3>
          </div>
          <span
            className={`sim403-dc-status-badge ${
              isTraining ? 'active' : isTrained ? 'done' : 'idle'
            }`}
          >
            {isTraining
              ? `Training (${trainingEpoch}/${hyperparams.epochs})...`
              : isTrained
              ? `Model Ready (Loss: ${trainingLoss.toFixed(4)})`
              : sampleCount > 0
              ? 'Ready to train'
              : 'Waiting for data'}
          </span>
        </div>

        {/* Control Logic Selection */}
        <div className="sim403-dc-logic-row">
          <label className="sim403-dc-label-inline">Control Logic:</label>
          <select
            className="sim403-dc-select"
            value={hyperparams.controlLogic}
            disabled={disabled || isTraining}
            onChange={(e) => updateHyperparam('controlLogic', e.target.value as ControlLogicType)}
          >
            <option value="neural-mpc">Model Predictive Control (MPC)</option>
            <option value="ml-adaptive-pid">ML-Based Adaptive PID Control</option>
            <option value="direct-neural">Direct Neural Network Control</option>
          </select>
        </div>

        {/* Hyperparameters Config */}
        <div className="sim403-dc-section-subhead">⚙ Model Hyperparameters (User Configurable)</div>
        <div className="sim403-dc-hyper-grid">
          <div className="sim403-dc-hyper-cell">
            <label className="sim403-dc-label-sm">Hidden Neurons</label>
            <select
              className="sim403-dc-select-sm"
              value={hyperparams.hiddenNeurons}
              disabled={disabled || isTraining}
              onChange={(e) => updateHyperparam('hiddenNeurons', Number(e.target.value))}
            >
              <option value={32}>32 Neurons</option>
              <option value={64}>64 Neurons (Default)</option>
              <option value={128}>128 Neurons</option>
            </select>
          </div>

          <div className="sim403-dc-hyper-cell">
            <label className="sim403-dc-label-sm">Activation</label>
            <select
              className="sim403-dc-select-sm"
              value={hyperparams.activation}
              disabled={disabled || isTraining}
              onChange={(e) =>
                updateHyperparam('activation', e.target.value as 'relu' | 'tanh' | 'sigmoid')
              }
            >
              <option value="relu">ReLU (Standard)</option>
              <option value="tanh">Tanh</option>
              <option value="sigmoid">Sigmoid</option>
            </select>
          </div>

          <div className="sim403-dc-hyper-cell">
            <label className="sim403-dc-label-sm">Epochs</label>
            <input
              type="number"
              className="sim403-dc-input-sm"
              value={hyperparams.epochs}
              min={10}
              max={500}
              step={10}
              disabled={disabled || isTraining}
              onChange={(e) => updateHyperparam('epochs', Number(e.target.value))}
            />
          </div>

          <div className="sim403-dc-hyper-cell">
            <label className="sim403-dc-label-sm">Learning Rate</label>
            <select
              className="sim403-dc-select-sm"
              value={hyperparams.learningRate}
              disabled={disabled || isTraining}
              onChange={(e) => updateHyperparam('learningRate', Number(e.target.value))}
            >
              <option value={0.0005}>0.0005</option>
              <option value={0.001}>0.001 (Standard)</option>
              <option value={0.005}>0.005</option>
              <option value={0.01}>0.01</option>
            </select>
          </div>

          <div className="sim403-dc-hyper-cell">
            <label className="sim403-dc-label-sm">Batch Size</label>
            <select
              className="sim403-dc-select-sm"
              value={hyperparams.batchSize}
              disabled={disabled || isTraining}
              onChange={(e) => updateHyperparam('batchSize', Number(e.target.value))}
            >
              <option value={16}>16 Pairs</option>
              <option value={32}>32 Pairs (Default)</option>
              <option value={64}>64 Pairs</option>
            </select>
          </div>
        </div>

        {/* Model Generation Buttons */}
        <div className="sim403-dc-btn-row">
          <button
            type="button"
            className="sim403-btn sim403-btn-generate"
            disabled={disabled || isTraining || sampleCount === 0}
            onClick={onGenerateModel}
            title={sampleCount === 0 ? 'Generate or import data first' : 'Train neural model'}
          >
            {isTraining ? `Training (${trainingEpoch}/${hyperparams.epochs})...` : '⚙ Generate Model'}
          </button>
          <button
            type="button"
            className={`sim403-btn sim403-btn-validation ${isTrained ? 'ready' : ''}`}
            disabled={!isTrained || disabled || isTraining}
            onClick={onModelValidation}
            title={
              isTrained
                ? 'Model Ready! Click to enable Process Schematic & Controller Parameters'
                : 'Train model first to enable validation'
            }
          >
            ✓ Model Validation
          </button>
          <button
            type="button"
            className="sim403-btn sim403-btn-export"
            disabled={!isTrained}
            onClick={onExportOnnx}
            title="Export model weights and architecture"
          >
            Export ONNX (.onnx)
          </button>
        </div>
      </div>
    </div>
  );
};
