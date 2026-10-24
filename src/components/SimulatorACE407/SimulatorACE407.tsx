import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE407Header } from './SimACE407Header';
import { SimACE407Schematic } from './SimACE407Schematic';
import { SimACE407Parameters, type FeedforwardLogEntry } from './SimACE407Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimulatorACE407.css';

interface SimulatorACE407Props {
  onHome: () => void;
}

export const SimulatorACE407: React.FC<SimulatorACE407Props> = ({ onHome }) => {
  // Execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Controller states
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [sp, setSp] = useState<number>(50.0);
  const [pv, setPv] = useState<number>(0.0);
  const [manualOp, setManualOp] = useState<number>(50.0);

  // PID Parameters
  const [pb, setPb] = useState<number>(80.0);
  const [it, setIt] = useState<number>(45.0);
  const [dt, setDt] = useState<number>(1.5);

  // Disturbance & Feedforward
  const [outflowDist, setOutflowDist] = useState<number>(40.0); // 40% nominal
  const [ffFactor, setFfFactor] = useState<number>(1.5);
  const [loadVal, setLoadVal] = useState<number>(0.0);

  // Controller Outputs
  const [fbOp, setFbOp] = useState<number>(50.0);
  const [ffOp, setFfOp] = useState<number>(0.0);
  const [totalOp, setTotalOp] = useState<number>(50.0);

  // Simulation internal states
  const simStateRef = useRef({
    simTime: 0,
    integral: 0,
    prevError: 0,
    level: 0,
  });

  // History & Log
  const [logEntries, setLogEntries] = useState<FeedforwardLogEntry[]>([]);
  const [trendData, setTrendData] = useState<
    { time: number; sp: number; pv: number; op: number }[]
  >([{ time: 0, sp: 50, pv: 0, op: 50 }]);

  const handleAddLoad = () => {
    setPv((prev) => Math.max(0, Math.min(100, prev + loadVal)));
    simStateRef.current.level = Math.max(
      0,
      Math.min(100, simStateRef.current.level + loadVal)
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
    setPv(0);
    setFbOp(50);
    setFfOp(0);
    setTotalOp(50);
    simStateRef.current = {
      simTime: 0,
      integral: 0,
      prevError: 0,
      level: 0,
    };
    setLogEntries([]);
    setTrendData([{ time: 0, sp, pv: 0, op: 50 }]);
  };

  // Physics & Feedforward + Feedback Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;

      let opFeedback = manualOp;
      if (isAuto) {
        const error = sp - state.level;
        const kc = 100 / Math.max(1, pb);
        const pTerm = kc * error;

        state.integral += (kc / Math.max(0.5, it)) * error * dtSec;
        state.integral = Math.max(0, Math.min(100, state.integral));

        const dTerm = kc * dt * ((error - state.prevError) / dtSec);
        state.prevError = error;

        opFeedback = Math.max(0, Math.min(100, pTerm + state.integral + dTerm));
      }
      setFbOp(opFeedback);

      // Feedforward calculation: FF = factor * (Disturbance - Nominal 40%)
      const nominalDist = 40.0;
      const opFeedforward = ffFactor * (outflowDist - nominalDist);
      setFfOp(opFeedforward);

      const opCombined = Math.max(0, Math.min(100, opFeedback + opFeedforward));
      setTotalOp(opCombined);

      // Physical Level Simulation
      // Inflow proportional to CV1 opCombined
      // Outflow proportional to outflowDist
      const qIn = opCombined * 1.0;
      const qOut = outflowDist * 1.0 + 3.0 * Math.sqrt(Math.max(0, state.level));
      const dh = ((qIn - qOut) / 20) * dtSec;

      state.level = Math.max(0, Math.min(100, state.level + dh));
      setPv(state.level);

      // Record trend & log
      const tRound = Math.round(state.simTime * 10) / 10;
      setTrendData((prev) => [
        ...prev.slice(-300),
        {
          time: tRound,
          sp,
          pv: state.level,
          op: opCombined,
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
            pv: state.level,
            opFb: opFeedback,
            opFf: opFeedforward,
            opTot: opCombined,
            outflowDist,
          },
        ]);
      }
    },
    [isAuto, sp, pb, it, dt, manualOp, ffFactor, outflowDist, isLogging]
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
    <div className="sim407-container">
      {/* Header */}
      <SimACE407Header
        onHome={onHome}
        isRunning={isRunning}
        ffFactor={ffFactor}
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
      <div className="sim407-main-layout">
        {/* Left Column: P&ID Diagram + Parameters */}
        <div className="sim407-left-panel">
          <SimACE407Schematic
            isRunning={isRunning}
            levelPv={pv}
            levelSp={sp}
            totalOp={totalOp}
            fbOp={fbOp}
            ffOp={ffOp}
            outflowDist={outflowDist}
            ffFactor={ffFactor}
          />
          <SimACE407Parameters
            isRunning={isRunning}
            isAuto={isAuto}
            onToggleAuto={() => setIsAuto(!isAuto)}
            sp={sp}
            onSpChange={setSp}
            pv={pv}
            manualOp={manualOp}
            onManualOpChange={setManualOp}
            pb={pb}
            onPbChange={setPb}
            it={it}
            onItChange={setIt}
            dt={dt}
            onDtChange={setDt}
            outflowDist={outflowDist}
            onOutflowDistChange={setOutflowDist}
            ffFactor={ffFactor}
            onFfFactorChange={setFfFactor}
            onAddLoad={handleAddLoad}
            loadVal={loadVal}
            onLoadValChange={setLoadVal}
            logEntries={logEntries}
          />
        </div>

        {/* Right Column: Live Trend Graph */}
        <div className="sim407-right-panel">
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
