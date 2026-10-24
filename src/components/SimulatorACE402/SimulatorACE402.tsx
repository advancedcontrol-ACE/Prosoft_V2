import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE402Header } from './SimACE402Header';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE402Schematic } from './SimACE402Schematic';
import { SimACE402Parameters } from './SimACE402Parameters';
import { TrendGraph, type TrendDataPoint } from '../TrainerACE101/TrendGraph';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import { SimACE401UserManual } from '../SimulatorACE401/SimACE401UserManual';
import type { SimLogEntry } from '../SimulatorACE401/SimACE401Parameters';
import './SimulatorACE402.css';

interface FOPDTPreset {
  name: string;
  gain: number;
  tau: number;
  theta: number;
}

const PRESET_MODELS: Record<string, FOPDTPreset> = {
  cylindrical: {
    name: 'Cylindrical Tank Level Process',
    gain: 2.4,
    tau: 196.3,
    theta: 0.7,
  },
  conical: {
    name: 'Conical Tank Level Process',
    gain: 2.3,
    tau: 83.0,
    theta: 2.6,
  },
  spherical: {
    name: 'Spherical Tank Level Process',
    gain: 1.13,
    tau: 216.0,
    theta: 4.0,
  },
  flow: {
    name: 'Flow Process',
    gain: 1.33,
    tau: 5.8,
    theta: 0.4,
  },
  pressure: {
    name: 'Pressure Process',
    gain: 1.95,
    tau: 23.2,
    theta: 2.0,
  },
  temperature: {
    name: 'Temperature Process',
    gain: 0.9,
    tau: 70.0,
    theta: 14.0,
  },
  custom: {
    name: 'Custom Model',
    gain: 2.0,
    tau: 50.0,
    theta: 2.0,
  },
};

