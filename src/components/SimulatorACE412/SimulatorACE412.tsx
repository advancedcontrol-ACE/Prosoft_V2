import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE412Header } from './SimACE412Header';
import { SimACE412Schematic } from './SimACE412Schematic';
import { SimACE412Parameters, type ImcLogEntry } from './SimACE412Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimulatorACE412.css';

interface SimulatorACE412Props {
  onHome: () => void;
}

export const SimulatorACE412: React.FC<SimulatorACE412Props> = ({ onHome }) => {
  // Execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // States
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [sp, setSp] = useState<number>(50.0);
  const [pv, setPv] = useState<number>(0.0);
  const [manualOp, setManualOp] = useState<number>(50.0);
  const [valveOp, setValveOp] = useState<number>(50.0);

  // FOPDT Plant Model
  const [gainK, setGainK] = useState<number>(1.2);
  const [tau, setTau] = useState<number>(15.0);
  const [theta, setTheta] = useState<number>(3.0);

  // IMC Filter tuning
  const [filterLambda, setFilterLambda] = useState<number>(4.0);
  const [loadVal, setLoadVal] = useState<number>(0.0);

  // Equivalent PID calculations
  const eqKc = (2 * tau + theta) / (2 * Math.max(0.01, gainK) * (filterLambda + theta));
  const eqTi = tau + theta / 2;
  const eqTd = (tau * theta) / (2 * tau + theta);

  // Simulation Internal States
  const simStateRef = useRef({
    simTime: 0,
    integral: 0,
    prevError: 0,
    pv: 0,
    delayBuffer: [] as { time: number; val: number }[],
  });

  // History & Log
  const [logEntries, setLogEntries] = useState<ImcLogEntry[]>([]);
  const [trendData, setTrendData] = useState<
    { time: number; sp: number; pv: number; op: number }[]
  >([{ time: 0, sp: 50, pv: 0, op: 50 }]);

  const handleAddLoad = () => {
    setPv((prev) => Math.max(0, Math.min(100, prev + loadVal)));
    simStateRef.current.pv = Math.max(
      0,
      Math.min(100, simStateRef.current.pv + loadVal)
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
    setValveOp(50);
    simStateRef.current = {
      simTime: 0,
      integral: 0,
      prevError: 0,
      pv: 0,
      delayBuffer: [],
    };
    setLogEntries([]);
    setTrendData([{ time: 0, sp, pv: 0, op: 50 }]);
  };

  // Physics & IMC Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;
      const curT = state.simTime;

      // 1. Controller Output via Equivalent IMC PID
      let op = manualOp;
      if (isAuto) {
        const error = sp - state.pv;
        const pTerm = eqKc * error;

        state.integral += (eqKc / Math.max(0.5, eqTi)) * error * dtSec;
        state.integral = Math.max(0, Math.min(100, state.integral));

        const dTerm = eqKc * eqTd * ((error - state.prevError) / dtSec);
        state.prevError = error;

        op = Math.max(0, Math.min(100, pTerm + state.integral + dTerm));
      }
      setValveOp(op);

      // 2. FOPDT Plant Model Simulation with Dead Time Buffer
      state.delayBuffer.push({ time: curT, val: op });
      while (
        state.delayBuffer.length > 1 &&
        state.delayBuffer[0].time < curT - Math.max(theta, 15)
      ) {
        state.delayBuffer.shift();
      }

      const delayedT = curT - theta;
      let delayedOp = op;
      if (state.delayBuffer.length > 0) {
        let best = state.delayBuffer[0];
        for (const item of state.delayBuffer) {
          if (item.time <= delayedT) best = item;
          else break;
        }
        delayedOp = best.val;
      }

      // Discrete 1st order lag: tau * dpv/dt = K * delayedOp - pv
      const targetPv = (delayedOp / 100) * 100 * (gainK / 1.2);
      state.pv += ((targetPv - state.pv) / Math.max(1, tau)) * dtSec;
      state.pv = Math.max(0, Math.min(100, state.pv));
      setPv(state.pv);

      // 3. Record Trend & Log
      const tRound = Math.round(state.simTime * 10) / 10;
      setTrendData((prev) => [
        ...prev.slice(-300),
        {
          time: tRound,
          sp,
          pv: state.pv,
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
            pv: state.pv,
            op,
            dist: loadVal,
          },
        ]);
      }
    },
    [isAuto, sp, eqKc, eqTi, eqTd, manualOp, theta, gainK, tau, loadVal, isLogging]
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
    <div className="sim412-container">
      {/* Header */}
      <SimACE412Header
        onHome={onHome}
        isRunning={isRunning}
        filterLambda={filterLambda}
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
      <div className="sim412-main-layout">
        {/* Left Column: P&ID Diagram + Parameters */}
        <div className="sim412-left-panel">
          <SimACE412Schematic
            isRunning={isRunning}
            pv={pv}
            sp={sp}
            valveOp={valveOp}
            gainK={gainK}
            tau={tau}
            theta={theta}
            filterLambda={filterLambda}
          />
          <SimACE412Parameters
            isRunning={isRunning}
            isAuto={isAuto}
            onToggleAuto={() => setIsAuto(!isAuto)}
            sp={sp}
            onSpChange={setSp}
            pv={pv}
            manualOp={manualOp}
            onManualOpChange={setManualOp}
            gainK={gainK}
            onGainKChange={setGainK}
            tau={tau}
            onTauChange={setTau}
            theta={theta}
            onThetaChange={setTheta}
            filterLambda={filterLambda}
            onFilterLambdaChange={setFilterLambda}
            eqKc={eqKc}
            eqTi={eqTi}
            eqTd={eqTd}
            onAddLoad={handleAddLoad}
            loadVal={loadVal}
            onLoadValChange={setLoadVal}
            logEntries={logEntries}
          />
        </div>

        {/* Right Column: Live Trend Graph */}
        <div className="sim412-right-panel">
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
