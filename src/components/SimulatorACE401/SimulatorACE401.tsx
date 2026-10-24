import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE401Header } from './SimACE401Header';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401ExperimentCards } from './SimACE401ExperimentCards';
import { SimACE401Parameters, type SimLogEntry } from './SimACE401Parameters';
import { SimACE401Schematic } from './SimACE401Schematic';
import { TrendGraph, type TrendDataPoint } from '../TrainerACE101/TrendGraph';
import { SimACE401UserManual } from './SimACE401UserManual';
import { SimACE401StopModal } from './SimACE401StopModal';
import type { SimExperiment } from './SimACE401ExperimentCards';
import './SimulatorACE401.css';

interface SimulatorACE401Props {
  onHome: () => void;
}

export const SimulatorACE401: React.FC<SimulatorACE401Props> = ({ onHome }) => {
  // ── 1. Experiment Mode ──
  const [experiment, setExperiment] = useState<SimExperiment>('pid');

  // ── 2. Study Parameters ──
  const [bumplessTransfer, setBumplessTransfer] = useState<boolean>(true);
  const [antiResetWindup, setAntiResetWindup] = useState<boolean>(true);
  const [constantOutflow, setConstantOutflow] = useState<boolean>(false);
  const [constantPV, setConstantPV] = useState<boolean>(false);
  const [action, setAction] = useState<'direct' | 'reverse'>('direct');

  // ── 3. Simulation Speed (Default 1x, running for every second) ──
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // ── 4. Plant Parameters (First Principle Level Tank) ──
  const [tankDiameter, setTankDiameter] = useState<number>(10);      // dia in cm
  const [tankHeight, setTankHeight] = useState<number>(25);          // h in cm
  const [steadyStateFlow, setSteadyStateFlow] = useState<number>(40); // q0_ss in LPH
  const [maxInflow, setMaxInflow] = useState<number>(100);            // qimax in LPH
  const [timeLag, setTimeLag] = useState<number>(1.0);                // Time Lag (s)

  // ── 5. Controller Parameters ──
  const [sp, setSp] = useState<number>(50);
  const [pv, setPv] = useState<number>(0);
  const [op, setOp] = useState<number>(0); // 0 for Direct, 100 for Reverse
  const [load, setLoad] = useState<number>(10);
  const [isAddLoadActive, setIsAddLoadActive] = useState<boolean>(false);
  const [bias, setBias] = useState<number>(40.0);
  const [isAuto, setIsAuto] = useState<boolean>(true);

  const [pb, setPb] = useState<number>(20);
  const [it, setIt] = useState<number>(30);
  const [dt, setDt] = useState<number>(1.0);
  const [hysteresis, setHysteresis] = useState<number>(2);

  const [pbContribution, setPbContribution] = useState<number>(0);
  const [itContribution, setItContribution] = useState<number>(0);
  const [dtContribution, setDtContribution] = useState<number>(0);
  const [outFlowPercent, setOutFlowPercent] = useState<number>(0);

  // ── 6. Tab Management (Initially Plant active; on Run -> Controller & Log enabled, Plant disabled) ──
  const [activeTab, setActiveTab] = useState<'plant' | 'controller' | 'log'>('plant');

  // ── 7. Runtime Simulation & Plot State ──
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false);

  const [showSP, setShowSP] = useState<boolean>(true);
  const [showPV, setShowPV] = useState<boolean>(true);
  const [showOP, setShowOP] = useState<boolean>(true);

  const [logEntries, setLogEntries] = useState<SimLogEntry[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([{ time: 0, sp: 50, pv: 0, op: 0 }]);

  const [isUserManualOpen, setIsUserManualOpen] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // ── Internal Simulation State Ref (Exact match to LabVIEW ACE401.vi shift registers) ──
  const simStateRef = useRef({
    pv1: 0,              // PV (%)
    qi: 0,               // Inflow (LPH)
    q0: 0,               // Outflow (LPH)
    out1: 0,             // Delayed controller output entering the plant
    prevOp: 0,           // Previous controller output (%)
    prevError: 0,        // Previous error for derivative de = error - err
    bias: 40.0,          // Internal integral bias (ibias)
    simTime: 0,          // Current simulation time in seconds
    lastLogSec: -1,
    delayBuffer: new Array(60).fill(0) as number[], // Transport delay buffer for Time Lag
    isAddLoadPending: false,                          // Momentary Add Load flag
  });

  // Action toggle handler: updates default OP when changed while stopped
  const handleToggleAction = () => {
    setAction((prev) => {
      const next = prev === 'direct' ? 'reverse' : 'direct';
      const defOp = next === 'direct' ? 0 : 100;
      if (!isRunning) {
        setOp(defOp);
        simStateRef.current.prevOp = defOp;
        simStateRef.current.out1 = defOp;
        simStateRef.current.delayBuffer = new Array(60).fill(defOp);
        setTrendData([{ time: 0, sp, pv: 0, op: defOp }]);
      }
      return next;
    });
  };

  // Experiment mode switch
  const handleExperimentChange = (newExp: SimExperiment) => {
    setExperiment(newExp);
    if (!isRunning) {
      setBias(40.0);
      simStateRef.current.bias = 40.0;
    }
  };

  // Live System Clock formatting
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

  // ── Physics Step Execution (1 second per step, matching ACE401.vi block diagram) ──
  const stepPhysics = useCallback(() => {
      const state = simStateRef.current;

      // ── Plant Initial Constants (Formula Node 1 in ACE401.vi) ──
      // float A; float K;
      // A=3.14*(dia/2)*(dia/2);
      // K=(q0*0.28)/(A*sqrt(2*0.098*h/2));
      const dia = Math.max(0.1, tankDiameter);
      const h = Math.max(0.1, tankHeight);
      const q0_ss = steadyStateFlow;
      const A = 3.14 * (dia / 2) * (dia / 2);
      const K = (q0_ss * 0.28) / (A * Math.sqrt(2 * 0.098 * (h / 2)));

      // ── 1. PLANT FIRST PRINCIPLE STEP (Formula Node 2 in ACE401.vi) ──
      // Inputs: flow, A, K, h, qimax, qi, act, q0, out (which is delayed out1), pv1, add, load
      const delayedOp = state.out1;

      // Inflow qi based on Action:
      // if (act==0){ qi=qimax-(out*qimax/100); } else{ qi=out*qimax/100; }
      let curQi = 0;
      if (action === 'direct') {
        curQi = maxInflow - (delayedOp * maxInflow) / 100;
      } else {
        curQi = (delayedOp * maxInflow) / 100;
      }

      // Height and PV integration:
      // dh=(qi-q0)*0.28/A;
      // pv=(100/h)*dh;
      // pv1=pv+pv1;
      const dh = ((curQi - state.q0) * 0.28) / A;
      const dPv = (100 / h) * dh;
      let newPv1 = state.pv1 + dPv;

      // Momentary Add Load:
      // if (add==1){ pv1=pv1+load; }
      if (state.isAddLoadPending) {
        newPv1 += load;
        state.isAddLoadPending = false;
      }

      // In ACE401.vi, pv1 output is clamped to [0, 100]
      newPv1 = Math.max(0, Math.min(100, newPv1));

      // pv_cm = pv1 / 4 (or (pv1/100)*h)
      const pv_cm = (newPv1 / 100) * h;

      // Outflow q0:
      // if (flow==0) { q0=K*A*(sqrt(2*0.098*pv_cm)/0.28); }
      let curQ0 = 0;
      if (!constantOutflow) {
        curQ0 = (K * A * Math.sqrt(2 * 0.098 * Math.max(0, pv_cm))) / 0.28;
      } else {
        curQ0 = outFlowPercent;
      }

      state.qi = curQi;
      state.q0 = curQ0;
      state.pv1 = newPv1;

      // Process Variable into Controller (overridden if Constant PV is enabled)
      const effectivePv = constantPV ? pv : newPv1;

      // ── 2. CONTROLLER FORMULA NODES (Matching Figures 1, 2, 3, 4) ──
      // Error calculation:
      // if (act==1) { error=sp1-pv1; } else { error=pv1-sp1; }
      const error = action === 'reverse' ? sp - effectivePv : effectivePv - sp;

      let computedOp = state.prevOp;
      let pop = 0;
      let iop = 0;
      let dop = 0;
      let nextBias = state.bias;
      let nextPrevError = state.prevError;

      if (experiment === 'onoff') {
        // ── ON/OFF MODE (Exact Figure 4 from previous prompt) ──
        const halfHys = hysteresis * 0.5;
        let newOp = state.prevOp;

        if (action === 'direct') {
          if (effectivePv >= sp + halfHys) {
            newOp = 100;
          } else if (effectivePv <= sp - halfHys) {
            newOp = 0;
          }
        } else {
          // Reverse
          if (effectivePv >= sp + halfHys) {
            newOp = 0;
          } else if (effectivePv <= sp - halfHys) {
            newOp = 100;
          }
        }

        computedOp = newOp;
        pop = 0;
        iop = 0;
        dop = 0;
      } else if (experiment === 'p') {
        // ── P MODE (Exact Figure 2) ──
        // kp=100/PB; pop=kp*error; out=pop+bias;
        const kp = 100 / Math.max(0.01, pb);
        pop = kp * error;
        iop = 0;
        dop = 0;
        computedOp = pop + bias; // Bias is user-adjustable in P mode
        nextBias = bias;
      } else if (experiment === 'pi') {
        // ── PI MODE (Exact Figure 1) ──
        // kp=100/PB; pop=kp*error; iop=pop/IT;
        // if (Rst==1 && (OP>=100 || OP<=0)) { ibias=bias; } else { ibias=bias+iop; }
        // out=pop+iop+ibias;
        const kp = 100 / Math.max(0.01, pb);
        pop = kp * error;
        iop = pop / Math.max(0.1, it);
        dop = 0;

        let ibias = state.bias;
        if (antiResetWindup && (state.prevOp >= 100 || state.prevOp <= 0)) {
          ibias = state.bias;
        } else {
          ibias = state.bias + iop;
        }
        computedOp = pop + iop + ibias;
        nextBias = ibias; // Varies internally with respect to integral contribution
      } else if (experiment === 'pd') {
        // ── PD MODE (Exact Figure 4) ──
        // kp=100/PB; pop=kp*error; de=error-err; dop=kp*DT*de; out=pop+dop+bias;
        const kp = 100 / Math.max(0.01, pb);
        pop = kp * error;
        const de = error - state.prevError;
        dop = kp * dt * de;
        iop = 0;
        computedOp = pop + dop + bias; // Bias is constant in PD mode
        nextPrevError = error;
        nextBias = bias;
      } else if (experiment === 'pid') {
        // ── PID MODE (Exact Figure 3) ──
        // kp=100/PB; pop=kp*error; iop=pop/IT; de=error-err; dop=kp*DT*de;
        // if (Rst==1 && (OP>=100 || OP<=0)) { ibias=bias; } else { ibias=bias+iop; }
        // out=pop+iop+dop+ibias;
        const kp = 100 / Math.max(0.01, pb);
        pop = kp * error;
        iop = pop / Math.max(0.1, it);
        const de = error - state.prevError;
        dop = kp * dt * de;

        let ibias = state.bias;
        if (antiResetWindup && (state.prevOp >= 100 || state.prevOp <= 0)) {
          ibias = state.bias;
        } else {
          ibias = state.bias + iop;
        }
        computedOp = pop + iop + dop + ibias;
        nextPrevError = error;
        nextBias = ibias; // Varies internally with respect to integral contribution
      }

      // Manual mode override: if (AM==1) { out=OP; if (Bump==1){ ibias=out-(pop+dop); } }
      if (!isAuto) {
        computedOp = op;
        if (bumplessTransfer) {
          if (experiment === 'pi') {
            nextBias = computedOp - pop;
          } else if (experiment === 'pid') {
            nextBias = computedOp - (pop + dop);
          }
        }
      }

      // Clamped controller output to [0, 100]
      const clampedOp = Math.max(0, Math.min(100, computedOp));

      // ── 3. TIME LAG ROTATION & TRANSPORT DELAY ──
      // In ACE401.vi: Rotate 1D Array by 1, Insert at index 0, Index Array at Time Lag (s) -> out1
      // For 1 sec of Time Lag, the n+1 sec output is nth output
      state.delayBuffer.unshift(clampedOp);
      if (state.delayBuffer.length > 60) {
        state.delayBuffer.pop();
      }

      const lagSec = Math.max(0, Math.min(50, Math.round(timeLag)));
      const delayedNextOp = state.delayBuffer[lagSec] !== undefined ? state.delayBuffer[lagSec] : clampedOp;
      state.out1 = delayedNextOp;

      // ── 4. UPDATE SHIFT REGISTERS & REACT STATES ──
      state.prevOp = clampedOp;
      state.prevError = nextPrevError;
      state.bias = nextBias;
      state.simTime += 1;

      // State updates
      setPv(effectivePv);
      setOp(clampedOp);
      setBias(nextBias);
      setPbContribution(pop);
      setItContribution(iop);
      setDtContribution(dop);
      if (!constantOutflow) {
        setOutFlowPercent(curQ0);
      }

      // Append to Trend Data
      setTrendData((prev) => {
        const newPoint: TrendDataPoint = {
          time: Math.round(state.simTime),
          sp,
          pv: Number(effectivePv.toFixed(1)),
          op: Number(clampedOp.toFixed(1)),
        };
        const updated = [...prev, newPoint];
        return updated.length > 10000 ? updated.slice(updated.length - 10000) : updated;
      });

      // Append to Log Table every 1 second of simulation time (Top-down chronological, keep 10000 points)
      const curSec = Math.floor(state.simTime);
      if (isLogging && curSec !== state.lastLogSec) {
        state.lastLogSec = curSec;
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString();

        setLogEntries((prev) => [
          ...prev,
          {
            time: timeFormatted,
            timeS: curSec,
            sp,
            pv: Number(effectivePv.toFixed(1)),
            op: Number(clampedOp.toFixed(1)),
            pb,
            it,
            dt,
          },
        ].slice(-10000));
      }
    },
    [
      tankHeight,
      tankDiameter,
      steadyStateFlow,
      maxInflow,
      constantPV,
      pv,
      constantOutflow,
      outFlowPercent,
      action,
      sp,
      isAuto,
      op,
      experiment,
      hysteresis,
      pb,
      it,
      dt,
      bias,
      antiResetWindup,
      bumplessTransfer,
      timeLag,
      load,
      isLogging,
    ]
  );

  // Simulation Timer Loop (Runs every second, scaled by simSpeed)
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalMs = Math.round(1000 / Math.max(0.1, simSpeed));
    const timer = setInterval(() => {
      stepPhysics();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, stepPhysics, simSpeed]);

  // Momentary Add Load: Adds Load (%) to present PV, resets button immediately
  const handleAddLoad = () => {
    setIsAddLoadActive(true);
    setTimeout(() => setIsAddLoadActive(false), 200);

    simStateRef.current.isAddLoadPending = true;
    if (!isRunning || isPaused) {
      const updatedPv = Math.max(0, Math.min(100, pv + load));
      simStateRef.current.pv1 = updatedPv;
      setPv(updatedPv);
    }
  };

  // Bumpless Transfer Toggle
  const handleToggleAuto = () => {
    if (!isAuto) {
      if (bumplessTransfer) {
        const state = simStateRef.current;
        const kp = 100 / Math.max(0.01, pb);
        const error = action === 'reverse' ? sp - pv : pv - sp;
        const pop = kp * error;
        if (experiment === 'pi') {
          state.bias = op - pop;
        } else if (experiment === 'pid') {
          state.bias = op - (pop + dtContribution);
        }
        setBias(state.bias);
      }
      setIsAuto(true);
    } else {
      setIsAuto(false);
    }
  };

  // Toolbar Handlers
  const handleRun = () => {
    setIsRunning(true);
    setIsPaused(false);
    setActiveTab('controller');
  };

  const handlePause = () => {
    setIsPaused((p) => !p);
  };

  const handleSingleStep = () => {
    if (!isRunning) {
      setIsRunning(true);
      setActiveTab('controller');
    }
    setIsPaused(true);
    stepPhysics();
  };

  // Stop button clicked: show modal popup
  const handleStop = () => {
    setIsStopModalOpen(true);
  };

  // Confirm Stop: reset log, graph, and start fresh from default values
  const handleConfirmStop = () => {
    setIsStopModalOpen(false);
    setIsRunning(false);
    setIsPaused(false);
    setActiveTab('plant');

    const defOp = action === 'direct' ? 0 : 100;
    const initialBias = 40.0;

    setPv(0);
    setOp(defOp);
    setBias(initialBias);
    setPbContribution(0);
    setItContribution(0);
    setDtContribution(0);
    setOutFlowPercent(0);

    const initialBuffer = new Array(60).fill(defOp);
    simStateRef.current = {
      pv1: 0,
      qi: 0,
      q0: 0,
      out1: defOp,
      prevOp: defOp,
      prevError: 0,
      bias: initialBias,
      simTime: 0,
      lastLogSec: -1,
      delayBuffer: initialBuffer,
      isAddLoadPending: false,
    };

    setLogEntries([]);
    setTrendData([{ time: 0, sp, pv: 0, op: defOp }]);
  };

  const handleCancelStop = () => {
    setIsStopModalOpen(false);
  };

  const handleToggleHold = () => {
    setIsPaused((p) => !p);
  };

  const handleSaveLog = () => {
    if (logEntries.length === 0) {
      alert('Log Table is empty. Start simulation with Log ON to record data before saving.');
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
    link.download = `ACE401_Log_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    setLogEntries([]);
    simStateRef.current.lastLogSec = -1;
  };

  const handleExportGraph = () => {
    const canvas = document.querySelector('.trend-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('Waveform canvas is not ready to export.');
      return;
    }
    const link = document.createElement('a');
    link.download = `ACE401_TrendGraph_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="sim401-page">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <SimACE401Header />

      {/* ── Trainer Toolbar with Speed Selector & Pause/Step ────────── */}
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
        onToggleHold={handleToggleHold}
        onExportGraph={handleExportGraph}
        onUserGuide={() => setIsUserManualOpen(true)}
        onHome={onHome}
        showExit={false}
        speedMultiplier={simSpeed}
        onSpeedChange={setSimSpeed}
      />

      {/* ── Main Layout: Left Column (4fr) and Right Column (6fr) ─── */}
      <div className="sim401-main-layout">
        {/* Left Column: Experiment/Study Cards + Shrunk Process Schematic */}
        <div className="sim401-left-column">
          <SimACE401ExperimentCards
            experiment={experiment}
            onExperimentChange={handleExperimentChange}
            bumplessTransfer={bumplessTransfer}
            onToggleBumpless={() => setBumplessTransfer((v) => !v)}
            antiResetWindup={antiResetWindup}
            onToggleAntiReset={() => setAntiResetWindup((v) => !v)}
            constantOutflow={constantOutflow}
            onToggleConstantOutflow={() => setConstantOutflow((v) => !v)}
            constantPV={constantPV}
            onToggleConstantPV={() => setConstantPV((v) => !v)}
            action={action}
            onToggleAction={handleToggleAction}
          />

          {/* Shrunk Process Schematic Card */}
          <SimACE401Schematic
            pv={pv}
            sp={sp}
            op={op}
            isRunning={isRunning && !isPaused}
            currentTimeStr={currentTimeStr}
          />
        </div>

        {/* Right Column: Mimicking Figures 2, 3, and 4 */}
        <div className="sim401-right-column">
          {/* Upper Right: Tabbed Parameters Panel */}
          <div className="sim401-right-upper-panel">
            <SimACE401Parameters
              experiment={experiment}
              isRunning={isRunning}
              activeTab={activeTab}
              onTabChange={setActiveTab}
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
              onPvManualChange={setPv}
              constantPV={constantPV}
              op={op}
              onOpManualChange={setOp}
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
              outFlowPercent={outFlowPercent}
              onOutFlowPercentChange={setOutFlowPercent}
              constantOutflow={constantOutflow}
              hysteresis={hysteresis}
              onHysteresisChange={setHysteresis}
              pbContribution={pbContribution}
              itContribution={itContribution}
              dtContribution={dtContribution}
              logEntries={logEntries}
            />
          </div>

          {/* Lower Right: Trend Graph */}
          <div className="sim401-right-lower-panel">
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
          </div>
        </div>
      </div>

      {/* Stop Confirmation Modal */}
      <SimACE401StopModal
        isOpen={isStopModalOpen}
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />

      {/* User Manual Modal */}
      <SimACE401UserManual
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
      />
    </div>
  );
};
