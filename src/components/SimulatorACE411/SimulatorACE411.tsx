import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE411Header } from './SimACE411Header';
import { SimACE411Schematic } from './SimACE411Schematic';
import { SimACE411Parameters, type SmithLogEntry } from './SimACE411Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimulatorACE411.css';

interface SimulatorACE411Props {
  onHome: () => void;
}

export const SimulatorACE411: React.FC<SimulatorACE411Props> = ({ onHome }) => {
  // Execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Smith Predictor toggle
  const [smithEnabled, setSmithEnabled] = useState<boolean>(true);

  // Primary Controller states
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [sp, setSp] = useState<number>(50.0);
  const [tank1Pv, setTank1Pv] = useState<number>(0.0);
  const [tank2Pv, setTank2Pv] = useState<number>(0.0);
  const [predPv, setPredPv] = useState<number>(0.0);
  const [manualOp, setManualOp] = useState<number>(50.0);
  const [valveOp, setValveOp] = useState<number>(50.0);

  // Controller Tuning
  const [pb, setPb] = useState<number>(30.0);
  const [it, setIt] = useState<number>(25.0);
  const [dt, setDt] = useState<number>(1.0);
  const [loadVal, setLoadVal] = useState<number>(0.0);

  // Smith Predictor Model parameters
  const [modelKm, setModelKm] = useState<number>(1.0);
  const [modelTau1, setModelTau1] = useState<number>(12.0);
  const [modelTau2, setModelTau2] = useState<number>(12.0);
  const [modelTheta, setModelTheta] = useState<number>(5.0);
  const [deadTime, setDeadTime] = useState<number>(5.0);

  // Simulation Internal States & Delay Buffers
  const simStateRef = useRef({
    simTime: 0,
    integral: 0,
    prevError: 0,
    h1: 0,
    h2: 0,
    // Smith internal model states
    mState1: 0,
    ym0: 0,
    // Delay buffers
    pipeBuffer: [] as { time: number; val: number }[],
    modelBuffer: [] as { time: number; val: number }[],
  });

  // History & Log
  const [logEntries, setLogEntries] = useState<SmithLogEntry[]>([]);
  const [trendData, setTrendData] = useState<
    { time: number; sp: number; pv: number; op: number }[]
  >([{ time: 0, sp: 50, pv: 0, op: 50 }]);

  const handleAddLoad = () => {
    setTank2Pv((prev) => Math.max(0, Math.min(100, prev + loadVal)));
    simStateRef.current.h2 = Math.max(
      0,
      Math.min(100, simStateRef.current.h2 + loadVal)
    );
  };

  const handleRun = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const handleConfirmReset = () => {
    setShowStopModal(false);
    setIsRunning(false);
    setIsPaused(false);
    setTank1Pv(0);
    setTank2Pv(0);
    setPredPv(0);
    setValveOp(50);
    simStateRef.current = {
      simTime: 0,
      integral: 0,
      prevError: 0,
      h1: 0,
      h2: 0,
      mState1: 0,
      ym0: 0,
      pipeBuffer: [],
      modelBuffer: [],
    };
    setLogEntries([]);
    setTrendData([{ time: 0, sp, pv: 0, op: 50 }]);
  };

  // Physics & Smith Predictor Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;
      const curT = state.simTime;

      // 1. Compute Smith Predictor predicted feedback signal
      // Undelayed model simulation: G_m0(s) = Km / ((tau1*s + 1)(tau2*s + 1))
      state.mState1 += ((modelKm * valveOp - state.mState1) / Math.max(0.5, modelTau1)) * dtSec;
      state.ym0 += ((state.mState1 - state.ym0) / Math.max(0.5, modelTau2)) * dtSec;
      const ym0 = Math.max(0, Math.min(100, state.ym0));

      // Model delay buffer
      state.modelBuffer.push({ time: curT, val: ym0 });
      while (
        state.modelBuffer.length > 1 &&
        state.modelBuffer[0].time < curT - Math.max(modelTheta, 15)
      ) {
        state.modelBuffer.shift();
      }

      const delayedModelT = curT - modelTheta;
      let ym = ym0;
      if (state.modelBuffer.length > 0) {
        let best = state.modelBuffer[0];
        for (const item of state.modelBuffer) {
          if (item.time <= delayedModelT) best = item;
          else break;
        }
        ym = best.val;
      }

      // Predicted feedback
      const yPredicted = smithEnabled
        ? Math.max(0, Math.min(100, state.h2 + (ym0 - ym)))
        : state.h2;
      setPredPv(yPredicted);

      // 2. Primary PID on predicted signal
      let op = manualOp;
      if (isAuto) {
        const error = sp - yPredicted;
        const kc = 100 / Math.max(1, pb);
        const pTerm = kc * error;

        state.integral += (kc / Math.max(0.5, it)) * error * dtSec;
        state.integral = Math.max(0, Math.min(100, state.integral));

        const dTerm = kc * dt * ((error - state.prevError) / dtSec);
        state.prevError = error;

        op = Math.max(0, Math.min(100, pTerm + state.integral + dTerm));
      }
      setValveOp(op);

      // 3. Tank 1 Dynamics
      const qIn1 = (op / 100) * 80;
      const c1 = 7.0;
      const qOut1 = c1 * Math.sqrt(Math.max(0, state.h1));
      const dh1 = ((qIn1 - qOut1) / 18) * dtSec;
      state.h1 = Math.max(0, Math.min(100, state.h1 + dh1));
      setTank1Pv(state.h1);

      // 4. Transport Pipe Dead Time Buffer for Tank 1 outflow -> Tank 2
      state.pipeBuffer.push({ time: curT, val: qOut1 });
      while (
        state.pipeBuffer.length > 1 &&
        state.pipeBuffer[0].time < curT - Math.max(deadTime, 15)
      ) {
        state.pipeBuffer.shift();
      }

      const delayedPipeT = curT - deadTime;
      let delayedInflow2 = qOut1;
      if (state.pipeBuffer.length > 0) {
        let best = state.pipeBuffer[0];
        for (const item of state.pipeBuffer) {
          if (item.time <= delayedPipeT) best = item;
          else break;
        }
        delayedInflow2 = best.val;
      }

      // 5. Tank 2 Dynamics
      const c2 = 7.0;
      const qOut2 = c2 * Math.sqrt(Math.max(0, state.h2));
      const dh2 = ((delayedInflow2 - qOut2) / 18) * dtSec;
      state.h2 = Math.max(0, Math.min(100, state.h2 + dh2));
      setTank2Pv(state.h2);

      // 6. Record Trend & Log
      const tRound = Math.round(state.simTime * 10) / 10;
      setTrendData((prev) => [
        ...prev.slice(-300),
        {
          time: tRound,
          sp,
          pv: state.h2,
          op,
        },
      ]);

      if (isLogging && Math.floor(state.simTime) !== Math.floor(state.simTime - dtSec)) {
        const dateStr = new Date().toLocaleTimeString();
        setLogEntries((prev) => [
          ...prev.slice(-150),
          {
            time: dateStr,
            timeS: tRound,
            sp,
            tank2Pv: state.h2,
            predPv: yPredicted,
            valveOp: op,
          },
        ]);
      }
    },
    [
      smithEnabled,
      modelKm,
      modelTau1,
      modelTau2,
      modelTheta,
      valveOp,
      manualOp,
      isAuto,
      sp,
      pb,
      it,
      dt,
      deadTime,
      isLogging,
    ]
  );

  // Interval
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const intervalMs = 200;
    const interval = setInterval(() => {
      const dtSec = 0.2 * speedMultiplier;
      tickSimulation(dtSec);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, speedMultiplier, tickSimulation]);

  return (
    <div className="sim411-container">
      {/* Header */}
      <SimACE411Header
        onHome={onHome}
        isRunning={isRunning}
        smithEnabled={smithEnabled}
        onToggleSmith={() => setSmithEnabled(!smithEnabled)}
      />

      {/* Toolbar */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogging}
        isAuto={isAuto}
        isGraphHold={isPaused}
        isPaused={isPaused}
        isConnected={true}
        isExperimentSelected={true}
        onRun={handleRun}
        onPause={() => setIsPaused(!isPaused)}
        onSingleStep={() => {
          if (!isRunning) setIsRunning(true);
          setIsPaused(true);
          tickSimulation(0.2);
        }}
        onStop={handleStop}
        onToggleAuto={() => setIsAuto(!isAuto)}
        onToggleLog={() => setIsLogging(!isLogging)}
        onSaveLog={() => {}}
        onClearLog={() => setLogEntries([])}
        onToggleHold={() => setIsPaused(!isPaused)}
        onExportGraph={() => {}}
        onUserGuide={() => {}}
        onHome={onHome}
        showExit={false}
        speedMultiplier={speedMultiplier}
        onSpeedChange={setSpeedMultiplier}
      />

      {/* Main Dual-Column Content */}
      <div className="sim411-main-layout">
        {/* Left Column: P&ID Diagram + Parameters */}
        <div className="sim411-left-panel">
          <SimACE411Schematic
            isRunning={isRunning}
            tank1Pv={tank1Pv}
            tank2Pv={tank2Pv}
            predPv={predPv}
            sp={sp}
            valveOp={valveOp}
            smithEnabled={smithEnabled}
            deadTime={deadTime}
          />
          <SimACE411Parameters
            isRunning={isRunning}
            isAuto={isAuto}
            onToggleAuto={() => setIsAuto(!isAuto)}
            sp={sp}
            onSpChange={setSp}
            tank2Pv={tank2Pv}
            predPv={predPv}
            manualOp={manualOp}
            onManualOpChange={setManualOp}
            pb={pb}
            onPbChange={setPb}
            it={it}
            onItChange={setIt}
            dt={dt}
            onDtChange={setDt}
            modelKm={modelKm}
            onModelKmChange={setModelKm}
            modelTau1={modelTau1}
            onModelTau1Change={setModelTau1}
            modelTau2={modelTau2}
            onModelTau2Change={setModelTau2}
            modelTheta={modelTheta}
            onModelThetaChange={setModelTheta}
            deadTime={deadTime}
            onDeadTimeChange={setDeadTime}
            onAddLoad={handleAddLoad}
            loadVal={loadVal}
            onLoadValChange={setLoadVal}
            logEntries={logEntries}
          />
        </div>

        {/* Right Column: Live Trend Graph */}
        <div className="sim411-right-panel">
          <TrendGraph data={trendData} isHold={isPaused} />
        </div>
      </div>

      {/* Stop & Reset Dialog Modal */}
      <SimACE401StopModal
        isOpen={showStopModal}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowStopModal(false)}
      />
    </div>
  );
};
