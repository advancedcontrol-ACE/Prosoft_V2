import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DeltaDTBService } from '../../services/modbus/dtb9696Modbus';
import {
  ML_LOGIC_OPTIONS,
  createModel,
  trainStep,
} from '../../services/ml/mlControlAlgorithms';
import type {
  MLLogicType,
  NNWeights,
  ActivationFunction,
} from '../../services/ml/mlControlAlgorithms';
import { downloadONNXFile, downloadDatasetAsExcel } from '../../services/ml/onnxExport';
import { SignalProfileChart, RealtimeResponseChart } from './MLCharts';
import './MLControlPanel.css';

export { ML_LOGIC_OPTIONS };
export type { MLLogicType };

type InputType = 'step' | 'multistep' | 'prbs' | 'sinusoidal';

interface StepParams {
  initialValue: number;
  finalValue: number;
  stepTime: number;
  endTime: number;
}

interface MultiStepEntry {
  endTime: number;
  amplitude: number;
}

interface MultiStepParams {
  initialValue: number;
  startTime: number;
  steps: MultiStepEntry[];
}

interface PRBSParams {
  minValue: number;
  maxValue: number;
  minPeriod: number;
  endTime: number;
}

interface SinusoidalParams {
  period: number;
  amplitude: number;
  reference: number;
  endTime: number;
}

interface DataSample {
  time: number;
  pv: number;
  op: number;
}

// Signal Generators (1 second discrete intervals)
function generateStepSignal(params: StepParams): number[] {
  const out: number[] = [];
  for (let t = 0; t <= params.endTime; t++) {
    out.push(t < params.stepTime ? params.initialValue : params.finalValue);
  }
  return out;
}

function generateMultiStepSignal(params: MultiStepParams): number[] {
  const totalTime =
    params.steps.length > 0 ? params.steps[params.steps.length - 1].endTime : 60;
  const out: number[] = [];
  let currentAmp = params.initialValue;
  for (let t = 0; t <= totalTime; t++) {
    if (t >= params.startTime) {
      for (let s = 0; s < params.steps.length; s++) {
        const prevEnd = s === 0 ? params.startTime : params.steps[s - 1].endTime;
        if (t >= prevEnd && t < params.steps[s].endTime) {
          currentAmp = params.steps[s].amplitude;
          break;
        }
      }
    } else {
      currentAmp = params.initialValue;
    }
    out.push(Math.max(0, Math.min(100, currentAmp)));
  }
  return out;
}

function generatePRBSSignal(params: PRBSParams): number[] {
  const out: number[] = [];
  let current = params.minValue;
  let holdCounter = 0;
  for (let t = 0; t <= params.endTime; t++) {
    if (holdCounter <= 0) {
      current = Math.random() > 0.5 ? params.maxValue : params.minValue;
      holdCounter = Math.max(1, params.minPeriod);
    }
    out.push(current);
    holdCounter--;
  }
  return out;
}

function generateSinusoidalSignal(params: SinusoidalParams): number[] {
  const out: number[] = [];
  for (let t = 0; t <= params.endTime; t++) {
    const val =
      params.reference +
      params.amplitude * Math.sin((2 * Math.PI * t) / Math.max(1, params.period));
    out.push(Math.max(0, Math.min(100, val)));
  }
  return out;
}

interface LabViewNumericInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (val: number) => void;
  width?: string | number;
}

