import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE409Header } from './SimACE409Header';
import { SimACE409Schematic } from './SimACE409Schematic';
import { SimACE409Parameters, type NonInteractingLogEntry } from './SimACE409Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimulatorACE409.css';

interface SimulatorACE409Props {
  onHome: () => void;
}

export const SimulatorACE409: React.FC<SimulatorACE409Props> = ({ onHome }) => {
  // Execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Controller states
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [sp, setSp] = useState<number>(50.0);
  const [tank1Pv, setTank1Pv] = useState<number>(0.0);
  const [tank2Pv, setTank2Pv] = useState<number>(0.0);
  const [manualOp, setManualOp] = useState<number>(50.0);
  const [valveOp, setValveOp] = useState<number>(50.0);

  // PID Parameters
  const [pb, setPb] = useState<number>(20.0);
  const [it, setIt] = useState<number>(30.0);
  const [dt, setDt] = useState<number>(1.0);
  const [loadVal, setLoadVal] = useState<number>(0.0);

  // Plant Dimensions
  const [tank1Diameter, setTank1Diameter] = useState<number>(15.0);
  const [tank2Diameter, setTank2Diameter] = useState<number>(15.0);

  // Simulation internal states
  const simStateRef = useRef({
    simTime: 0,
    integral: 0,
    prevError: 0,
    h1: 0,
    h2: 0,
  });

  // History & Log
  const [logEntries, setLogEntries] = useState<NonInteractingLogEntry[]>([]);
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
    setValveOp(50);
    simStateRef.current = {
      simTime: 0,
      integral: 0,
      prevError: 0,
      h1: 0,
      h2: 0,
    };
    setLogEntries([]);
    setTrendData([{ time: 0, sp, pv: 0, op: 50 }]);
  };

  // Physics & PID Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;

      // 1. PID controlling Tank 2 level
      let op = manualOp;
      if (isAuto) {
        const error = sp - state.h2;
        const kc = 100 / Math.max(1, pb);
        const pTerm = kc * error;

        state.integral += (kc / Math.max(0.5, it)) * error * dtSec;
        state.integral = Math.max(0, Math.min(100, state.integral));

        const dTerm = kc * dt * ((error - state.prevError) / dtSec);
        state.prevError = error;

        op = Math.max(0, Math.min(100, pTerm + state.integral + dTerm));
      }
      setValveOp(op);

      // 2. Physical Two-Tank Non-Interacting Dynamics
      // Tank 1: Inflow = op, Outflow = c1 * sqrt(h1)
      const a1 = Math.PI * Math.pow(tank1Diameter / 2, 2);
      const a2 = Math.PI * Math.pow(tank2Diameter / 2, 2);

      const qIn1 = (op / 100) * 80; // normalized flow
      const c1 = 7.0;
      const qOut1 = c1 * Math.sqrt(Math.max(0, state.h1));
      const dh1 = ((qIn1 - qOut1) / (a1 / 10)) * dtSec;
      state.h1 = Math.max(0, Math.min(100, state.h1 + dh1));

      // Tank 2: Inflow = qOut1, Outflow = c2 * sqrt(h2)
      const c2 = 7.0;
      const qOut2 = c2 * Math.sqrt(Math.max(0, state.h2));
      const dh2 = ((qOut1 - qOut2) / (a2 / 10)) * dtSec;
      state.h2 = Math.max(0, Math.min(100, state.h2 + dh2));

      setTank1Pv(state.h1);
      setTank2Pv(state.h2);

      // 3. Record Trend & Log
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
            pv1: state.h1,
            pv2: state.h2,
            op,
          },
        ]);
      }
    },
    [isAuto, sp, pb, it, dt, manualOp, tank1Diameter, tank2Diameter, isLogging]
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
    <div className="sim409-container">
      {/* Header */}
      <SimACE409Header
        onHome={onHome}
        isRunning={isRunning}
        isAuto={isAuto}
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
      <div className="sim409-main-layout">
        {/* Left Column: P&ID Diagram + Parameters */}
        <div className="sim409-left-panel">
          <SimACE409Schematic
            isRunning={isRunning}
            tank1Pv={tank1Pv}
            tank2Pv={tank2Pv}
            sp={sp}
            valveOp={valveOp}
          />
          <SimACE409Parameters
            isRunning={isRunning}
            isAuto={isAuto}
            onToggleAuto={() => setIsAuto(!isAuto)}
            sp={sp}
            onSpChange={setSp}
            tank1Pv={tank1Pv}
            tank2Pv={tank2Pv}
            manualOp={manualOp}
            onManualOpChange={setManualOp}
            pb={pb}
            onPbChange={setPb}
            it={it}
            onItChange={setIt}
            dt={dt}
            onDtChange={setDt}
            tank1Diameter={tank1Diameter}
            onTank1DiameterChange={setTank1Diameter}
            tank2Diameter={tank2Diameter}
            onTank2DiameterChange={setTank2Diameter}
            onAddLoad={handleAddLoad}
            loadVal={loadVal}
            onLoadValChange={setLoadVal}
            logEntries={logEntries}
          />
        </div>

        {/* Right Column: Live Trend Graph */}
        <div className="sim409-right-panel">
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
