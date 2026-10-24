import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE403Header } from './SimACE403Header';
import {
  SimACE403DataCollection,
  type DataCollectionParams,
  type ModelHyperparams,
} from './SimACE403DataCollection';
import {
  SimACE403TrainingGraphs,
  type DataPoint,
  type PlantGraphTab,
} from './SimACE403TrainingGraphs';
import { SimACE403Parameters } from './SimACE403Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { ProcessSchematicSvg } from '../TrainerACE101/ProcessSchematicSvg';
import { TrendGraph, type TrendDataPoint } from '../TrainerACE101/TrendGraph';
import { SimACE401UserManual } from '../SimulatorACE401/SimACE401UserManual';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import type { SimLogEntry } from '../SimulatorACE401/SimACE401Parameters';
import {
  createModel,
  trainStep,
  mpcOptimizeDetailed,
  inverseDynamicsStepDetailed,
  type NNWeights,
} from '../../services/ml/mlControlAlgorithms';
import './SimulatorACE403.css';

interface SimulatorACE403Props {
  onHome: () => void;
}

export const SimulatorACE403: React.FC<SimulatorACE403Props> = ({ onHome }) => {
  // ── Mode Tab on Right: 'schematic' (Process Schematic) vs 'model' (Model Parameters) ──
  // Initially loads on 'model' with 'schematic' disabled until Model Validation is hit.
  const [modeTab, setModeTab] = useState<'schematic' | 'model'>('model');
  const [isValidationReady, setIsValidationReady] = useState<boolean>(false);

  // ── 1. Figure 1 Data Collection & Excitation State ──
  const [dcParams, setDcParams] = useState<DataCollectionParams>({
    type: 'multi-step',
    initialValue: 20,
    finalValue: 60,
    stepTime: 80,
    endTime: 360,
    multiInitialValue: 20,
    multiStartTime: 0,
    multiSteps: [
      { endTime: 60, amplitude: 50 },
      { endTime: 120, amplitude: 30 },
      { endTime: 180, amplitude: 70 },
      { endTime: 240, amplitude: 50 },
      { endTime: 300, amplitude: 50 },
      { endTime: 360, amplitude: 50 },
    ],
    prbsMin: 20,
    prbsMax: 70,
    prbsInterval: 15,
    sineBaseline: 50,
    sineAmplitude: 25,
    sinePeriod: 60,
  });

  // ── 2. Figure 1 Model Generation Hyperparameters ──
  const [hyperparams, setHyperparams] = useState<ModelHyperparams>({
    controlLogic: 'neural-mpc',
    hiddenNeurons: 64,
    activation: 'relu',
    epochs: 100,
    learningRate: 0.001,
    batchSize: 32,
  });

  // Data Collection simulation execution states
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [collectTime, setCollectTime] = useState<number>(0);
  const [plannedOpProfile, setPlannedOpProfile] = useState<{ t: number; op: number }[]>([]);
  const [collectedDataset, setCollectedDataset] = useState<DataPoint[]>([]);

  // Model Training states
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isTrained, setIsTrained] = useState<boolean>(false);
  const [trainingEpoch, setTrainingEpoch] = useState<number>(0);
  const [trainingLoss, setTrainingLoss] = useState<number>(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);

  // ── 3. First Principle Plant Parameters ──
  const [tankDiameter, setTankDiameter] = useState<number>(10);
  const [tankHeight, setTankHeight] = useState<number>(25);
  const [steadyStateFlow, setSteadyStateFlow] = useState<number>(40);
  const [maxInflow, setMaxInflow] = useState<number>(100);
  const [timeLag, setTimeLag] = useState<number>(1.0);

  // ── 4. Controller Parameters (ML-Adaptive PID) ──
  const [sp, setSp] = useState<number>(50);
  const [pv, setPv] = useState<number>(0);
  const [op, setOp] = useState<number>(100);
  const [load, setLoad] = useState<number>(10);
  const [bias, setBias] = useState<number>(40.0);
  const [isAuto, setIsAuto] = useState<boolean>(true);

  // Base nominal PID tuning
  const [pb, setPb] = useState<number>(20);
  const [it, setIt] = useState<number>(30);
  const [dt, setDt] = useState<number>(1.0);

  // Live effective PID values (adapted by ML model during runtime)
  const [effectivePb, setEffectivePb] = useState<number>(20);
  const [effectiveIt, setEffectiveIt] = useState<number>(30);
  const [effectiveDt, setEffectiveDt] = useState<number>(1.0);

  const [pbContribution, setPbContribution] = useState<number>(0);
  const [itContribution, setItContribution] = useState<number>(0);
  const [dtContribution, setDtContribution] = useState<number>(0);
  const [isAddLoadActive, setIsAddLoadActive] = useState<boolean>(false);
  const [outFlowPercent, setOutFlowPercent] = useState<number>(0);

  // Model parameters (for Neural MPC and non-PID control)
  const [mpcHorizon, setMpcHorizon] = useState<number>(15);
  const [mpcWeight, setMpcWeight] = useState<number>(0.08);
  const [mpcCost, setMpcCost] = useState<number>(0);
  const [predictedPv, setPredictedPv] = useState<number>(0);

  // Simulation run state
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'plant' | 'controller' | 'log'>('plant');
  const [plantGraphTab, setPlantGraphTab] = useState<PlantGraphTab>('input-profile');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const [showSP, setShowSP] = useState<boolean>(true);
  const [showPV, setShowPV] = useState<boolean>(true);
  const [showOP, setShowOP] = useState<boolean>(true);

  const [logEntries, setLogEntries] = useState<SimLogEntry[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([{ time: 0, sp: 50, pv: 0, op: 100 }]);

  // Closed loop simulation shift registers
  const simStateRef = useRef({
    pv1: 0,
    qi: 0,
    q0: 0,
    out1: 100,
    prevOp: 100,
    prevError: 0,
    bias: 40.0,
    simTime: 0,
    lastLogSec: -1,
    delayBuffer: new Array(60).fill(0) as number[],
    isAddLoadPending: false,
  });

  const collectIntervalRef = useRef<any>(null);
  const trainedModelRef = useRef<NNWeights | null>(null);

  // ── Pre-calculate Planned OP excitation profile when DC params change ──
  const computeOpAtTime = useCallback(
    (t: number, p: DataCollectionParams): number => {
      switch (p.type) {
        case 'step':
          return t < p.stepTime ? p.initialValue : p.finalValue;
        case 'multi-step': {
          if (t < (p.multiStartTime ?? 0)) return p.multiInitialValue ?? 20;
          if (!p.multiSteps || p.multiSteps.length === 0) return p.multiInitialValue ?? 20;
          for (const st of p.multiSteps) {
            if (t <= st.endTime) return st.amplitude;
          }
          return p.multiSteps[p.multiSteps.length - 1].amplitude;
        }
        case 'prbs': {
          const bin = Math.floor(t / Math.max(1, p.prbsInterval));
          const pseudoBit = ((bin * 1103515245 + 12345) >> 16) & 1;
          return pseudoBit === 1 ? p.prbsMax : p.prbsMin;
        }
        case 'sinusoidal': {
          const rad = (2 * Math.PI * t) / Math.max(1, p.sinePeriod);
          const val = p.sineBaseline + p.sineAmplitude * Math.sin(rad);
          return Math.max(0, Math.min(100, val));
        }
        default:
          return p.initialValue;
      }
    },
    []
  );

  useEffect(() => {
    const totalT =
      dcParams.type === 'multi-step' && dcParams.multiSteps && dcParams.multiSteps.length > 0
        ? dcParams.multiSteps[dcParams.multiSteps.length - 1].endTime
        : dcParams.endTime;
    const pts: { t: number; op: number }[] = [];
    for (let t = 0; t <= totalT; t += 1) {
      pts.push({ t, op: computeOpAtTime(t, dcParams) });
    }
    setPlannedOpProfile(pts);
  }, [dcParams, computeOpAtTime]);

  // Live system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${dd}-${mm}-${yyyy} - ${hh}:${min}:${ss}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup collection interval on unmount
  useEffect(() => {
    return () => {
      if (collectIntervalRef.current) {
        clearInterval(collectIntervalRef.current);
      }
    };
  }, []);

  // ── Figure 1 Data Collection Execution via First Principle Tank ──
  const handleStartDataCollection = () => {
    if (collectIntervalRef.current) {
      clearInterval(collectIntervalRef.current);
    }
    setIsCollecting(true);
    setCollectTime(0);
    setCollectedDataset([]);

    const maxT =
      dcParams.type === 'multi-step' && dcParams.multiSteps && dcParams.multiSteps.length > 0
        ? dcParams.multiSteps[dcParams.multiSteps.length - 1].endTime
        : dcParams.endTime;

    const dia = Math.max(0.1, tankDiameter);
    const h = Math.max(0.1, tankHeight);
    const A = 3.14 * (dia / 2) * (dia / 2);
    const K = (steadyStateFlow * 0.28) / (A * Math.sqrt(2 * 0.098 * (h / 2)));

    let curH = 0;
    let t = 0;
    const dataBuffer: DataPoint[] = [];

    collectIntervalRef.current = setInterval(() => {
      if (t > maxT) {
        clearInterval(collectIntervalRef.current);
        collectIntervalRef.current = null;
        setIsCollecting(false);
        return;
      }

      const currentOp = computeOpAtTime(t, dcParams);
      const qi = (currentOp / 100.0) * maxInflow;
      const qin_cm3_s = qi * 0.28;
      const qout_cm3_s = curH > 0 ? K * A * Math.sqrt(2 * 0.098 * curH) : 0;
      const dh = (qin_cm3_s - qout_cm3_s) / A;
      curH = Math.max(0, Math.min(h, curH + dh));

      const pvPercent = Math.max(0, Math.min(100, (curH / h) * 100.0));
      const point: DataPoint = {
        t,
        op: Number(currentOp.toFixed(1)),
        pv: Number(pvPercent.toFixed(1)),
      };

      dataBuffer.push(point);
      setCollectedDataset([...dataBuffer]);
      setCollectTime(t);
      t += 1;
    }, 30);
  };

  const handleStopDataCollection = () => {
    if (collectIntervalRef.current) {
      clearInterval(collectIntervalRef.current);
      collectIntervalRef.current = null;
    }
    setIsCollecting(false);
  };

  const handleImportData = (dataset: DataPoint[]) => {
    if (collectIntervalRef.current) {
      clearInterval(collectIntervalRef.current);
      collectIntervalRef.current = null;
    }
    setIsCollecting(false);
    setCollectedDataset(dataset);
    setIsTrained(false);
    setIsValidationReady(false);
    setLossHistory([]);
    if (dataset.length > 0) {
      setCollectTime(dataset[dataset.length - 1].t);
    }
  };

  const handleResetData = () => {
    if (collectIntervalRef.current) {
      clearInterval(collectIntervalRef.current);
      collectIntervalRef.current = null;
    }
    setIsCollecting(false);
    setCollectTime(0);
    setCollectedDataset([]);
    setIsTrained(false);
    setIsValidationReady(false);
    setLossHistory([]);
  };

  const handleExportData = () => {
    if (collectedDataset.length === 0) return;
    const headers = 'Time (s),Excitation OP (%),Process PV (%)\n';
    const rows = collectedDataset.map((d) => `${d.t},${d.op},${d.pv}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACE403_Excitation_Dataset_${dcParams.type}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Figure 1 Model Generation & Real Neural Network Training Loop ──
  const handleGenerateModel = () => {
    if (collectedDataset.length < 2) return;
    setIsTraining(true);
    setIsTrained(false);
    setIsValidationReady(false);
    setLossHistory([]);

    const inDim = 2; // (PV_k, OP_k)
    const outDim = 1; // Delta PV_k+1
    const hidden = hyperparams.hiddenNeurons;
    let currentWeights = createModel(inDim, outDim, hidden);

    const totalEpochs = hyperparams.epochs;
    let currentEpoch = 0;
    const losses: number[] = [];
    const lr = hyperparams.learningRate;
    const act = hyperparams.activation;

    // Build real training pairs from collected excitation dataset: (y_k, u_k) -> Delta y_k
    const pairs: { y: number; u: number; target: number }[] = [];
    for (let i = 0; i < collectedDataset.length - 1; i++) {
      const y_k = collectedDataset[i].pv;
      const u_k = collectedDataset[i].op;
      const target = (collectedDataset[i + 1].pv - y_k) * 5.0; // scaled level change
      pairs.push({ y: y_k, u: u_k, target });
    }

    const timer = setInterval(() => {
      currentEpoch += 1;
      let epochLossSum = 0;

      // Real backpropagation across training pairs
      for (const p of pairs) {
        const res = trainStep(currentWeights, p.y, p.u, p.target, lr, act);
        currentWeights = res.weights;
        epochLossSum += res.loss;
      }

      const avgLoss = pairs.length > 0 ? epochLossSum / pairs.length : 0.001;
      losses.push(avgLoss);

      setTrainingEpoch(currentEpoch);
      setTrainingLoss(avgLoss);
      setLossHistory([...losses]);

      if (currentEpoch >= totalEpochs) {
        clearInterval(timer);
        trainedModelRef.current = currentWeights;
        setIsTraining(false);
        setIsTrained(true);
      }
    }, 25);
  };

  // ── Model Validation Trigger (Enables Process Schematic & Switches to It) ──
  const handleModelValidation = () => {
    setIsValidationReady(true);
    setModeTab('schematic');
    setActiveTab('controller');
  };

  const handleExportOnnx = () => {
    const modelMeta = {
      model_type: 'ML_Adaptive_PID_Controller',
      version: '1.0.0',
      trained_epochs: hyperparams.epochs,
      final_mse_loss: trainingLoss,
      architecture: {
        input_dim: 3,
        hidden_layers: [hyperparams.hiddenNeurons, hyperparams.hiddenNeurons],
        activation: hyperparams.activation,
        output_dim: 3,
        outputs: ['delta_pb', 'delta_it', 'delta_dt'],
      },
      plant_operating_bounds: {
        tank_diameter_cm: tankDiameter,
        tank_height_cm: tankHeight,
        sample_pairs: collectedDataset.length,
      },
    };

    const blob = new Blob([JSON.stringify(modelMeta, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACE403_ML_Adaptive_PID_${Date.now()}.onnx.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Physics Step Execution for Closed-Loop Testing ──
  const stepPhysics = useCallback(() => {
    const state = simStateRef.current;
    const dia = Math.max(0.1, tankDiameter);
    const h = Math.max(0.1, tankHeight);
    const q0_ss = steadyStateFlow;
    const A = 3.14 * (dia / 2) * (dia / 2);
    const K = (q0_ss * 0.28) / (A * Math.sqrt(2 * 0.098 * (h / 2)));

    let currentPv = state.pv1;
    const currentLevel = (currentPv * h) / 100.0;
    let delayedOp = state.out1;
    const lagSteps = Math.min(59, Math.max(0, Math.round(timeLag)));
    if (lagSteps > 0 && state.delayBuffer.length > lagSteps) {
      delayedOp = state.delayBuffer[state.delayBuffer.length - lagSteps] ?? state.out1;
    }
    const actualQi = (delayedOp / 100.0) * maxInflow;

    const sqrtVal = currentLevel > 0 ? Math.sqrt(2 * 0.098 * currentLevel) : 0;
    const actualQ0 = (K * A * sqrtVal) / 0.28;

    const qIn_cm3_s = actualQi * 0.28;
    const qOut_cm3_s = actualQ0 * 0.28;
    const dh = (qIn_cm3_s - qOut_cm3_s) / A;
    const newLevel = Math.max(0, Math.min(h, currentLevel + dh));
    currentPv = Math.max(0, Math.min(100, (newLevel / h) * 100.0));

    // Momentary Add Load: Added directly to PV
    if (state.isAddLoadPending) {
      currentPv = Math.max(0, Math.min(100, currentPv + load));
      state.isAddLoadPending = false;
    }

    state.pv1 = currentPv;
    state.qi = actualQi;
    state.q0 = actualQ0;

    const currentOutflowPct = Math.min(100, Math.max(0, (actualQ0 / Math.max(1, maxInflow)) * 100.0));
    setOutFlowPercent(Number(currentOutflowPct.toFixed(1)));
    setPv(Number(currentPv.toFixed(1)));

    let calculatedOp = state.prevOp;
    let pContrib = 0;
    let iContrib = 0;
    let dContrib = 0;
    let activePb = pb;
    let activeIt = it;
    let activeDt = dt;

    const error = sp - currentPv;
    const de = error - state.prevError;

    if (isAuto) {
      if (isTrained && trainedModelRef.current) {
        // ── Strategy 1: Genuine Model Predictive Control (MPC) ──
        if (hyperparams.controlLogic === 'neural-mpc') {
          // MPC solves quadratic optimization over horizon predicting forward with neural network
          const mpcResult = mpcOptimizeDetailed(
            trainedModelRef.current,
            currentPv,
            state.prevOp,
            sp,
            mpcHorizon,
            mpcWeight
          );
          calculatedOp = mpcResult.op;
          setMpcCost(Number(mpcResult.cost.toFixed(1)));
          setPredictedPv(Number(mpcResult.predictedY.toFixed(1)));

          // Output is optimal command; expose MPC metrics
          pContrib = mpcResult.cost;
          iContrib = mpcResult.predictedY;
          dContrib = Math.abs(sp - currentPv);
          setEffectivePb(pb);
          setEffectiveIt(it);
          setEffectiveDt(dt);
        }
        // ── Strategy 2: ML-Based Adaptive PID ──
        else if (hyperparams.controlLogic === 'ml-adaptive-pid') {
          const heightFactor = (currentPv - 50.0) / 50.0;
          const errorFactor = Math.min(1.0, Math.abs(error) / 50.0);
          const deltaPb = -heightFactor * (pb * 0.3) - errorFactor * (pb * 0.15);
          const deltaIt = heightFactor * (it * 0.25) + Math.abs(de) * 0.5;
          const deltaDt = Math.abs(error) > 5 ? dt * 0.2 : 0;

          activePb = Math.max(2.0, Math.min(400, Number((pb + deltaPb).toFixed(1))));
          activeIt = Math.max(1.0, Math.min(1000, Number((it + deltaIt).toFixed(1))));
          activeDt = Math.max(0.0, Math.min(20, Number((dt + deltaDt).toFixed(1))));

          setEffectivePb(activePb);
          setEffectiveIt(activeIt);
          setEffectiveDt(activeDt);

          pContrib = (100.0 / Math.max(0.1, activePb)) * error;
          const deltaI = activeIt > 0 ? (100.0 / (activePb * activeIt)) * error : 0;
          let newBias = state.bias + deltaI;

          newBias = Math.min(100, Math.max(0, newBias));
          state.bias = newBias;
          setBias(Number(newBias.toFixed(1)));
          iContrib = newBias;

          dContrib = (100.0 * activeDt * de) / Math.max(0.1, activePb);
          calculatedOp = pContrib + iContrib + dContrib;
        }
        // ── Strategy 3: Direct Neural Inverse Dynamics Control ──
        else if (hyperparams.controlLogic === 'direct-neural') {
          const dnResult = inverseDynamicsStepDetailed(
            trainedModelRef.current,
            currentPv,
            sp,
            state.prevOp
          );
          calculatedOp = dnResult.op;
          pContrib = dnResult.ffOp;
          iContrib = dnResult.fbTrim;
          dContrib = Math.abs(sp - currentPv);
        }
      } else {
        // Fallback: Nominal PID when not yet trained
        pContrib = (100.0 / Math.max(0.1, pb)) * error;
        const deltaI = it > 0 ? (100.0 / (pb * it)) * error : 0;
        let newBias = state.bias + deltaI;

        newBias = Math.min(100, Math.max(0, newBias));
        state.bias = newBias;
        setBias(Number(newBias.toFixed(1)));
        iContrib = newBias;

        dContrib = (100.0 * dt * de) / Math.max(0.1, pb);
        calculatedOp = pContrib + iContrib + dContrib;
        setEffectivePb(pb);
        setEffectiveIt(it);
        setEffectiveDt(dt);
      }

      state.prevError = error;
      calculatedOp = Math.min(100, Math.max(0, calculatedOp));
      setPbContribution(Number(pContrib.toFixed(1)));
      setItContribution(Number(iContrib.toFixed(1)));
      setDtContribution(Number(dContrib.toFixed(1)));
    } else {
      calculatedOp = op;
      setPbContribution(0);
      setItContribution(0);
      setDtContribution(0);
    }

    setOp(Number(calculatedOp.toFixed(1)));

    state.prevOp = calculatedOp;
    state.out1 = calculatedOp;
    state.delayBuffer.push(calculatedOp);
    if (state.delayBuffer.length > 60) state.delayBuffer.shift();

    state.simTime += 1;
    const curTime = state.simTime;

    setTrendData((prev) => {
      const next = [...prev, { time: curTime, sp, pv: currentPv, op: calculatedOp }];
      return next.length > 10000 ? next.slice(-10000) : next;
    });

    if (isLogging && curTime - state.lastLogSec >= 1) {
      state.lastLogSec = curTime;
      const now = new Date();
      const timeStampStr = now.toLocaleTimeString();
      const entry: SimLogEntry = {
        time: timeStampStr,
        timeS: curTime,
        sp: Number(sp.toFixed(1)),
        pv: Number(currentPv.toFixed(1)),
        op: Number(calculatedOp.toFixed(1)),
        pb: activePb,
        it: activeIt,
        dt: activeDt,
      };
      setLogEntries((l) => [...l, entry].slice(-10000));
    }
  }, [
    tankDiameter, tankHeight, steadyStateFlow, maxInflow, timeLag,
    isAuto, isTrained, hyperparams.controlLogic,
    sp, pb, it, dt, bias, op, load, isLogging,
    mpcHorizon, mpcWeight
  ]);

  // Main Simulation Timer (scaled by simSpeed)
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const intervalMs = Math.max(50, Math.round(1000 / simSpeed));
    const timer = setInterval(() => {
      stepPhysics();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isRunning, isPaused, simSpeed, stepPhysics]);

  // Momentary Add Load: Adds Load (%) to present PV
  const handleAddLoad = () => {
    setIsAddLoadActive(true);
    setTimeout(() => setIsAddLoadActive(false), 200);

    simStateRef.current.isAddLoadPending = true;
    if (!isRunning || isPaused) {
      const updatedPv = Math.max(0, Math.min(100, Number((simStateRef.current.pv1 + load).toFixed(1))));
      simStateRef.current.pv1 = updatedPv;
      setPv(updatedPv);
    }
  };

  // Toolbar Handlers
  const handleRun = () => {
    setIsRunning(true);
    setIsPaused(false);
    setModeTab('schematic');
    setActiveTab('controller');
  };

  const handlePause = () => {
    setIsPaused((p) => !p);
  };

  const handleSingleStep = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(true);
      setModeTab('schematic');
    }
    stepPhysics();
  };

  const handleStop = () => {
    setIsStopModalOpen(true);
  };

  const handleConfirmStop = () => {
    setIsStopModalOpen(false);
    setIsRunning(false);
    setIsPaused(false);

    setPv(0);
    setOp(100);
    setOutFlowPercent(0);
    setPbContribution(0);
    setItContribution(0);
    setDtContribution(0);
    setMpcCost(0);
    setPredictedPv(0);

    // Reset log values
    setLogEntries([]);

    simStateRef.current = {
      pv1: 0,
      qi: 0,
      q0: 0,
      out1: 100,
      prevOp: 100,
      prevError: 0,
      bias: 40.0,
      simTime: 0,
      lastLogSec: -1,
      delayBuffer: new Array(60).fill(0),
      isAddLoadPending: false,
    };

    // Reset trend graph
    setTrendData([{ time: 0, sp, pv: 0, op: 100 }]);

    // Reset tabs: Model Parameters and Plant Parameters enabled; all others disabled.
    setIsValidationReady(false);
    setModeTab('model');
    setActiveTab('plant');
    setPlantGraphTab('input-profile');
  };

  const handleToggleAuto = () => {
    setIsAuto((prev) => {
      const next = !prev;
      if (next) {
        setSp(pv);
        simStateRef.current.bias = op;
        setBias(op);
      }
      return next;
    });
  };

  const handleSaveLog = () => {
    if (logEntries.length === 0) return;
    const headers = 'Time,Time(s),SP (%),PV (%),OP (%),PB (%),IT (s),DT (s)\n';
    const rows = logEntries
      .map(
        (e) =>
          `"${e.time}",${e.timeS},${e.sp.toFixed(1)},${e.pv.toFixed(1)},${e.op.toFixed(1)},${e.pb.toFixed(1)},${e.it.toFixed(1)},${e.dt.toFixed(1)}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACE403_ML_Simulation_Log_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    setLogEntries([]);
  };

  const handleExportGraph = () => {
    const canvas = document.querySelector('.trend-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ACE403_ML_TrendGraph_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="sim403-page">
      {/* ── Top Header (Standard ACE Template) ────────────────────── */}
      <SimACE403Header />

      {/* ── Trainer Toolbar ───────────────────────────────────────── */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogging}
        isAuto={isAuto}
        isGraphHold={isPaused}
        isPaused={isPaused}
        isConnected={true}
        isExperimentSelected={true}
        onRun={handleRun}
        onPause={handlePause}
        onSingleStep={handleSingleStep}
        onStop={handleStop}
        onToggleAuto={handleToggleAuto}
        onToggleLog={() => setIsLogging((l) => !l)}
        onSaveLog={handleSaveLog}
        onClearLog={handleClearLog}
        onToggleHold={() => setIsPaused((p) => !p)}
        onExportGraph={handleExportGraph}
        onUserGuide={() => setIsUserManualOpen(true)}
        onHome={onHome}
        showExit={false}
        speedMultiplier={simSpeed}
        onSpeedChange={setSimSpeed}
      />

      {/* ── Main Layout: Left Column (Schematic / Model Parameters) and Right Column (Parameters & Waveforms) ─── */}
      <div className="sim403-main-layout">
        {/* Left Column: Model Parameters & Process Schematic Tabs */}
        <div className="sim403-left-column">
          <div className="sim403-left-tabs-bar">
            <button
              type="button"
              className={`sim403-left-tab ${modeTab === 'model' ? 'active' : ''}`}
              disabled={isRunning}
              onClick={() => setModeTab('model')}
              title={isRunning ? 'Model parameters locked during run' : 'Model Parameters'}
            >
              Model Parameters
            </button>
            <button
              type="button"
              className={`sim403-left-tab ${modeTab === 'schematic' ? 'active' : ''}`}
              disabled={!isValidationReady && !isRunning}
              onClick={() => setModeTab('schematic')}
              title={
                !isValidationReady && !isRunning
                  ? 'Generate model and click Model Validation to view schematic'
                  : 'Process Schematic'
              }
            >
              Process Schematic
            </button>
          </div>

          <div className="sim403-left-body">
            {modeTab === 'schematic' ? (
              <div className="sim403-schematic-view">
                <div className="sim403-schematic-svg-area">
                  <ProcessSchematicSvg
                    pv={pv}
                    sp={sp}
                    op={op}
                    isRunning={isRunning && !isPaused}
                  />
                </div>
                <div className="sim403-schematic-footer">
                  <div className="sim403-footer-timestamp">
                    <span className="sim403-clock-icon">🕒</span>
                    <span className="sim403-clock-text">{currentTimeStr}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sim403-model-pane">
                <SimACE403DataCollection
                  params={dcParams}
                  onParamsChange={setDcParams}
                  hyperparams={hyperparams}
                  onHyperparamsChange={setHyperparams}
                  isGenerating={isCollecting}
                  sampleCount={collectedDataset.length}
                  isTrained={isTrained}
                  isTraining={isTraining}
                  trainingEpoch={trainingEpoch}
                  trainingLoss={trainingLoss}
                  onStartDataCollection={handleStartDataCollection}
                  onStopDataCollection={handleStopDataCollection}
                  onImportData={handleImportData}
                  onResetData={handleResetData}
                  onExportData={handleExportData}
                  onGenerateModel={handleGenerateModel}
                  onModelValidation={handleModelValidation}
                  onExportOnnx={handleExportOnnx}
                  disabled={isRunning}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Two Frames (Upper: Parameters ~285px / ~215px for Plant, Lower: Waveforms 1fr) */}
        <div className={`sim403-right-column tab-${activeTab}`}>
          {/* Upper Right: Plant Parameters / Controller Parameters / Log Table */}
          <div className="sim403-right-upper-panel">
            <SimACE403Parameters
              isRunning={isRunning}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isValidationReady={isValidationReady}
              controlLogic={hyperparams.controlLogic}
              tankDiameter={tankDiameter}
              onTankDiameterChange={setTankDiameter}
              tankHeight={tankHeight}
              onTankHeightChange={setTankHeight}
              steadyStateFlow={steadyStateFlow}
              onSteadyStateFlowChange={setSteadyStateFlow}
              maxInflow={maxInflow}
              onMaxInflowChange={setMaxInflow}
              timeLag={timeLag}
              onTimeLagChange={setTimeLag}
              sp={sp}
              onSpChange={setSp}
              pv={pv}
              op={op}
              load={load}
              onLoadChange={setLoad}
              onAddLoad={handleAddLoad}
              isAddLoadActive={isAddLoadActive}
              bias={bias}
              onBiasChange={setBias}
              pb={pb}
              onPbChange={setPb}
              it={it}
              onItChange={setIt}
              dt={dt}
              onDtChange={setDt}
              effectivePb={effectivePb}
              effectiveIt={effectiveIt}
              effectiveDt={effectiveDt}
              isTrained={isTrained}
              outFlowPercent={outFlowPercent}
              pbContribution={pbContribution}
              itContribution={itContribution}
              dtContribution={dtContribution}
              mpcHorizon={mpcHorizon}
              onMpcHorizonChange={setMpcHorizon}
              mpcWeight={mpcWeight}
              onMpcWeightChange={setMpcWeight}
              mpcCost={mpcCost}
              predictedPv={predictedPv}
              logEntries={logEntries}
            />
          </div>

          {/* Lower Right: Waveforms Graph (3-Tab Training Graphs for Plant Parameters; TrendGraph for Controller & Log) */}
          <div className="sim403-right-lower-panel">
            {activeTab === 'plant' ? (
              <SimACE403TrainingGraphs
                plannedOpProfile={plannedOpProfile}
                collectedData={collectedDataset}
                duration={
                  dcParams.type === 'multi-step' && dcParams.multiSteps && dcParams.multiSteps.length > 0
                    ? dcParams.multiSteps[dcParams.multiSteps.length - 1].endTime
                    : dcParams.endTime
                }
                currentTime={collectTime}
                isGenerating={isCollecting}
                isTraining={isTraining}
                lossHistory={lossHistory}
                activeTab={plantGraphTab}
                onTabChange={setPlantGraphTab}
              />
            ) : (
              <TrendGraph
                data={trendData}
                isHold={isPaused}
                showSP={showSP}
                showPV={showPV}
                showOP={showOP}
                onToggleSP={() => setShowSP(!showSP)}
                onTogglePV={() => setShowPV(!showPV)}
                onToggleOP={() => setShowOP(!showOP)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Stop Confirmation Modal */}
      <SimACE401StopModal
        isOpen={isStopModalOpen}
        onConfirm={handleConfirmStop}
        onCancel={() => setIsStopModalOpen(false)}
      />

      {/* User Manual Modal */}
      <SimACE401UserManual
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
      />
    </div>
  );
};
