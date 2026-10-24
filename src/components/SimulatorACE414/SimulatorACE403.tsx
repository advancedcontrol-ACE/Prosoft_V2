import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimACE403Header } from './SimACE403Header';
import { SimACE403Schematic, type EstimationMethod } from './SimACE403Schematic';
import { SimACE403Analysis, type DataPoint } from './SimACE403Analysis';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { SimACE401StopModal } from '../SimulatorACE401/SimACE401StopModal';
import './SimulatorACE403.css';

interface SimulatorACE414Props {
  onHome: () => void;
}

export const SimulatorACE414: React.FC<SimulatorACE414Props> = ({ onHome }) => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'schematic' | 'analysis' | 'log'>('schematic');
  const [method, setMethod] = useState<EstimationMethod>('reaction');

  // Simulation execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLogOn, setIsLogOn] = useState<boolean>(true);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  // Step Phase
  const [stepPhase, setStepPhase] = useState<
    'idle' | 'initial_running' | 'initial_steady' | 'final_running' | 'final_steady'
  >('idle');

  // Step test parameters
  const [initialCo, setInitialCo] = useState<number>(20);
  const [finalCo, setFinalCo] = useState<number>(50);
  const [currentCo, setCurrentCo] = useState<number>(20);

  // Plant parameters
  const [tankDiameter, setTankDiameter] = useState<number>(15);
  const [tankHeight, setTankHeight] = useState<number>(50);
  const [maxInflow, setMaxInflow] = useState<number>(300);
  const [steadyStateFlow, setSteadyStateFlow] = useState<number>(100);
  const [timeLag, setTimeLag] = useState<number>(3.0);

  // Process live state
  const [pv, setPv] = useState<number>(0);
  const [simTime, setSimTime] = useState<number>(0);
  const [stepTime, setStepTime] = useState<number>(0);
  const [initialPv, setInitialPv] = useState<number>(0);
  const [finalPv, setFinalPv] = useState<number>(0);

  // Data history
  const [recordedData, setRecordedData] = useState<DataPoint[]>([]);

  // Transport delay buffer
  const coBufferRef = useRef<{ time: number; val: number }[]>([]);

  // Apply Initial Step
  const handleApplyInitialStep = useCallback(() => {
    setCurrentCo(initialCo);
    setStepPhase('initial_running');
  }, [initialCo]);

  // Apply Final Step
  const handleApplyFinalStep = useCallback(() => {
    setCurrentCo(finalCo);
    setStepTime(simTime);
    setInitialPv(pv);
    setStepPhase('final_running');
    // Auto switch to analysis / process plot tab
    setActiveTab('analysis');
  }, [finalCo, simTime, pv]);

  // Start simulation
  const handleRun = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      if (stepPhase === 'idle') {
        setCurrentCo(initialCo);
        setStepPhase('initial_running');
      }
    }
  };

  // Stop button clicked
  const handleStopRequest = () => {
    setShowStopModal(true);
  };

  // Confirm Stop & Reset
  const handleConfirmReset = () => {
    setShowStopModal(false);
    setIsRunning(false);
    setIsPaused(false);
    setSimTime(0);
    setPv(0);
    setStepPhase('idle');
    setRecordedData([]);
    coBufferRef.current = [];
  };

  const handleCancelReset = () => {
    setShowStopModal(false);
  };

  // Pause toggle
  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  // Single step
  const handleSingleStep = () => {
    if (!isRunning) setIsRunning(true);
    setIsPaused(true);
    tickSimulation(0.2);
  };

  // Simulation physics tick
  const tickSimulation = useCallback(
    (dtSec: number) => {
      // 1. Queue CO into delay buffer
      const curT = simTime + dtSec;
      coBufferRef.current.push({ time: curT, val: currentCo });

      // Clean old delay buffer entries
      while (
        coBufferRef.current.length > 1 &&
        coBufferRef.current[0].time < curT - Math.max(timeLag, 10)
      ) {
        coBufferRef.current.shift();
      }

      // 2. Fetch delayed CO
      const delayedT = curT - timeLag;
      let effectiveCo = currentCo;
      if (coBufferRef.current.length > 0) {
        let best = coBufferRef.current[0];
        for (const item of coBufferRef.current) {
          if (item.time <= delayedT) best = item;
          else break;
        }
        effectiveCo = best.val;
      }

      // 3. Tank Area & Inflow
      const area = Math.PI * Math.pow(tankDiameter / 2, 2); // cm^2
      const qInLph = (effectiveCo / 100) * maxInflow;
      const qInCm3s = (qInLph * 1000) / 3600; // cm^3/s

      // 4. Outflow Torricelli
      const hNom = 25; // 50% of 50cm
      const qSsCm3s = (steadyStateFlow * 1000) / 3600;
      const cOut = qSsCm3s / Math.sqrt(hNom);
      const qOutCm3s = cOut * Math.sqrt(Math.max(0, pv));

      // 5. Differential height dh/dt
      const dh = ((qInCm3s - qOutCm3s) / area) * dtSec;
      const nextPv = Math.max(0, Math.min(tankHeight, pv + dh));

      // Check steady state
      if (stepPhase === 'initial_running') {
        if (Math.abs(nextPv - pv) < 0.002 && curT > 10) {
          setStepPhase('initial_steady');
        }
      } else if (stepPhase === 'final_running') {
        if (Math.abs(nextPv - pv) < 0.002 && curT > stepTime + 15) {
          setStepPhase('final_steady');
          setFinalPv(nextPv);
        }
      }

      setPv(nextPv);
      setSimTime(curT);

      // Record data point
      if (isLogOn) {
        setRecordedData((prev) => [
          ...prev,
          {
            time: Math.round(curT * 10) / 10,
            co: currentCo,
            pv: Math.round(nextPv * 100) / 100,
          },
        ]);
      }
    },
    [
      simTime,
      currentCo,
      timeLag,
      tankDiameter,
      maxInflow,
      steadyStateFlow,
      pv,
      tankHeight,
      stepPhase,
      stepTime,
      isLogOn,
    ]
  );

  // Animation Loop
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalMs = 200; // 5 ticks per sec baseline
    const interval = setInterval(() => {
      const dtSec = 0.2 * speedMultiplier;
      tickSimulation(dtSec);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, speedMultiplier, tickSimulation]);

  return (
    <div className="sim403-container">
      {/* Module Header */}
      <SimACE403Header
        onHome={onHome}
        isRunning={isRunning}
        activeMethod={method}
      />

      {/* Shared Toolbar */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogOn}
        isAuto={false}
        isGraphHold={isPaused}
        isPaused={isPaused}
        isConnected={true}
        isExperimentSelected={true}
        onRun={handleRun}
        onPause={handlePauseToggle}
        onSingleStep={handleSingleStep}
        onStop={handleStopRequest}
        onToggleAuto={() => {}}
        onToggleLog={() => setIsLogOn(!isLogOn)}
        onSaveLog={() => {
          const csv =
            'Time(s),CO(%),PV(cm)\n' +
            recordedData.map((d) => `${d.time},${d.co},${d.pv}`).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ACE403_Empirical_${method}_data.csv`;
          a.click();
        }}
        onClearLog={() => setRecordedData([])}
        onToggleHold={handlePauseToggle}
        onExportGraph={() => {}}
        onUserGuide={() => {}}
        onHome={onHome}
        showExit={false}
        speedMultiplier={speedMultiplier}
        onSpeedChange={setSpeedMultiplier}
      />

      {/* Main Tab Bar */}
      <div className="sim403-nav-tabs">
        <button
          type="button"
          className={`sim403-nav-tab ${activeTab === 'schematic' ? 'active' : ''}`}
          onClick={() => setActiveTab('schematic')}
        >
          Process Schematic & Step Controls
        </button>
        <button
          type="button"
          className={`sim403-nav-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Process Plot & Model Estimation
        </button>
        <button
          type="button"
          className={`sim403-nav-tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Table ({recordedData.length} pts)
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="sim403-content-area">
        {activeTab === 'schematic' && (
          <SimACE403Schematic
            method={method}
            onMethodChange={setMethod}
            isRunning={isRunning}
            pv={pv}
            co={currentCo}
            initialCo={initialCo}
            onInitialCoChange={setInitialCo}
            finalCo={finalCo}
            onFinalCoChange={setFinalCo}
            onApplyInitialStep={handleApplyInitialStep}
            onApplyFinalStep={handleApplyFinalStep}
            stepPhase={stepPhase}
            tankDiameter={tankDiameter}
            onTankDiameterChange={setTankDiameter}
            tankHeight={tankHeight}
            onTankHeightChange={setTankHeight}
            maxInflow={maxInflow}
            onMaxInflowChange={setMaxInflow}
            steadyStateFlow={steadyStateFlow}
            onSteadyStateFlowChange={setSteadyStateFlow}
            timeLag={timeLag}
            onTimeLagChange={setTimeLag}
          />
        )}

        {activeTab === 'analysis' && (
          <SimACE403Analysis
            method={method}
            recordedData={recordedData}
            stepTime={stepTime}
            initialCo={initialCo}
            finalCo={finalCo}
            initialPv={initialPv}
            finalPv={finalPv || pv}
          />
        )}

        {activeTab === 'log' && (
          <div className="sim403-log-card">
            <h3 className="sim403-log-title">Empirical Step Test Recorded Data</h3>
            <div className="sim403-log-table-wrapper">
              <table className="sim403-log-table">
                <thead>
                  <tr>
                    <th>Time (s)</th>
                    <th>Controller Output (%)</th>
                    <th>Measured Level PV (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {recordedData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-text">
                        No recorded data yet. Hit RUN to start step response recording.
                      </td>
                    </tr>
                  ) : (
                    recordedData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.time.toFixed(1)}</td>
                        <td>{row.co.toFixed(1)}%</td>
                        <td>{row.pv.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stop & Reset Dialog Modal */}
      <SimACE401StopModal
        isOpen={showStopModal}
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </div>
  );
};
