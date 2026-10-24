import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE410Header } from './SimACE410Header';
import { SimACE410FuzzyDesign, DEFAULT_RULES, type FuzzyRuleMatrix } from './SimACE410FuzzyDesign';
import { SimACE410Process } from './SimACE410Process';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import './SimulatorACE410.css';

interface SimulatorACE410Props {
  onHome: () => void;
}

export const SimulatorACE410: React.FC<SimulatorACE410Props> = ({ onHome }) => {
  const [activeView, setActiveView] = useState<'design' | 'process'>('design');

  // Execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Fuzzy Rules Matrix
  const [rules, setRules] = useState<FuzzyRuleMatrix>(DEFAULT_RULES);

  // Process States
  const [sp, setSp] = useState<number>(50.0);
  const [pv, setPv] = useState<number>(0.0);
  const [op, setOp] = useState<number>(0.0);
  const [error, setError] = useState<number>(50.0);
  const [dError, setDError] = useState<number>(0.0);
  const [delCo, setDelCo] = useState<number>(0.0);
  const [loadVal, setLoadVal] = useState<number>(0.0);

  // Simulation Internal States
  const simStateRef = useRef({
    simTime: 0,
    prevError: 50.0,
    level: 0,
    op: 0,
  });

  // Trend Data
  const [trendData, setTrendData] = useState<
    { time: number; sp: number; pv: number; op: number }[]
  >([{ time: 0, sp: 50, pv: 0, op: 0 }]);

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
      setActiveView('process');
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
    setOp(0);
    setError(sp);
    setDError(0);
    setDelCo(0);
    simStateRef.current = {
      simTime: 0,
      prevError: sp,
      level: 0,
      op: 0,
    };
    setTrendData([{ time: 0, sp, pv: 0, op: 0 }]);
  };

  // Membership Evaluation Helper functions
  const triMf = (x: number, a: number, b: number, c: number): number => {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x < b) return (x - a) / (b - a);
    return (c - x) / (c - b);
  };

  const trapMf = (x: number, a: number, b: number, c: number, d: number): number => {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x < b) return (x - a) / (b - a);
    return (d - x) / (d - c);
  };

  // Mamdani Fuzzy Inference Engine
  const evaluateFis = useCallback(
    (e: number, de: number): number => {
      // 1. Fuzzify Error
      const muE: Record<string, number> = {
        NL: trapMf(e, -100, -50, -25, -5),
        NS: triMf(e, -20, -10, 0),
        Zero: triMf(e, -5, 0, 5),
        PS: triMf(e, 0, 10, 20),
        PL: trapMf(e, 5, 25, 50, 100),
      };

      // 2. Fuzzify Change in Error
      const muDe: Record<string, number> = {
        'delE-N': trapMf(de, -50, -20, -10, 0),
        'delE-Zero': triMf(de, -5, 0, 5),
        'delE-P': trapMf(de, 0, 10, 20, 50),
      };

      // 3. Output Singleton Centroids
      const outputCentroids: Record<string, number> = {
        'CO-NegL': -35.0,
        'CO-NegS': -15.0,
        'CO-Nil': 0.0,
        'CO-PosS': 15.0,
        'CO-PosL': 35.0,
      };

      // 4. Rule Evaluation (Min operator) & Defuzzification (Centroid)
      let num = 0;
      let den = 0;

      for (const delE of ['delE-N', 'delE-Zero', 'delE-P']) {
        for (const errKey of ['NL', 'NS', 'Zero', 'PS', 'PL']) {
          const ruleOutputName = rules[delE]?.[errKey] || 'CO-Nil';
          const weight = Math.min(muDe[delE] || 0, muE[errKey] || 0);
          const centroid = outputCentroids[ruleOutputName] ?? 0;

          num += weight * centroid;
          den += weight;
        }
      }

      if (den < 1e-6) return 0;
      return num / den;
    },
    [rules]
  );

  // Simulation Physics & Fuzzy Control Tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      const state = simStateRef.current;
      state.simTime += dtSec;

      // 1. Calculate Error & de/dt
      const curError = sp - state.level;
      const curDError = (curError - state.prevError) / dtSec;
      state.prevError = curError;

      setError(curError);
      setDError(curDError);

      // 2. Evaluate FIS
      const deltaCoVal = evaluateFis(curError, curDError) * 0.35; // scaled delta per tick
      setDelCo(deltaCoVal);

      // 3. Update Controller Output
      state.op = Math.max(0, Math.min(100, state.op + deltaCoVal));
      setOp(state.op);

      // 4. Tank Physical Dynamics
      const qIn = (state.op / 100) * 120; // inflow
      const qOut = 12.0 * Math.sqrt(Math.max(0, state.level)); // gravity drain
      const dh = ((qIn - qOut) / 20) * dtSec;
      state.level = Math.max(0, Math.min(100, state.level + dh));
      setPv(state.level);

      // 5. Record Trend
      const tRound = Math.round(state.simTime * 10) / 10;
      setTrendData((prev) => [
        ...prev.slice(-300),
        {
          time: tRound,
          sp,
          pv: state.level,
          op: state.op,
        },
      ]);
    },
    [sp, evaluateFis]
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
    <div className="sim410-container">
      {/* Header */}
      <SimACE410Header
        onHome={onHome}
        isRunning={isRunning}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Toolbar */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogging}
        isAuto={true}
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
        onToggleAuto={() => {}}
        onToggleLog={() => setIsLogging(!isLogging)}
        onSaveLog={() => {}}
        onClearLog={() => setTrendData([])}
        onToggleHold={() => setIsPaused(!isPaused)}
        onExportGraph={() => {}}
        onUserGuide={() => {}}
        onHome={onHome}
        showExit={false}
        speedMultiplier={speedMultiplier}
        onSpeedChange={setSpeedMultiplier}
      />

      {/* Main View Area */}
      <div className="sim410-main-area">
        {activeView === 'design' ? (
          <SimACE410FuzzyDesign
            rules={rules}
            onRulesChange={setRules}
            onProceedToProcess={() => setActiveView('process')}
          />
        ) : (
          <SimACE410Process
            isRunning={isRunning}
            isPaused={isPaused}
            pv={pv}
            sp={sp}
            onSpChange={setSp}
            op={op}
            error={error}
            dError={dError}
            delCo={delCo}
            loadVal={loadVal}
            onLoadValChange={setLoadVal}
            onAddLoad={handleAddLoad}
            trendData={trendData}
          />
        )}
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
