import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrainerHeader } from './TrainerHeader';
import { TrainerToolbar } from './TrainerToolbar';
import { ProcessSchematic } from './ProcessSchematic';
import { ControllerParametersPanel } from './ControllerParametersPanel';
import type { ControllerState, LogEntry } from './ControllerParametersPanel';
import { TrendGraph } from './TrendGraph';
import type { TrendDataPoint } from './TrendGraph';
import { ComPortModal } from './ComPortModal';
import { fetchAvailablePorts } from '../../services/modbus/serialPorts';
import { DeltaDTBService } from '../../services/modbus/dtb9696Modbus';
import type { ModbusLiveState } from '../../services/modbus/dtb9696Modbus';
import './TrainerACE101.css';

interface TrainerACE101Props {
  onHome: () => void;
}

export const TrainerACE101: React.FC<TrainerACE101Props> = ({ onHome }) => {
  // Connection and Port State
  const [comPort, setComPort] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isComModalOpen, setIsComModalOpen] = useState<boolean>(false);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);

  // Top Menu States in this Trainer Screen (Figure 1: COM Port | Experiment)
  const [openTopMenu, setOpenTopMenu] = useState<'com' | 'exp' | null>(null);

  useEffect(() => {
    fetchAvailablePorts().then(setAvailablePorts);
  }, []);

  // Controller State (Figure 1 & Figure 2 values — with saved Device ID & Action from localStorage)
  const [ctrlState, setCtrlState] = useState<ControllerState>(() => {
    let savedDeviceId = 1;
    let savedAction: 'Direct' | 'Reverse' = 'Direct';
    try {
      const stored = localStorage.getItem('ace_prosoft_controller_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.deviceId === 'number' && parsed.deviceId >= 1 && parsed.deviceId <= 247) {
          savedDeviceId = parsed.deviceId;
        }
        if (parsed.action === 'Direct' || parsed.action === 'Reverse') {
          savedAction = parsed.action;
        }
      }
    } catch {}

    return {
      sp: 0.0,
      pv: 0.0,
      op: 0.0,
      bias: 0.0,
      pb: 20,
      it: 30,
      dt: 1,
      hysteresis: 2,
      action: savedAction,
      deviceId: savedDeviceId,
      selectedExperiment: '',
    };
  });

  // Toolbar & Execution States
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [isGraphHold, setIsGraphHold] = useState<boolean>(false);

  // Channel Toggles
  const [showSP, setShowSP] = useState<boolean>(true);
  const [showPV, setShowPV] = useState<boolean>(true);
  const [showOP, setShowOP] = useState<boolean>(true);

  // IoT Field States
  const [firebaseUrl, setFirebaseUrl] = useState<string>('');
  const [enableIoT, setEnableIoT] = useState<boolean>(false);

  // Trend Graph Data (Empty initially — no lines before connection)
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  // Log Table Entries matching Figure 2 (Time, Time s, SP %, PV %, OP %, PB %, IT s, DT s)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  // State refs for simulation loop
  const stateRef = useRef(ctrlState);
  stateRef.current = ctrlState;

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const isHoldRef = useRef(isGraphHold);
  isHoldRef.current = isGraphHold;

  const simTimeRef = useRef(0);
  const isLoggingRef = useRef(isLogging);
  isLoggingRef.current = isLogging;

  // Handle Live Modbus Polling (1 second sampling time from hardware)
  useEffect(() => {
    const modbusService = DeltaDTBService.getInstance();
    const unsub = modbusService.onLivePoll((live: ModbusLiveState) => {
      // Synchronize controller state from hardware
      setCtrlState((prev) => ({
        ...prev,
        pv: live.pv,     // Divided by 10 from 1000H
        sp: live.sp,     // Divided by 10 from 1001H
        op: live.op,     // Controller output from 1012H
        pb: live.pb,     // Divided by 10 from 1009H
        it: live.it,     // Ti from 100AH
        dt: live.dt,     // Td from 100BH
        bias: live.bias, // Bias from 100CH
        action: live.action, // Action from 1006H
      }));

      if (live.autoMan) {
        setIsAuto(live.autoMan === 'Auto');
      }

      // Record Graph and Log Table entries every 1 second
      if (isRunningRef.current && !isHoldRef.current) {
        simTimeRef.current += 1;
        const curTime = simTimeRef.current;
        const newPoint = {
          time: curTime,
          sp: live.sp,
          pv: live.pv,
          op: live.op,
        };
        setTrendData((prev) => [...prev.slice(-999), newPoint]);

        if (isLoggingRef.current) {
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          setLogEntries((prev) => [
            ...prev.slice(-999),
            {
              timeStr,
              timeSec: curTime,
              sp: live.sp,
              pv: live.pv,
              op: live.op,
              pb: live.pb,
              it: live.it,
              dt: live.dt,
            },
          ]);
        }
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Real-Time Process Simulation fallback (1-second sampling time when hardware not connected)
  useEffect(() => {
    if (!isRunning) return;
    const modbusService = DeltaDTBService.getInstance();
    if (modbusService.isHardware()) return; // Hardware poll handles updates

    let integralError = 0;
    let prevError = 0;

    const interval = setInterval(() => {
      if (!isRunningRef.current) return;

      const s = stateRef.current;
      const error = s.sp - s.pv;
      integralError += error * 1.0;

      // Bound integral windup
      integralError = Math.max(-50, Math.min(50, integralError));
      const derivative = (error - prevError) / 1.0;
      prevError = error;

      // Calculate Controller Output % (OP)
      let calcOp = 0;
      if (isAuto) {
        // Gain Kc = 100 / PB%
        const kc = 100 / Math.max(s.pb, 1);
        const ti = Math.max(s.it, 1);
        const td = s.dt;

        calcOp = s.bias + kc * (error + (1 / ti) * integralError + td * derivative);
        calcOp = Math.max(0, Math.min(100, calcOp));
      } else {
        calcOp = s.op;
      }

      // Simulate Level Process Dynamics (1 second interval):
      const fin = (calcOp / 100) * 8.0;
      const fout = 0.8 * Math.sqrt(Math.max(s.pv, 0));
      const dPv = (fin - fout) * 0.5;
      const newPv = Math.max(0, Math.min(100, s.pv + dPv));

      // Update state
      setCtrlState((prev) => ({
        ...prev,
        pv: Number(newPv.toFixed(1)),
        op: Number(calcOp.toFixed(1)),
      }));

      // Update Graph & Log Entries
      if (!isHoldRef.current) {
        simTimeRef.current += 1;
        const curTime = simTimeRef.current;
        const newPoint = {
          time: curTime,
          sp: s.sp,
          pv: Number(newPv.toFixed(1)),
          op: Number(calcOp.toFixed(1)),
        };
        setTrendData((prev) => [...prev.slice(-999), newPoint]);

        if (isLogging) {
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          setLogEntries((prev) => [
            ...prev.slice(-999),
            {
              timeStr,
              timeSec: curTime,
              sp: s.sp,
              pv: Number(newPv.toFixed(1)),
              op: Number(calcOp.toFixed(1)),
              pb: s.pb,
              it: s.it,
              dt: s.dt,
            },
          ]);
        }
      }
    }, 1000); // Sampling time: exactly 1 second

    return () => clearInterval(interval);
  }, [isRunning, isAuto, isLogging]);

  // Handle write requests from sliders and text boxes
  const handleParamWrite = useCallback(
    (param: string, value: number | string) => {
      const modbusService = DeltaDTBService.getInstance();
      modbusService.writeRegister(param, value, ctrlState.deviceId);
    },
    [ctrlState.deviceId]
  );

  const handlePortConnected = (port: string, _isRemote?: boolean) => {
    setComPort(port);
    setIsConnected(true);
    setCtrlState((prev) => ({
      ...prev,
      sp: 0.0,
      pv: 0.0,
      op: 0.0,
      bias: 0.0,
      selectedExperiment: prev.selectedExperiment || 'PID Mode',
    }));
    setTrendData([{ time: 0, sp: 0.0, pv: 0.0, op: 0.0 }]);
    setLogEntries([]);
    simTimeRef.current = 0;
  };

  // Listen for remote session revocation by host
  useEffect(() => {
    const modbusService = DeltaDTBService.getInstance();
    const unsubRevoked = modbusService.onSessionRevoked(() => {
      alert('⚠️ Your remote lab session has been revoked or ended by the Host teacher.');
      setIsConnected(false);
      setComPort('');
      setIsRunning(false);
      setTrendData([]);
      setLogEntries([]);
    });
    return () => {
      unsubRevoked();
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleDocClick = () => setOpenTopMenu(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const handleSelectExperiment = (expName: string) => {
    setCtrlState((prev) => ({ ...prev, selectedExperiment: expName }));
    setOpenTopMenu(null);
  };

  const handleSaveLog = useCallback(() => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Time,Time s,SP %,PV %,OP %,PB %,IT s,DT s\n' +
      logEntries
        .map(
          (d) =>
            `${d.timeStr},${d.timeSec},${d.sp},${d.pv},${d.op},${d.pb},${d.it},${d.dt}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ACE101_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [logEntries]);

  const handleClearLog = useCallback(() => {
    setTrendData([]);
    setLogEntries([]);
  }, []);

  const handleExportGraph = useCallback(() => {
    alert('Waveform Graph snapshot ready for export to report / presentation.');
  }, []);

  const handleUserGuide = useCallback(() => {
    alert(
      'DELTA DTB9696 Level Process Trainer (ACE 101) Manual:\n\n' +
      '1. Connect to COM Port.\n' +
      '2. Modbus address 4101 High bit initializes Run mode.\n' +
      '3. Select experiment from the Experiment menu.\n' +
      '4. Set Set Point (%), PB %, IT s, and DT s.\n' +
      '5. Click RUN to start real-time level control simulation.'
    );
  }, []);

  return (
    <div className="trainer-ace101-page">
      {/* ── Top-Level Menu Bar (Figure 1: COM Port | Experiment) ── */}
      <nav className="trainer-menubar" onClick={(e) => e.stopPropagation()}>
        {/* COM Port Menu */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className={`trainer-menu-trigger ${openTopMenu === 'com' ? 'active' : ''}`}
            onClick={() => {
              if (openTopMenu !== 'com') {
                fetchAvailablePorts().then(setAvailablePorts);
                setOpenTopMenu('com');
              } else {
                setOpenTopMenu(null);
              }
            }}
          >
            COM Port
          </button>
          {openTopMenu === 'com' && (
            <div className="trainer-menu-dropdown">
              {availablePorts.length > 0 ? (
                availablePorts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="dropdown-action-btn"
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsComModalOpen(true);
                    }}
                  >
                    {p} {comPort === p ? '✓ (Connected)' : ''}
                  </button>
                ))
              ) : (
                <div className="dropdown-no-device">No Device</div>
              )}
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-action-btn"
                onClick={() => {
                  setOpenTopMenu(null);
                  setIsComModalOpen(true);
                }}
              >
                ⚙ Communication Setup & Remote Lab...
              </button>
              {isConnected && (
                <button
                  type="button"
                  className="dropdown-action-btn disconnect"
                  onClick={() => {
                    DeltaDTBService.getInstance().disconnect();
                    setIsConnected(false);
                    setComPort('');
                    setIsRunning(false);
                    setTrendData([]);
                    setLogEntries([]);
                    setOpenTopMenu(null);
                  }}
                >
                  Disconnect Port / Remote Lab
                </button>
              )}
            </div>
          )}
        </div>

        {/* Experiment Menu (Enabled only after COM port connection with No error) */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className={`trainer-menu-trigger ${openTopMenu === 'exp' ? 'active' : ''} ${!isConnected ? 'disabled' : ''}`}
            disabled={!isConnected}
            onClick={() => isConnected && setOpenTopMenu(openTopMenu === 'exp' ? null : 'exp')}
            title={!isConnected ? 'Connect to COM Port first to enable Experiment menu' : 'Select Experiment'}
          >
            Experiment
          </button>
          {openTopMenu === 'exp' && isConnected && (
            <div className="trainer-menu-dropdown">
              {[
                'On / Off Control',
                'P Mode',
                'PI Mode',
                'PD Mode',
                'PID Mode',
                'Open Loop Test',
                'Manual Control',
              ].map((exp) => (
                <button
                  key={exp}
                  type="button"
                  className="dropdown-action-btn"
                  onClick={() => handleSelectExperiment(exp)}
                >
                  {exp} {ctrlState.selectedExperiment === exp ? '✓' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Top Header Banner ─────────────────────────────────── */}
      <TrainerHeader />

      {/* ── Action Ribbon Toolbar ─────────────────────────────── */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogging}
        isAuto={isAuto}
        isGraphHold={isGraphHold}
        enabled={isConnected}
        onRun={() => setIsRunning(true)}
        onStop={() => setIsRunning(false)}
        onToggleAuto={() => {
          const nextAuto = !isAuto;
          setIsAuto(nextAuto);
          DeltaDTBService.getInstance().writeRegister(
            'autoMan',
            nextAuto ? 'Auto' : 'Manual',
            ctrlState.deviceId
          );
        }}
        onToggleLog={() => setIsLogging(!isLogging)}
        onSaveLog={handleSaveLog}
        onClearLog={handleClearLog}
        onToggleHold={() => setIsGraphHold(!isGraphHold)}
        onExportGraph={handleExportGraph}
        onUserGuide={handleUserGuide}
        onHome={onHome}
        onExit={() => {
          try {
            window.close();
          } catch {
            // ignore
          }
          onHome();
        }}
      />

      {/* ── Main Dashboard Content Grid ──────────────────────── */}
      <div className="trainer-main-layout">
        {/* Left Column: Process Schematic / P&I Diagram */}
        <div className="layout-left-column">
          <ProcessSchematic
            pv={ctrlState.pv}
            sp={ctrlState.sp}
            op={ctrlState.op}
            isRunning={isRunning}
            firebaseUrl={firebaseUrl}
            enableIoT={enableIoT}
            onFirebaseUrlChange={setFirebaseUrl}
            onToggleIoT={() => setEnableIoT(!enableIoT)}
          />
        </div>

        {/* Right Column: Controller Parameters & Real-Time Graph */}
        <div className="layout-right-column">
          {/* Upper: Controller Parameters & Sliders */}
          <div className="right-upper-panel">
            <ControllerParametersPanel
              state={ctrlState}
              isConnected={isConnected}
              comPort={comPort}
              logEntries={logEntries}
              onOpenComModal={() => setIsComModalOpen(true)}
              onStateChange={setCtrlState}
              onParamWrite={handleParamWrite}
            />
          </div>

          {/* Lower: Real-Time Trend Waveform Graph */}
          <div className="right-lower-panel">
            <TrendGraph
              data={trendData}
              isHold={isGraphHold}
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

      {/* ── COM Port Connection Setup Modal ───────────────────── */}
      <ComPortModal
        isOpen={isComModalOpen}
        onClose={() => setIsComModalOpen(false)}
        onConnected={handlePortConnected}
      />
    </div>
  );
};
