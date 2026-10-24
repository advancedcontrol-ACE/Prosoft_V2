import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE408Header } from './SimACE408Header';
import { SimACE408Schematic } from './SimACE408Schematic';
import { SimACE408Parameters, type RatioLogEntry } from './SimACE408Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimulatorACE408.css';

interface SimulatorACE408Props {
  onHome: () => void;
}

export const SimulatorACE408: React.FC<SimulatorACE408Props> = ({ onHome }) => {
  // Execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Ratio and Streams
  const [ratioSet, setRatioSet] = useState<number>(1.0);
  const [wildFlow, setWildFlow] = useState<number>(40.0);
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [manualOp, setManualOp] = useState<number>(40.0);

  // Flow Controller Parameters
  const [pb, setPb] = useState<number>(200.0);
  const [it, setIt] = useState<number>(30.0);
  const [dt, setDt] = useState<number>(1.0);

  // Live Process States
  const [contPv, setContPv] = useState<number>(0.0);
  const [valveOp, setValveOp] = useState<number>(40.0);

  // Computed
  const contSp = Math.min(100, Math.max(0, wildFlow * ratioSet));
  const currentRatio = wildFlow > 0 ? contPv / wildFlow : 0;

  // Simulation internal states
  const simStateRef = useRef({
    simTime: 0,
    integral: 0,
    prevError: 0,
    flowPv: 0,
  });

  // History & Log
  const [logEntries, setLogEntries] = useState<RatioLogEntry[]>([]);
  const [trendData, setTrendData] = useState<
    { time: number; sp: number; pv: number; op: number }[]
  >([{ time: 0, sp: 40, pv: 0, op: 40 }]);

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
    setContPv(0);
    setValveOp(40);
    simStateRef.current = {
      simTime: 0,
      integral: 0,
      prevError: 0,
      flowPv: 0,
    };
    setLogEntries([]);
    setTrendData([{ time: 0, sp: contSp, pv: 0, op: 40 }]);
  };

  // Physics & Ratio Control Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;

      // 1. Flow PID Controller
      let op = manualOp;
      if (isAuto) {
        const error = contSp - state.flowPv;
        const kc = 100 / Math.max(1, pb);
        const pTerm = kc * error;

        state.integral += (kc / Math.max(0.5, it)) * error * dtSec;
        state.integral = Math.max(0, Math.min(100, state.integral));

        const dTerm = kc * dt * ((error - state.prevError) / dtSec);
        state.prevError = error;

        op = Math.max(0, Math.min(100, pTerm + state.integral + dTerm));
      }
      setValveOp(op);

      // 2. Flow Process Dynamics (Fast 1st Order, tau ~ 0.8s)
      const targetFlow = op * 1.0;
      const tau = 0.8;
      state.flowPv += ((targetFlow - state.flowPv) / tau) * dtSec;
      setContPv(state.flowPv);

      // 3. Record Trend & Log
      const tRound = Math.round(state.simTime * 10) / 10;
      setTrendData((prev) => [
        ...prev.slice(-300),
        {
          time: tRound,
          sp: contSp,
          pv: state.flowPv,
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
            wildFlow,
            ratioSet,
            contSp,
            contPv: state.flowPv,
            valveOp: op,
            currentRatio: wildFlow > 0 ? state.flowPv / wildFlow : 0,
          },
        ]);
      }
    },
    [isAuto, contSp, pb, it, dt, manualOp, wildFlow, ratioSet, isLogging]
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
    <div className="sim408-container">
      {/* Header */}
      <SimACE408Header
        onHome={onHome}
        isRunning={isRunning}
        ratioSet={ratioSet}
        currentRatio={currentRatio}
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
      <div className="sim408-main-layout">
        {/* Left Column: P&ID Diagram + Parameters */}
        <div className="sim408-left-panel">
          <SimACE408Schematic
            isRunning={isRunning}
            wildFlowPv={wildFlow}
            contFlowPv={contPv}
            contFlowSp={contSp}
            ratioSet={ratioSet}
            currentRatio={currentRatio}
            valveOp={valveOp}
          />
          <SimACE408Parameters
            isRunning={isRunning}
            isAuto={isAuto}
            onToggleAuto={() => setIsAuto(!isAuto)}
            ratioSet={ratioSet}
            onRatioSetChange={setRatioSet}
            wildFlow={wildFlow}
            onWildFlowChange={setWildFlow}
            contSp={contSp}
            contPv={contPv}
            manualOp={manualOp}
            onManualOpChange={setManualOp}
            pb={pb}
            onPbChange={setPb}
            it={it}
            onItChange={setIt}
            dt={dt}
            onDtChange={setDt}
            currentRatio={currentRatio}
            logEntries={logEntries}
          />
        </div>

        {/* Right Column: Live Trend Graph */}
        <div className="sim408-right-panel">
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