const formatClock = (d: Date = new Date()): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} - ${hours}:${minutes}:${seconds}`;
};

interface SimulatorACE402Props {
  onHome: () => void;
}

export const SimulatorACE402: React.FC<SimulatorACE402Props> = ({ onHome }) => {
  // ── 1. Model Selection ──
  const [selectedModelKey, setSelectedModelKey] = useState<string>('cylindrical');
  const [staticGain, setStaticGain] = useState<number>(2.4);
  const [timeConstant, setTimeConstant] = useState<number>(196.3);
  const [timeLag, setTimeLag] = useState<number>(0.7);

  // ── 2. Controller Parameters ──
  const [sp, setSp] = useState<number>(50);
  const [pv, setPv] = useState<number>(0);
  const [op, setOp] = useState<number>(100); // Default 100 for Reverse action
  const [bias, setBias] = useState<number>(70.0);
  const [pb, setPb] = useState<number>(120);
  const [it, setIt] = useState<number>(30);
  const [dt, setDt] = useState<number>(1.0);
  const [load, setLoad] = useState<number>(10);
  const [isAddLoadActive, setIsAddLoadActive] = useState<boolean>(false);
  const [isAuto, setIsAuto] = useState<boolean>(true);

  const [pbContribution, setPbContribution] = useState<number>(0);
  const [itContribution, setItContribution] = useState<number>(0);
  const [dtContribution, setDtContribution] = useState<number>(0);

  // ── 3. Tabs & Toolbar Runtime State ──
  const [leftTab, setLeftTab] = useState<'fopdt' | 'schematic'>('fopdt');
  const [activeTab, setActiveTab] = useState<'pid' | 'log'>('pid');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(() => formatClock());

  // Trend Data & Log
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([{ time: 0, sp: 50, pv: 0, op: 100 }]);
  const [logEntries, setLogEntries] = useState<SimLogEntry[]>([]);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatClock());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulation Internal State Ref
  const simStateRef = useRef({
    y: 0,               // Discrete plant output (PV %)
    prevOp: 100,        // Previous controller output
    prevError: 0,       // Previous error (for derivative)
    bias: 70.0,         // Internal integral bias (ibias)
    simTime: 0,         // Current time in seconds
    lastLogSec: -1,
    delayBuffer: new Array(60).fill(100) as number[], // Dead time FIFO buffer
    isAddLoadPending: false,
  });

  // Model Selection Change Handler
  const handleModelChange = (key: string) => {
    setSelectedModelKey(key);
    const preset = PRESET_MODELS[key];
    if (preset && key !== 'custom') {
      setStaticGain(preset.gain);
      setTimeConstant(preset.tau);
      setTimeLag(preset.theta);
    }
  };

  // ── Physics Step Execution (1 second per step, matching ACE402.vi discrete model) ──
  const stepPhysics = useCallback(() => {
    const state = simStateRef.current;

    // 1. Time Lag / Transport Delay on Controller Output
    const lagSec = Math.max(0, Math.min(50, Math.round(timeLag)));
    const delayedOp = state.delayBuffer[lagSec] !== undefined ? state.delayBuffer[lagSec] : state.prevOp;

    // 2. Disturbance / Add Load
    let effectiveInput = delayedOp;
    if (state.isAddLoadPending) {
      effectiveInput += load;
      state.isAddLoadPending = false;
    }

    // 3. Discrete FOPDT Model Update (Zero-Order Hold exact discretization)
    // y[k] = alpha * y[k-1] + K * (1 - alpha) * u[k-d]
    const tauSafe = Math.max(0.1, timeConstant);
    const alpha = Math.exp(-1.0 / tauSafe);
    let newY = alpha * state.y + staticGain * (1.0 - alpha) * (effectiveInput / 100) * 100;
    newY = Math.max(0, Math.min(100, newY));
    state.y = newY;

    // 4. Controller Computation (Reverse Action as per ACE402.vi: error = sp - pv)
    const error = sp - newY;
    const kp = 100 / Math.max(0.01, pb);
    const pop = kp * error;
    const iop = it > 0 ? pop / Math.max(0.1, it) : 0;
    const de = error - state.prevError;
    const dop = kp * dt * de;

    // Anti-Reset Windup
    let ibias = state.bias;
    if (state.prevOp >= 100 || state.prevOp <= 0) {
      ibias = state.bias;
    } else {
      ibias = state.bias + iop;
    }

    let computedOp = pop + iop + dop + ibias;

    // Manual mode override
    if (!isAuto) {
      computedOp = op;
      ibias = computedOp - (pop + dop);
    }

    const clampedOp = Math.max(0, Math.min(100, computedOp));

    // 5. Update Delay Buffer
    state.delayBuffer.unshift(clampedOp);
    if (state.delayBuffer.length > 60) {
      state.delayBuffer.pop();
    }

    // 6. Update Shift Registers
    state.prevOp = clampedOp;
    state.prevError = error;
    state.bias = ibias;
    state.simTime += 1;

    // 7. Update React States
    setPv(newY);
    setOp(clampedOp);
    setBias(ibias);
    setPbContribution(pop);
    setItContribution(iop);
    setDtContribution(dop);

    // Append to Trend Data
    setTrendData((prev) => {
      const newPoint: TrendDataPoint = {
        time: Math.round(state.simTime),
        sp,
        pv: Number(newY.toFixed(1)),
        op: Number(clampedOp.toFixed(1)),
      };
      const updated = [...prev, newPoint];
      return updated.length > 2500 ? updated.slice(updated.length - 2500) : updated;
    });

    // Append to Log Table
    const curSec = Math.floor(state.simTime);
    if (isLogging && curSec !== state.lastLogSec) {
      state.lastLogSec = curSec;
      const now = new Date();
      setLogEntries((prev) => [
        ...prev,
        {
          time: now.toLocaleTimeString(),
          timeS: curSec,
          sp,
          pv: Number(newY.toFixed(1)),
          op: Number(clampedOp.toFixed(1)),
          pb,
          it,
          dt,
        },
      ]);
    }
  }, [
    timeLag,
    load,
    timeConstant,
    staticGain,
    sp,
    pb,
    it,
    dt,
    isAuto,
    op,
    isLogging,
  ]);

  // Simulation Timer Loop (Runs every second, scaled by simSpeed)
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalMs = Math.round(1000 / Math.max(0.1, simSpeed));
    const timer = setInterval(() => {
      stepPhysics();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, stepPhysics, simSpeed]);

  // Momentary Add Load Disturbance
  const handleAddLoad = () => {
    setIsAddLoadActive(true);
    setTimeout(() => setIsAddLoadActive(false), 200);

    simStateRef.current.isAddLoadPending = true;
    if (!isRunning || isPaused) {
      const updatedPv = Math.max(0, Math.min(100, pv + load));
      simStateRef.current.y = updatedPv;
      setPv(updatedPv);
    }
  };

  // Bumpless Transfer Toggle
  const handleToggleAuto = () => {
    if (!isAuto) {
      const state = simStateRef.current;
      const kp = 100 / Math.max(0.01, pb);
      const error = sp - pv;
      const pop = kp * error;
      state.bias = op - (pop + dtContribution);
      setBias(state.bias);
      setIsAuto(true);
    } else {
      setIsAuto(false);
    }
  };

  // Toolbar Handlers
  const handleRun = () => {
    setIsRunning(true);
    setIsPaused(false);
    setLeftTab('schematic'); // On RUN, switch to enabled Process Schematic
    setActiveTab('pid');
  };

  const handlePause = () => {
    setIsPaused((p) => !p);
  };

  const handleSingleStep = () => {
    if (!isRunning) {
      setIsRunning(true);
      setLeftTab('schematic');
      setActiveTab('pid');
    }
    setIsPaused(true);
    stepPhysics();
  };

  const handleStop = () => {
    setIsStopModalOpen(true);
  };

  const handleConfirmStop = () => {
    setIsStopModalOpen(false);
    setIsRunning(false);
    setIsPaused(false);
    setLeftTab('fopdt'); // On Stop, re-enable FOPDT Model tab

    setPv(0);
    setOp(100);
    setBias(70.0);
    setPbContribution(0);
    setItContribution(0);
    setDtContribution(0);

    simStateRef.current = {
      y: 0,
      prevOp: 100,
      prevError: 0,
      bias: 70.0,
      simTime: 0,
      lastLogSec: -1,
      delayBuffer: new Array(60).fill(100),
      isAddLoadPending: false,
    };

    setLogEntries([]);
    setTrendData([{ time: 0, sp, pv: 0, op: 100 }]);
  };

  const handleSaveLog = () => {
    if (logEntries.length === 0) {
      alert('Log Table is empty.');
      return;
    }
    const headers = ['Time', 'Time s', 'SP %', 'PV %', 'OP %', 'PB %', 'IT s', 'DT s'];
    const rows = logEntries.map((e) => [
      `"${e.time}"`,
      e.timeS,
      e.sp.toFixed(1),
      e.pv.toFixed(1),
      e.op.toFixed(1),
      e.pb.toFixed(1),
      e.it.toFixed(1),
      e.dt.toFixed(1),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACE402_Log_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGraph = () => {
    const canvas = document.querySelector('.trend-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('Graph canvas not ready.');
      return;
    }
    const link = document.createElement('a');
    link.download = `ACE402_TrendGraph_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const currentPreset = PRESET_MODELS[selectedModelKey];
  const isCustom = selectedModelKey === 'custom';

  return (
    <div className="sim402-page">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <SimACE402Header />

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
        onClearLog={() => setLogEntries([])}
        onToggleHold={() => setIsPaused((p) => !p)}
        onExportGraph={handleExportGraph}
        onUserGuide={() => setIsUserManualOpen(true)}
        onHome={onHome}
        showExit={false}
        speedMultiplier={simSpeed}
        onSpeedChange={setSimSpeed}
      />

      {/* ── Main Layout: Left Column (4fr) and Right Column (6fr) ─── */}
      <div className="sim402-main-layout">
        {/* Left Column: 2 Tabs as Figure 3 (FOPDT Model / Process Schematic) */}
        <div className="sim402-left-column">
          <div className="sim402-left-tab-card">
            {/* Tab Header */}
            <div className="sim402-left-tabs-header">
              <button
                type="button"
                className={`sim402-left-tab-btn ${leftTab === 'fopdt' ? 'active' : ''} ${isRunning ? 'disabled' : ''}`}
                onClick={() => !isRunning && setLeftTab('fopdt')}
                disabled={isRunning}
                title={isRunning ? 'Model selection is locked while experiment is running' : 'FOPDT Model Selection'}
              >
                FOPDT Model
              </button>
              <button
                type="button"
                className={`sim402-left-tab-btn ${leftTab === 'schematic' ? 'active' : ''} ${!isRunning ? 'disabled' : ''}`}
                onClick={() => isRunning && setLeftTab('schematic')}
                disabled={!isRunning}
                title={!isRunning ? 'Click Run in toolbar to enable Process Schematic' : 'Process Schematic'}
              >
                Process Schematic
              </button>
            </div>

            {/* Tab Content */}
            <div className="sim402-left-tab-body">
              {/* TAB 1: FOPDT Model (2 Frames: up and down) */}
              {leftTab === 'fopdt' && (
                <div className="sim402-fopdt-view">
                  {/* Frame 1 (Top / "up"): 7 Radio Buttons */}
                  <div className="sim402-frame-up">
                    <div className="sim402-frame-title">Model Selection</div>
                    <div className="sim402-radio-group">
                      {Object.entries(PRESET_MODELS).map(([key, item]) => {
                        const isSelected = selectedModelKey === key;
                        return (
                          <label
                            key={key}
                            className={`sim402-radio-item ${isSelected ? 'selected' : ''} ${isRunning ? 'disabled' : ''}`}
                          >
                            <input
                              type="radio"
                              name="fopdt-preset"
                              value={key}
                              checked={isSelected}
                              disabled={isRunning}
                              onChange={() => !isRunning && handleModelChange(key)}
                              className="sim402-radio-input"
                            />
                            <span className="sim402-radio-custom" />
                            <span className="sim402-radio-label">{item.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frame 2 (Bottom / "down"): Model Display + 3 Sliders */}
                  <div className="sim402-frame-down">
                    <div className="sim402-frame-title">Model Parameters &amp; Transfer Function</div>

                    {/* Mathematical Model Formula Display */}
                    <div className="sim402-fopdt-math-card">
                      <div className="sim402-fopdt-math-formula">
                        <span className="sim402-fopdt-math-g">G(s) = </span>
                        {timeLag > 0 && (
                          <span className="sim402-fopdt-math-exp">
                            e<sup>-{timeLag.toFixed(1)}s</sup>
                          </span>
                        )}
                        <div className="sim402-fopdt-fraction">
                          <span className="sim402-fopdt-num">{staticGain.toFixed(2)}</span>
                          <span className="sim402-fopdt-bar" />
                          <span className="sim402-fopdt-den">{timeConstant.toFixed(1)}s + 1</span>
                        </div>
                      </div>
                    </div>

                    {/* Three Sliders (Static Gain, Time Constant, Time Lag) */}
                    <div className="sim402-fopdt-sliders-row">
                      <SimACE401Slider
                        label="Static Gain"
                        min={0}
                        max={40}
                        step={0.1}
                        ticks={[0, 10, 20, 30, 40]}
                        value={staticGain}
                        decimals={2}
                        enabled={isCustom && !isRunning}
                        readOnly={!isCustom || isRunning}
                        onChange={setStaticGain}
                        width={120}
                        plateHeight={105}
                      />
                      <SimACE401Slider
                        label="Time Constant (s)"
                        min={0}
                        max={400}
                        step={0.5}
                        ticks={[0, 100, 200, 300, 400]}
                        value={timeConstant}
                        decimals={1}
                        enabled={isCustom && !isRunning}
                        readOnly={!isCustom || isRunning}
                        onChange={setTimeConstant}
                        width={132}
                        plateHeight={105}
                      />
                      <SimACE401Slider
                        label="Time Lag (s)"
                        min={0}
                        max={40}
                        step={0.1}
                        ticks={[0, 10, 20, 30, 40]}
                        value={timeLag}
                        decimals={1}
                        enabled={isCustom && !isRunning}
                        readOnly={!isCustom || isRunning}
                        onChange={setTimeLag}
                        width={120}
                        plateHeight={105}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Process Schematic */}
              {leftTab === 'schematic' && (
                <div className="sim402-schematic-tab-wrapper">
                  <SimACE402Schematic
                    pv={pv}
                    sp={sp}
                    op={op}
                    isRunning={isRunning && !isPaused}
                    modelName={currentPreset?.name ?? 'FOPDT Model'}
                  />
                </div>
              )}
            </div>

            {/* Bottom Status / Clock Bar (matching Figure 3) */}
            <div className="sim402-left-card-footer">
              <div className="sim402-clock-box">
                <span className="sim402-clock-icon">🕒</span>
                <span className="sim402-clock-val">{currentTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upper Parameters & Lower Trend Graph */}
        <div className="sim402-right-column">
          <div className="sim402-right-upper-panel">
            <SimACE402Parameters
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isRunning={isRunning}
              sp={sp}
              onSpChange={setSp}
              pv={pv}
              op={op}
              onOpChange={setOp}
              bias={bias}
              onBiasChange={setBias}
              isBiasEnabled={false}
              pb={pb}
              onPbChange={setPb}
              it={it}
              onItChange={setIt}
              dt={dt}
              onDtChange={setDt}
              pbContribution={pbContribution}
              itContribution={itContribution}
              dtContribution={dtContribution}
              load={load}
              onLoadChange={setLoad}
              onAddLoad={handleAddLoad}
              isAddLoadActive={isAddLoadActive}
              isAuto={isAuto}
              onToggleAuto={handleToggleAuto}
              logEntries={logEntries}
            />
          </div>

          <div className="sim402-right-lower-panel">
            <TrendGraph
              data={trendData}
              isHold={isPaused}
              showSP={true}
              showPV={true}
              showOP={true}
            />
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