const LabViewNumericInput: React.FC<LabViewNumericInputProps> = ({
  value,
  min = 0,
  max = 9999,
  step = 1,
  disabled = false,
  onChange,
  width = 95,
}) => {
  const repeatRef = useRef<number | null>(null);
  const [localText, setLocalText] = useState(String(value));
  const isFocusedRef = useRef(false);

  useEffect(() => {
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
      className={`mlc-beveled-input ${disabled ? 'disabled' : ''}`}
      style={{ width }}
    >
      <div className="mlc-spinners">
        <button
          type="button"
          className="mlc-spin-btn spin-up"
          disabled={disabled || value >= max}
          onMouseDown={(e) => {
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
          className="mlc-spin-btn spin-down"
          disabled={disabled || value <= min}
          onMouseDown={(e) => {
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
        className="mlc-spin-input"
        disabled={disabled}
        value={localText}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
            setLocalText(raw);
            const num = parseFloat(raw);
            if (!isNaN(num)) {
              const clamped = Math.min(max, Math.max(min, num));
              onChange(clamped);
            }
          }
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          const num = parseFloat(localText);
          if (isNaN(num)) {
            setLocalText(String(value));
          } else {
            const clamped = Math.min(max, Math.max(min, num));
            onChange(clamped);
            setLocalText(String(clamped));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleInc();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDec();
          } else if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
};

interface MLControlPanelProps {
  isConnected: boolean;
  isRunning: boolean;
  currentPV: number;
  currentOP: number;
  deviceId: number;
  onSetManual: () => Promise<void>;
  onStartValidationOnMainScreen: (params: {
    weights: NNWeights;
    logic: MLLogicType;
    setpoint: number;
    horizon: number;
  }) => void;
}

export const MLControlPanel: React.FC<MLControlPanelProps> = ({
  isConnected,
  isRunning,
  currentPV,
  currentOP,
  deviceId,
  onSetManual,
  onStartValidationOnMainScreen,
}) => {
  // ── Step 1: Input Generation & Data Collection State ────────
  const [inputType, setInputType] = useState<InputType>('step');

  const [stepParams, setStepParams] = useState<StepParams>({
    initialValue: 20,
    finalValue: 70,
    stepTime: 30,
    endTime: 120,
  });

  const [multiStepParams, setMultiStepParams] = useState<MultiStepParams>({
    initialValue: 20,
    startTime: 0,
    steps: [
      { endTime: 60, amplitude: 50 },
      { endTime: 120, amplitude: 30 },
      { endTime: 180, amplitude: 70 },
    ],
  });

  const [prbsParams, setPrbsParams] = useState<PRBSParams>({
    minValue: 20,
    maxValue: 80,
    minPeriod: 10,
    endTime: 200,
  });

  const [sinParams, setSinParams] = useState<SinusoidalParams>({
    period: 60,
    amplitude: 25,
    reference: 50,
    endTime: 240,
  });

  const [previewSignal, setPreviewSignal] = useState<number[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedData, setCollectedData] = useState<DataSample[]>([]);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(-1);

  const signalQueueRef = useRef<number[]>([]);
  const collectionTimerRef = useRef<number | null>(null);
  const collectTimeRef = useRef(0);

  // ── Step 2: Model Generation & Control Logic State ──────────
  const [selectedLogic, setSelectedLogic] = useState<MLLogicType>('mpc');
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainLoss, setTrainLoss] = useState<number | null>(null);
  const [nnWeights, setNNWeights] = useState<NNWeights | null>(null);
  const [modelReady, setModelReady] = useState(false);

  // User-Defined Model Hyperparameters
  const [hiddenNeurons, setHiddenNeurons] = useState<number>(64);
  const [activationFunc, setActivationFunc] = useState<ActivationFunction>('relu');
  const [epochs, setEpochs] = useState<number>(100);
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [batchSize, setBatchSize] = useState<number>(32);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 3: Real-Time Model Validation State ────────────────
  const [targetSetpoint, setTargetSetpoint] = useState(50);
  const [mpcHorizon, setMpcHorizon] = useState(10);

  const step2Ref = useRef<HTMLDivElement>(null);
  const pvRef = useRef(currentPV);
  pvRef.current = currentPV;

  // Generate input preview whenever parameters change
  const generatePreview = useCallback(() => {
    let sig: number[] = [];
    if (inputType === 'step') sig = generateStepSignal(stepParams);
    else if (inputType === 'multistep') sig = generateMultiStepSignal(multiStepParams);
    else if (inputType === 'prbs') sig = generatePRBSSignal(prbsParams);
    else if (inputType === 'sinusoidal') sig = generateSinusoidalSignal(sinParams);
    setPreviewSignal(sig);
    signalQueueRef.current = sig;
  }, [inputType, stepParams, multiStepParams, prbsParams, sinParams]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  useEffect(() => {
    return () => {
      if (collectionTimerRef.current) clearInterval(collectionTimerRef.current);
    };
  }, []);

  const writeOP = useCallback(
    async (op: number) => {
      const svc = DeltaDTBService.getInstance();
      await svc.writeRegister('op', Math.max(0, Math.min(100, op)), deviceId);
    },
    [deviceId]
  );

  // ============================================================
  //  Action: START Collection
  // ============================================================
  const handleStart = useCallback(async () => {
    if (!isConnected || !isRunning) {
      alert('Please ensure COM port is connected and the trainer is RUNNING.');
      return;
    }
    await onSetManual();

    let sig: number[] = [];
    if (inputType === 'step') sig = generateStepSignal(stepParams);
    else if (inputType === 'multistep') sig = generateMultiStepSignal(multiStepParams);
    else if (inputType === 'prbs') sig = generatePRBSSignal(prbsParams);
    else if (inputType === 'sinusoidal') sig = generateSinusoidalSignal(sinParams);

    signalQueueRef.current = sig;
    setCollectedData([]);
    collectTimeRef.current = 0;
    setCurrentPlaybackTime(0);
    setIsCollecting(true);

    if (collectionTimerRef.current) clearInterval(collectionTimerRef.current);

    collectionTimerRef.current = window.setInterval(async () => {
      const idx = collectTimeRef.current;
      const queue = signalQueueRef.current;

      if (idx >= queue.length) {
        clearInterval(collectionTimerRef.current!);
        setIsCollecting(false);
        // Automatically scroll to and prompt for training in Step 2
        step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const opVal = queue[idx];
      await writeOP(opVal);

      const pv = pvRef.current;
      setCollectedData((prev) => [...prev, { time: idx, pv, op: opVal }]);
      setCurrentPlaybackTime(idx);
      collectTimeRef.current += 1;
    }, 1000);
  }, [isConnected, isRunning, inputType, stepParams, multiStepParams, prbsParams, sinParams, onSetManual, writeOP]);

  // ============================================================
  //  Action: STOP Collection -> Proceeds to Training
  // ============================================================
  const handleStop = useCallback(() => {
    if (collectionTimerRef.current) clearInterval(collectionTimerRef.current);
    setIsCollecting(false);
    // On Stop, it has to go for training
    step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ============================================================
  //  Action: RESET Collection -> Repeats from Beginning
  // ============================================================
  const handleReset = useCallback(async () => {
    if (collectionTimerRef.current) clearInterval(collectionTimerRef.current);
    setIsCollecting(false);
    setCollectedData([]);
    collectTimeRef.current = 0;
    setCurrentPlaybackTime(-1);
    setTrainProgress(0);
    setTrainLoss(null);
    setModelReady(false);
    setNNWeights(null);

    // Reset OP back to initial value
    const initialOP =
      inputType === 'step'
        ? stepParams.initialValue
        : inputType === 'multistep'
        ? multiStepParams.initialValue
        : inputType === 'prbs'
        ? prbsParams.minValue
        : sinParams.reference;

    await writeOP(initialOP);
  }, [inputType, stepParams, multiStepParams, prbsParams, sinParams, writeOP]);

  // ============================================================
  //  Action: Export to Excel
  // ============================================================
  const handleExportExcel = useCallback(() => {
    if (collectedData.length === 0) {
      alert('No data collected yet. Please run data collection first.');
      return;
    }
    downloadDatasetAsExcel(collectedData, inputType);
  }, [collectedData, inputType]);

  // ============================================================
  //  Action: Import Dataset from File (CSV, TXT, JSON)
  // ============================================================
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // 1. JSON Format
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const samples: DataSample[] = parsed.map((item, idx) => ({
              time: typeof item.time === 'number' ? item.time : idx,
              op: typeof item.op === 'number' ? item.op : 0,
              pv: typeof item.pv === 'number' ? item.pv : 0,
            }));
            setCollectedData(samples);
            setModelReady(false);
            setTrainProgress(0);
            setTrainLoss(null);
            setTimeout(() => {
              step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            alert(`✅ Successfully imported ${samples.length} samples from JSON! Ready for Model Generation.`);
            return;
          }
        }

        // 2. CSV / TXT Format
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length === 0) return;

        let startIndex = 0;
        let timeCol = -1;
        let opCol = -1;
        let pvCol = -1;

        const firstCols = lines[0].split(/[,\t]/).map((c) => c.trim().toLowerCase());
        firstCols.forEach((colName, idx) => {
          if (colName.includes('time') || colName === 't') timeCol = idx;
          else if (colName.includes('op') || colName.includes('output') || colName === 'u') opCol = idx;
          else if (colName.includes('pv') || colName.includes('process') || colName === 'y') pvCol = idx;
        });

        if (timeCol !== -1 && opCol !== -1 && pvCol !== -1) {
          startIndex = 1; // Header detected
        } else {
          if (isNaN(Number(firstCols[0]))) {
            startIndex = 1;
          }
          if (firstCols.length >= 4) {
            timeCol = 1;
            opCol = 2;
            pvCol = 3;
          } else {
            timeCol = 0;
            opCol = 1;
            pvCol = 2;
          }
        }

        const samples: DataSample[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(/[,\t]/).map((c) => c.trim());
          if (parts.length > Math.max(timeCol, opCol, pvCol)) {
            const t = parseFloat(parts[timeCol]);
            const u = parseFloat(parts[opCol]);
            const y = parseFloat(parts[pvCol]);
            if (!isNaN(t) && !isNaN(u) && !isNaN(y)) {
              samples.push({ time: t, op: u, pv: y });
            }
          }
        }

        if (samples.length > 0) {
          setCollectedData(samples);
          setModelReady(false);
          setTrainProgress(0);
          setTrainLoss(null);
          setTimeout(() => {
            step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          alert(`✅ Successfully imported ${samples.length} data samples! Ready for Model Generation.`);
        } else {
          alert('Could not parse any valid data rows. Ensure the CSV contains Time, OP, and PV columns.');
        }
      } catch (err) {
        alert('Failed to parse file: ' + String(err));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // ============================================================
  //  Action: Generate Model (Training with User Hyperparameters)
  // ============================================================
  const handleTrainModel = useCallback(async () => {
    if (collectedData.length < 2) {
      alert('Please collect or import at least 2 data samples before generating the model.');
      return;
    }
    setIsTraining(true);
    setTrainProgress(0);
    setTrainLoss(null);
    setModelReady(false);

    const pairs: { y: number; u: number; target: number }[] = [];
    for (let i = 0; i < collectedData.length - 1; i++) {
      pairs.push({
        y: collectedData[i].pv,
        u: collectedData[i].op,
        target: (collectedData[i + 1].pv - collectedData[i].pv) * 10,
      });
    }

    let weights = createModel(2, 1, hiddenNeurons);
    const EPOCHS = epochs;
    const LR = learningRate;
    const BATCH_SIZE = batchSize;

    let epoch = 0;
    let totalLoss = 0;

    const runEpochChunk = () => {
      if (epoch >= EPOCHS) {
        setTrainProgress(100);
        setTrainLoss(totalLoss / pairs.length);
        setNNWeights(weights);
        setModelReady(true);
        setIsTraining(false);
        return;
      }

      const shuffled = [...pairs].sort(() => Math.random() - 0.5);
      totalLoss = 0;
      for (let b = 0; b < shuffled.length; b += BATCH_SIZE) {
        const batch = shuffled.slice(b, b + BATCH_SIZE);
        for (const sample of batch) {
          const result = trainStep(
            weights,
            sample.y,
            sample.u,
            sample.target,
            LR,
            activationFunc
          );
          weights = result.weights;
          totalLoss += result.loss;
        }
      }

      epoch++;
      setTrainProgress(Math.round((epoch / EPOCHS) * 100));
      setTrainLoss(totalLoss / pairs.length);
      setTimeout(runEpochChunk, 0);
    };

    setTimeout(runEpochChunk, 10);
  }, [collectedData, hiddenNeurons, epochs, learningRate, batchSize, activationFunc]);

  // ============================================================
  //  Action: Export ONNX Model
  // ============================================================
  const handleExportONNX = useCallback(() => {
    if (!nnWeights || !modelReady) {
      alert('Please generate the model first before exporting the ONNX file.');
      return;
    }
    downloadONNXFile(nnWeights, selectedLogic);
  }, [nnWeights, modelReady, selectedLogic]);

  // ============================================================
  //  Action: Realtime Model Validation on Main Screen
  // ============================================================
  const handleValidateOnMainScreen = useCallback(() => {
    if (!nnWeights || !modelReady) {
      alert('Please train and generate the model first.');
      return;
    }
    onStartValidationOnMainScreen({
      weights: nnWeights,
      logic: selectedLogic,
      setpoint: targetSetpoint,
      horizon: mpcHorizon,
    });
  }, [nnWeights, modelReady, selectedLogic, targetSetpoint, mpcHorizon, onStartValidationOnMainScreen]);

  const canStart = isConnected && isRunning && !isCollecting;
  const canTrain = collectedData.length >= 2 && !isTraining && !isCollecting;

  return (
    <div className="mlc-two-frames-container">
      {/* ══════════════════════════════════════════════════════════
          LEFT FRAME: Step 1 to Step 3
          ══════════════════════════════════════════════════════════ */}
      <div className="mlc-left-frame">
        {/* ── STEP 1: Generate Input — Data Collection ─────────── */}
        <div className="mlc-card-step">
          <div className="mlc-step-header">
            <span className="mlc-step-badge">1</span>
            <span className="mlc-step-title">Generate Input — Data Collection</span>
            <span
              className={`mlc-status-chip ${
                isCollecting ? 'active' : collectedData.length > 0 ? 'done' : ''
              }`}
            >
              {isCollecting
                ? `Recording… ${collectedData.length}s`
                : collectedData.length > 0
                ? `${collectedData.length} samples`
                : 'Idle'}
            </span>
          </div>

          {/* Input Type Selector Tabs */}
          <div className="mlc-tabs-bar">
            {(['step', 'multistep', 'prbs', 'sinusoidal'] as InputType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`mlc-tab-btn ${inputType === t ? 'active' : ''}`}
                onClick={() => setInputType(t)}
                disabled={isCollecting}
              >
                {t === 'step'
                  ? 'Step'
                  : t === 'multistep'
                  ? 'Multi-Step'
                  : t === 'prbs'
                  ? 'PRBS'
                  : 'Sinusoidal'}
              </button>
            ))}
          </div>

          {/* Vertical Parameters Box */}
          <div className="mlc-step1-params-box">
            {inputType === 'step' && (
              <div className="mlc-vertical-inputs">
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Initial Value (%)</span>
                  <LabViewNumericInput
                    value={stepParams.initialValue}
                    min={0}
                    max={100}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setStepParams((p) => ({ ...p, initialValue: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Final Value (%)</span>
                  <LabViewNumericInput
                    value={stepParams.finalValue}
                    min={0}
                    max={100}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setStepParams((p) => ({ ...p, finalValue: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Step Time (s)</span>
                  <LabViewNumericInput
                    value={stepParams.stepTime}
                    min={0}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setStepParams((p) => ({ ...p, stepTime: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">End Time (s)</span>
                  <LabViewNumericInput
                    value={stepParams.endTime}
                    min={1}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setStepParams((p) => ({ ...p, endTime: val }))
                    }
                  />
                </div>
              </div>
            )}

            {inputType === 'multistep' && (
              <div className="mlc-vertical-inputs">
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Initial Value (%)</span>
                  <LabViewNumericInput
                    value={multiStepParams.initialValue}
                    min={0}
                    max={100}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setMultiStepParams((p) => ({ ...p, initialValue: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Start Time (s)</span>
                  <LabViewNumericInput
                    value={multiStepParams.startTime}
                    min={0}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setMultiStepParams((p) => ({ ...p, startTime: val }))
                    }
                  />
                </div>
                <div className="mlc-multistep-container">
                  <div className="mlc-multistep-header">
                    <span>#</span>
                    <span>End Time (s)</span>
                    <span>Amp (%)</span>
                    <span />
                  </div>
                  {multiStepParams.steps.map((st, i) => (
                    <div key={i} className="mlc-multistep-row">
                      <span>#{i + 1}</span>
                      <input
                        type="number"
                        min={0}
                        value={st.endTime}
                        disabled={isCollecting}
                        onChange={(e) =>
                          setMultiStepParams((p) => ({
                            ...p,
                            steps: p.steps.map((s, idx) =>
                              idx === i ? { ...s, endTime: +e.target.value } : s
                            ),
                          }))
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={st.amplitude}
                        disabled={isCollecting}
                        onChange={(e) =>
                          setMultiStepParams((p) => ({
                            ...p,
                            steps: p.steps.map((s, idx) =>
                              idx === i ? { ...s, amplitude: +e.target.value } : s
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="btn-del"
                        disabled={isCollecting}
                        onClick={() =>
                          setMultiStepParams((p) => ({
                            ...p,
                            steps: p.steps.filter((_, idx) => idx !== i),
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add-step"
                    disabled={isCollecting}
                    onClick={() => {
                      const lastEnd =
                        multiStepParams.steps.length > 0
                          ? multiStepParams.steps[multiStepParams.steps.length - 1]
                              .endTime + 60
                          : 60;
                      setMultiStepParams((p) => ({
                        ...p,
                        steps: [...p.steps, { endTime: lastEnd, amplitude: 50 }],
                      }));
                    }}
                  >
                    + Add Step
                  </button>
                </div>
              </div>
            )}

            {inputType === 'prbs' && (
              <div className="mlc-vertical-inputs">
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Min Value (%)</span>
                  <LabViewNumericInput
                    value={prbsParams.minValue}
                    min={0}
                    max={100}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setPrbsParams((p) => ({ ...p, minValue: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Max Value (%)</span>
                  <LabViewNumericInput
                    value={prbsParams.maxValue}
                    min={0}
                    max={100}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setPrbsParams((p) => ({ ...p, maxValue: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Min Period (s)</span>
                  <LabViewNumericInput
                    value={prbsParams.minPeriod}
                    min={1}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setPrbsParams((p) => ({ ...p, minPeriod: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">End Time (s)</span>
                  <LabViewNumericInput
                    value={prbsParams.endTime}
                    min={1}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setPrbsParams((p) => ({ ...p, endTime: val }))
                    }
                  />
                </div>
              </div>
            )}

            {inputType === 'sinusoidal' && (
              <div className="mlc-vertical-inputs">
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Period (s)</span>
                  <LabViewNumericInput
                    value={sinParams.period}
                    min={1}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setSinParams((p) => ({ ...p, period: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Amplitude (%)</span>
                  <LabViewNumericInput
                    value={sinParams.amplitude}
                    min={0}
                    max={50}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setSinParams((p) => ({ ...p, amplitude: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">Reference (%)</span>
                  <LabViewNumericInput
                    value={sinParams.reference}
                    min={0}
                    max={100}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setSinParams((p) => ({ ...p, reference: val }))
                    }
                  />
                </div>
                <div className="mlc-input-row">
                  <span className="mlc-field-label">End Time (s)</span>
                  <LabViewNumericInput
                    value={sinParams.endTime}
                    min={1}
                    disabled={isCollecting}
                    onChange={(val) =>
                      setSinParams((p) => ({ ...p, endTime: val }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: START, STOP, RESET, and Excel Export */}
          <div className="mlc-buttons-cluster">
            {!isCollecting ? (
              <button
                type="button"
                className="mlc-btn mlc-btn-start"
                onClick={handleStart}
                disabled={!canStart}
                title="Start writing discrete OP values to hardware and logging PV"
              >
                ▶ Start
              </button>
            ) : (
              <button
                type="button"
                className="mlc-btn mlc-btn-stop"
                onClick={handleStop}
                title="Stop collection and proceed to Step 2 Model Training"
              >
                ■ Stop
              </button>
            )}

            <button
              type="button"
              className="mlc-btn mlc-btn-reset"
              onClick={handleReset}
              title="Reset data collection from beginning"
            >
              ↺ Reset
            </button>

            <button
              type="button"
              className="mlc-btn mlc-btn-import"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCollecting}
              title="Import dataset from CSV or JSON to train model directly"
            >
              📁 Import Data
            </button>

            <button
              type="button"
              className="mlc-btn mlc-btn-excel"
              onClick={handleExportExcel}
              disabled={collectedData.length === 0}
              title="Export recorded Input/Output data to Excel (.csv)"
            >
              📥 Save Data to Excel
            </button>
          </div>
        </div>

        {/* ── STEP 2: Model Generation & Control Logic ─────────── */}
        <div
          ref={step2Ref}
          className={`mlc-card-step ${
            collectedData.length === 0 ? 'mlc-step-dimmed' : ''
          }`}
        >
          <div className="mlc-step-header">
            <span className="mlc-step-badge">2</span>
            <span className="mlc-step-title">Model Generation</span>
            <span
              className={`mlc-status-chip ${
                modelReady ? 'done' : isTraining ? 'active' : ''
              }`}
            >
              {modelReady
                ? 'Model Ready ✓'
                : isTraining
                ? `Training… ${trainProgress}%`
                : collectedData.length > 0
                ? 'Ready to Train'
                : 'Waiting for data'}
            </span>
          </div>

          {/* Hidden File Input for Data Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />

          {/* Control Logic Provision Dropdown (Moved to Step 2 as requested) */}
          <div className="mlc-logic-row">
            <span className="mlc-field-label">Control Logic:</span>
            <select
              className="mlc-logic-dropdown"
              value={selectedLogic}
              disabled={isTraining}
              onChange={(e) => setSelectedLogic(e.target.value as MLLogicType)}
              title="Select Machine Learning Control Logic"
            >
              {ML_LOGIC_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* User-Defined Model Hyperparameters Section */}
          <div className="mlc-hyperparams-card">
            <div className="mlc-hyperparams-header">
              ⚙️ Model Hyperparameters (User Configurable)
            </div>
            <div className="mlc-hyperparams-grid">
              <div className="mlc-hp-item">
                <span className="mlc-hp-label">Hidden Neurons</span>
                <select
                  value={hiddenNeurons}
                  disabled={isTraining}
                  onChange={(e) => setHiddenNeurons(+e.target.value)}
                >
                  <option value={16}>16 Neurons</option>
                  <option value={32}>32 Neurons</option>
                  <option value={64}>64 Neurons (Default)</option>
                  <option value={128}>128 Neurons</option>
                </select>
              </div>

              <div className="mlc-hp-item">
                <span className="mlc-hp-label">Activation</span>
                <select
                  value={activationFunc}
                  disabled={isTraining}
                  onChange={(e) => setActivationFunc(e.target.value as ActivationFunction)}
                >
                  <option value="relu">ReLU (Standard)</option>
                  <option value="tanh">Tanh (Smooth)</option>
                  <option value="sigmoid">Sigmoid</option>
                </select>
              </div>

              <div className="mlc-hp-item">
                <span className="mlc-hp-label">Epochs</span>
                <input
                  type="number"
                  min={10}
                  max={500}
                  step={10}
                  value={epochs}
                  disabled={isTraining}
                  onChange={(e) =>
                    setEpochs(Math.max(10, Math.min(500, +e.target.value || 10)))
                  }
                />
              </div>

              <div className="mlc-hp-item">
                <span className="mlc-hp-label">Learning Rate</span>
                <select
                  value={learningRate}
                  disabled={isTraining}
                  onChange={(e) => setLearningRate(+e.target.value)}
                >
                  <option value={0.0005}>0.0005 (Fine)</option>
                  <option value={0.001}>0.001 (Standard)</option>
                  <option value={0.005}>0.005 (Fast)</option>
                  <option value={0.01}>0.01 (Aggressive)</option>
                </select>
              </div>

              <div className="mlc-hp-item">
                <span className="mlc-hp-label">Batch Size</span>
                <select
                  value={batchSize}
                  disabled={isTraining}
                  onChange={(e) => setBatchSize(+e.target.value)}
                >
                  <option value={16}>16 Pairs</option>
                  <option value={32}>32 Pairs (Default)</option>
                  <option value={64}>64 Pairs</option>
                </select>
              </div>
            </div>
          </div>

          {/* Model Architecture & Training Summary */}
          <div className="mlc-info-summary">
            <div className="mlc-info-line">
              <span className="info-tag">Target Architecture:</span>
              <span className="info-val">
                {selectedLogic === 'mpc' &&
                  `Residual Model: FC(2→${hiddenNeurons}) → ${activationFunc.toUpperCase()} → FC(${hiddenNeurons}→${hiddenNeurons}) → ${activationFunc.toUpperCase()} → FC(${hiddenNeurons}→1)`}
                {selectedLogic === 'pid_autotuning' &&
                  `Gain Estimator: FC(2→${hiddenNeurons}) → ${activationFunc.toUpperCase()} → Gains(Kp, Ti, Td)`}
                {selectedLogic === 'inverse_dynamics' &&
                  `Direct Inverse Plant: FC(2→${hiddenNeurons}) → ${activationFunc.toUpperCase()} → OP Feedforward`}
                {selectedLogic === 'rl_ddpg' &&
                  `Continuous Actor Policy: FC(2→${hiddenNeurons}) → ${activationFunc.toUpperCase()} → Action(Δu)`}
                {selectedLogic === 'lstm_predictive' &&
                  `Recurrent Sequential Estimator: Hidden(${hiddenNeurons}) → Horizon Trend`}
              </span>
            </div>
            <div className="mlc-info-line">
              <span className="info-tag">Training Samples:</span>
              <span className="info-val">
                {Math.max(0, collectedData.length - 1)} pairs
              </span>
            </div>
            {trainLoss !== null && (
              <div className="mlc-info-line">
                <span className="info-tag">Final MSE Loss:</span>
                <span className="info-val highlight">{trainLoss.toFixed(6)}</span>
              </div>
            )}
          </div>

          {isTraining && (
            <div className="mlc-progress-wrap">
              <div
                className="mlc-progress-fill"
                style={{ width: `${trainProgress}%` }}
              />
              <span className="mlc-progress-text">{trainProgress}%</span>
            </div>
          )}

          {/* Buttons: Generate Model & Export ONNX */}
          <div className="mlc-buttons-cluster">
            <button
              type="button"
              className="mlc-btn mlc-btn-train"
              onClick={handleTrainModel}
              disabled={!canTrain}
              title={
                collectedData.length < 2
                  ? 'Collect or import data samples first'
                  : 'Train neural network model'
              }
            >
              ⚙ Generate Model
            </button>

            <button
              type="button"
              className="mlc-btn mlc-btn-onnx"
              onClick={handleExportONNX}
              disabled={!modelReady}
              title={
                !modelReady
                  ? 'Generate model first to export ONNX'
                  : 'Download standard .onnx neural network model'
              }
            >
              💾 Export ONNX Model (.onnx)
            </button>
          </div>
        </div>

        {/* ── STEP 3: Real-Time Model Validation ───────────────── */}
        <div
          className={`mlc-card-step ${!modelReady ? 'mlc-step-dimmed' : ''}`}
        >
          <div className="mlc-step-header">
            <span className="mlc-step-badge">3</span>
            <span className="mlc-step-title">Real-Time Model Validation</span>
            <span
              className={`mlc-status-chip ${modelReady ? 'ready' : ''}`}
            >
              {modelReady ? 'Validation Ready' : 'Train model first'}
            </span>
          </div>

          <div className="mlc-val-inputs-grid">
            <div className="mlc-input-row">
              <span className="mlc-field-label">Target Setpoint (%)</span>
              <LabViewNumericInput
                value={targetSetpoint}
                min={0}
                max={100}
                onChange={(val) => setTargetSetpoint(val)}
              />
            </div>

            {(selectedLogic === 'mpc' || selectedLogic === 'lstm_predictive') && (
              <div className="mlc-input-row">
                <span className="mlc-field-label">Prediction Horizon (steps)</span>
                <LabViewNumericInput
                  value={mpcHorizon}
                  min={1}
                  max={20}
                  onChange={(val) => setMpcHorizon(val)}
                />
              </div>
            )}
          </div>

          <div className="mlc-buttons-cluster">
            <button
              type="button"
              className="mlc-btn mlc-btn-validate-main"
              onClick={handleValidateOnMainScreen}
              disabled={!modelReady || !isConnected || !isRunning}
              title="Go to main screen to run realtime model validation on live plant"
            >
              🚀 Start Realtime Model Validation on Main Screen
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          RIGHT FRAME: Two Halves (Input Profile Top, Realtime Bottom)
          ══════════════════════════════════════════════════════════ */}
      <div className="mlc-right-frame">
        {/* Top Half: Entire Input Signal vs Time */}
        <div className="mlc-chart-half top-half">
          <SignalProfileChart
            data={previewSignal}
            currentTime={currentPlaybackTime}
            isCollecting={isCollecting}
          />
        </div>

        {/* Bottom Half: Real-time PV and OP Values */}
        <div className="mlc-chart-half bottom-half">
          <RealtimeResponseChart
            data={collectedData}
            isCollecting={isCollecting}
            currentPV={currentPV}
            currentOP={currentOP}
          />
        </div>
      </div>
    </div>
  );
};
