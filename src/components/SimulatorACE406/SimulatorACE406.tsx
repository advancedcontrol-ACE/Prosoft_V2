import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE406Header } from './SimACE406Header';
import { SimACE406Schematic } from './SimACE406Schematic';
import { SimACE406Parameters, type CascadeLogEntry } from './SimACE406Parameters';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import './SimulatorACE406.css';

interface SimulatorACE406Props {
  onHome: () => void;
}

export const SimulatorACE406: React.FC<SimulatorACE406Props> = ({ onHome }) => {
  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Primary Loop (Master: Level)
  const [masterAuto, setMasterAuto] = useState<boolean>(true);
  const [sp1, setSp1] = useState<number>(50.0);
  const [pv1, setPv1] = useState<number>(0.0);
  const [op1, setOp1] = useState<number>(50.0); // Cascade setpoint to slave
  const [pb1, setPb1] = useState<number>(100.0);
  const [it1, setIt1] = useState<number>(60.0);
  const [dt1, setDt1] = useState<number>(2.0);
  const [loadVal, setLoadVal] = useState<number>(0.0);

  // Secondary Loop (Slave: Flow)
  const [slaveAuto, setSlaveAuto] = useState<boolean>(true);
  const [sp2, setSp2] = useState<number>(50.0);
  const [pv2, setPv2] = useState<number>(0.0);
  const [op2, setOp2] = useState<number>(50.0); // Valve position
  const [pb2, setPb2] = useState<number>(120.0);
  const [it2, setIt2] = useState<number>(10.0);
  const [dt2, setDt2] = useState<number>(0.5);

  // Simulation internal states
  const simStateRef = useRef({
    simTime: 0,
    integralMaster: 0,
    prevErrorMaster: 0,
    integralSlave: 0,
    prevErrorSlave: 0,
    pvLevel: 0,
    pvFlow: 0,
  });

  // History & Log
  const [logEntries, setLogEntries] = useState<CascadeLogEntry[]>([]);
  const [trendData, setTrendData] = useState<
    { time: number; sp: number; pv: number; op: number }[]
  >([{ time: 0, sp: 50, pv: 0, op: 50 }]);

  // Add Load Disturbance
  const handleAddLoad = () => {
    setPv1((prev) => Math.max(0, Math.min(100, prev + loadVal)));
    simStateRef.current.pvLevel = Math.max(
      0,
      Math.min(100, simStateRef.current.pvLevel + loadVal)
    );
  };

  // Run & Stop
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
    setPv1(0);
    setPv2(0);
    setOp1(50);
    setOp2(50);
    setSp2(50);
    simStateRef.current = {
      simTime: 0,
      integralMaster: 0,
      prevErrorMaster: 0,
      integralSlave: 0,
      prevErrorSlave: 0,
      pvLevel: 0,
      pvFlow: 0,
    };
    setLogEntries([]);
    setTrendData([{ time: 0, sp: sp1, pv: 0, op: 50 }]);
  };

  // Physics & Dual PID Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;

      // ── 1. PRIMARY (MASTER) LEVEL PID ──
      let targetSp2 = op1;
      if (masterAuto) {
        const errMaster = sp1 - state.pvLevel;
        const kc1 = 100 / Math.max(1, pb1);
        const pTerm1 = kc1 * errMaster;

        state.integralMaster += (kc1 / Math.max(0.5, it1)) * errMaster * dtSec;
        state.integralMaster = Math.max(0, Math.min(100, state.integralMaster));

        const dTerm1 = kc1 * dt1 * ((errMaster - state.prevErrorMaster) / dtSec);
        state.prevErrorMaster = errMaster;

        targetSp2 = Math.max(0, Math.min(100, pTerm1 + state.integralMaster + dTerm1));
        setOp1(targetSp2);
      }
      setSp2(targetSp2);

      // ── 2. SECONDARY (SLAVE) FLOW PID ──
      let valvePosition = op2;
      if (slaveAuto) {
        const errSlave = targetSp2 - state.pvFlow;
        const kc2 = 100 / Math.max(1, pb2);
        const pTerm2 = kc2 * errSlave;

        state.integralSlave += (kc2 / Math.max(0.2, it2)) * errSlave * dtSec;
        state.integralSlave = Math.max(0, Math.min(100, state.integralSlave));

        const dTerm2 = kc2 * dt2 * ((errSlave - state.prevErrorSlave) / dtSec);
        state.prevErrorSlave = errSlave;

        valvePosition = Math.max(0, Math.min(100, pTerm2 + state.integralSlave + dTerm2));
        setOp2(valvePosition);
      }

      // ── 3. SECONDARY FLOW DYNAMICS (Fast 1st Order, tau ~ 0.8s) ──
      const targetFlow = valvePosition * 1.0;
      const tauFlow = 0.8;
      state.pvFlow += ((targetFlow - state.pvFlow) / tauFlow) * dtSec;
      setPv2(state.pvFlow);

      // ── 4. PRIMARY LEVEL DYNAMICS (Tank Inflow vs Gravity Drain, tau ~ 25s) ──
      const inflow = state.pvFlow;
      const outflow = 14.14 * Math.sqrt(Math.max(0, state.pvLevel)); // steady state drain
      const dLevel = ((inflow * 2.0 - outflow) / 30) * dtSec;
      state.pvLevel = Math.max(0, Math.min(100, state.pvLevel + dLevel));
      setPv1(state.pvLevel);

      // ── 5. RECORD TELEMETRY ──
      const tRound = Math.round(state.simTime * 10) / 10;
      setTrendData((prev) => [
        ...prev.slice(-300),
        {
          time: tRound,
          sp: sp1,
          pv: state.pvLevel,
          op: valvePosition,
        },
      ]);

      if (isLogging && Math.floor(state.simTime) !== Math.floor(state.simTime - dtSec)) {
        const dateStr = new Date().toLocaleTimeString();
        setLogEntries((prev) => [
          ...prev.slice(-150),
          {
            time: dateStr,
            timeS: tRound,
            sp1,
            pv1: state.pvLevel,
            op1: targetSp2,
            sp2: targetSp2,
            pv2: state.pvFlow,
            op2: valvePosition,
          },
        ]);
      }
    },
    [masterAuto, sp1, pb1, it1, dt1, op1, slaveAuto, pb2, it2, dt2, op2, isLogging]
  );

  // Main Interval
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
    <div className="sim406-container">
      {/* Header */}
      <SimACE406Header
        onHome={onHome}
        isRunning={isRunning}
        masterAuto={masterAuto}
        slaveAuto={slaveAuto}
      />

      {/* Toolbar */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogging}
        isAuto={masterAuto}
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
        onToggleAuto={() => setMasterAuto(!masterAuto)}
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
      <div className="sim406-main-layout">
        {/* Left Column: P&ID Diagram + Parameters */}
        <div className="sim406-left-panel">
          <SimACE406Schematic
            isRunning={isRunning}
            levelPv={pv1}
            levelSp={sp1}
            flowPv={pv2}
            flowSp={sp2}
            valveOp={op2}
            masterAuto={masterAuto}
            slaveAuto={slaveAuto}
          />
          <SimACE406Parameters
            isRunning={isRunning}
            masterAuto={masterAuto}
            onToggleMasterAuto={() => setMasterAuto(!masterAuto)}
            sp1={sp1}
            onSp1Change={setSp1}
            pv1={pv1}
            op1={op1}
            onOp1Change={setOp1}
            pb1={pb1}
            onPb1Change={setPb1}
            it1={it1}
            onIt1Change={setIt1}
            dt1={dt1}
            onDt1Change={setDt1}
            onAddLoad={handleAddLoad}
            loadVal={loadVal}
            onLoadValChange={setLoadVal}
            slaveAuto={slaveAuto}
            onToggleSlaveAuto={() => setSlaveAuto(!slaveAuto)}
            sp2={sp2}
            pv2={pv2}
            op2={op2}
            onOp2Change={setOp2}
            pb2={pb2}
            onPb2Change={setPb2}
            it2={it2}
            onIt2Change={setIt2}
            dt2={dt2}
            onDt2Change={setDt2}
            logEntries={logEntries}
          />
        </div>

        {/* Right Column: Live Trend Graph */}
        <div className="sim406-right-panel">
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
