import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrainerHeader } from './TrainerHeader';
import { TrainerToolbar } from './TrainerToolbar';
import { ProcessSchematic } from './ProcessSchematic';
import { ControllerParametersPanel } from './ControllerParametersPanel';
import type { ControllerState, LogEntry } from './ControllerParametersPanel';
import { TrendGraph } from './TrendGraph';
import type { TrendDataPoint } from './TrendGraph';
import { ComPortModal } from './ComPortModal';
import { StopConfirmModal } from './StopConfirmModal';
import { ExperimentNoticeModal } from './ExperimentNoticeModal';
import { ConnectionNoticeModal } from './ConnectionNoticeModal';
import { UserGuideModal } from './UserGuideModal';
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
  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false);
  const [isConnNoticeOpen, setIsConnNoticeOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [selectedExpNotice, setSelectedExpNotice] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [isScanningPorts, setIsScanningPorts] = useState<boolean>(false);

  // Top Menu States in this Trainer Screen (Figure 1: COM Port | Experiment)
  const [openTopMenu, setOpenTopMenu] = useState<'com' | 'exp' | null>(null);

  useEffect(() => {
    fetchAvailablePorts().then(setAvailablePorts);

    // Fetch persistent settings from backend disk (/api/settings)
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.settings) {
          const s = data.settings;
          setCtrlState((prev) => ({
            ...prev,
            deviceId:
              typeof s.deviceId === 'number' && s.deviceId >= 1 && s.deviceId <= 247
                ? s.deviceId
                : prev.deviceId,
            action: s.action === 'Direct' || s.action === 'Reverse' ? s.action : prev.action,
          }));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch /api/settings:', err);
      });
  }, []);

  // Controller State (Figure 1 & Figure 2 values — with saved Device ID & Action)
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
      sp: 50.0,
      pv: 0.0,
      op: 0.0,
      bias: 73.0,
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

  const isAutoRef = useRef(isAuto);
  isAutoRef.current = isAuto;

  const lastOpRef = useRef<number>(0);

  // Pending writes tracking to prevent poll jitter / old value flickering
  const pendingWritesRef = useRef<{ [param: string]: { value: number | string; expiresAt: number } }>({});

  // Handle Live Modbus Polling (1 second sampling time from hardware)
  useEffect(() => {
    const modbusService = DeltaDTBService.getInstance();
    const unsub = modbusService.onLivePoll((live: ModbusLiveState) => {
      // Modbus live updates are only accepted while experiment is running!
      if (!isRunningRef.current) return;

      const now = Date.now();
      const pending = pendingWritesRef.current;

      const getEffective = <T extends number | string>(param: string, liveVal: T): T => {
        const p = pending[param];
        if (p && now < p.expiresAt) {
          if (typeof liveVal === 'number' && typeof p.value === 'number') {
            if (Math.abs(liveVal - p.value) < 0.05) {
              delete pending[param];
              return liveVal;
            }
          } else if (String(liveVal).toLowerCase() === String(p.value).toLowerCase()) {
            delete pending[param];
            return liveVal;
          }
          return p.value as T;
        }
        if (p && now >= p.expiresAt) {
          delete pending[param];
        }
        return liveVal;
      };

      const effSp = getEffective('sp', live.sp);
      let effOp = getEffective('op', live.op);
      const effPb = getEffective('pb', live.pb);
      const effIt = getEffective('it', live.it);
      const effDt = getEffective('dt', live.dt);
      const effBias = getEffective('bias', live.bias);
      const effAction = getEffective('action', live.action);

      const normExp = (stateRef.current.selectedExperiment || '').trim().toLowerCase();

      // In Hardware mode while running:
      // If On/Off Control: calculate out2 using Figure 1/2 and write to OP register (4114)
      if (normExp === 'on / off control' || normExp === 'on/off control') {
        const pv1 = live.pv;
        const sp1 = effSp;
        const hys = stateRef.current.hysteresis;
        let out2 = lastOpRef.current;
        if (stateRef.current.action === 'Reverse') {
          if (pv1 <= sp1 - (hys * 0.5)) {
            out2 = 100;
          } else if (pv1 >= sp1 + (hys * 0.5)) {
            out2 = 0;
          }
        } else {
          // Direct action
          if (pv1 <= sp1 - (hys * 0.5)) {
            out2 = 0;
          } else if (pv1 >= sp1 + (hys * 0.5)) {
            out2 = 100;
          }
        }
        out2 = Math.max(0, Math.min(100, out2));
        effOp = out2;
        if (out2 !== lastOpRef.current) {
          lastOpRef.current = out2;
          pendingWritesRef.current['op'] = {
            value: out2,
            expiresAt: Date.now() + 3000,
          };
          modbusService.writeRegister('op', out2, stateRef.current.deviceId);
        }
      } else if (normExp === 'p mode' && !isAutoRef.current) {
        // If user switched to Manual in P mode: calculate out2 using Figure 3/4
        const pv1 = live.pv;
        const sp1 = effSp;
        const pb = Math.max(stateRef.current.pb, 0.001);
        const kp = 100 / pb;
        const err = stateRef.current.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        let out2 = kp * err + stateRef.current.bias;
        out2 = Math.max(0, Math.min(100, out2));
        effOp = out2;
        if (Math.abs(out2 - lastOpRef.current) > 0.5) {
          lastOpRef.current = out2;
          pendingWritesRef.current['op'] = {
            value: out2,
            expiresAt: Date.now() + 3000,
          };
          modbusService.writeRegister('op', out2, stateRef.current.deviceId);
        }
      }

      // Synchronize controller state from hardware with anti-reversion protection
      setCtrlState((prev) => ({
        ...prev,
        pv: live.pv,     // Divided by 10 from 1000H
        sp: effSp,       // Divided by 10 from 1001H
        op: effOp,       // Controller output from 1012H
        pb: effPb,       // Divided by 10 from 1009H
        it: effIt,       // Ti from 100AH
        dt: effDt,       // Td from 100BH
        bias: effBias,   // Bias from 100CH
        action: effAction, // Action from 1006H
      }));

      const effAutoMan = getEffective('autoMan', live.autoMan);
      if (effAutoMan) {
        setIsAuto(effAutoMan === 'Auto');
      }

      // Record Graph and Log Table entries every 1 second
      if (isRunningRef.current && !isHoldRef.current) {
        simTimeRef.current += 1;
        const curTime = simTimeRef.current;
        const newPoint = {
          time: curTime,
          sp: effSp,
          pv: live.pv,
          op: effOp,
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
              sp: effSp,
              pv: live.pv,
              op: effOp,
              pb: effPb,
              it: effIt,
              dt: effDt,
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
      const normExp = (s.selectedExperiment || '').trim().toLowerCase();
      let calcOp = s.op;

      if (normExp === 'open loop') {
        calcOp = s.op;
      } else if (normExp === 'on / off control' || normExp === 'on/off control') {
        const pv1 = s.pv;
        const sp1 = s.sp;
        const hys = s.hysteresis;
        let out2 = lastOpRef.current;
        if (s.action === 'Reverse') {
          if (pv1 <= sp1 - (hys * 0.5)) {
            out2 = 100;
          } else if (pv1 >= sp1 + (hys * 0.5)) {
            out2 = 0;
          }
        } else {
          // Direct action
          if (pv1 <= sp1 - (hys * 0.5)) {
            out2 = 0;
          } else if (pv1 >= sp1 + (hys * 0.5)) {
            out2 = 100;
          }
        }
        out2 = Math.max(0, Math.min(100, out2));
        lastOpRef.current = out2;
        calcOp = out2;
      } else if (normExp === 'p mode') {
        const pv1 = s.pv;
        const sp1 = s.sp;
        const pb = Math.max(s.pb, 0.001);
        const kp = 100 / pb;
        const err = s.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        let out2 = kp * err + s.bias;
        out2 = Math.max(0, Math.min(100, out2));
        calcOp = out2;
      } else if (normExp === 'closed loop') {
        const pv1 = s.pv;
        const sp1 = s.sp;
        const pb = Math.max(s.pb, 0.001);
        const kp = 100 / pb;
        const err = s.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        let out2 = kp * err + 0; // Bias is 0 for Closed loop
        out2 = Math.max(0, Math.min(100, out2));
        calcOp = out2;
      } else if (normExp === 'pi mode') {
        const pv1 = s.pv;
        const sp1 = s.sp;
        const pb = Math.max(s.pb, 0.001);
        const kp = 100 / pb;
        const ti = Math.max(s.it, 1);
        const err = s.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        integralError += err * 1.0;
        integralError = Math.max(-50, Math.min(50, integralError));
        let out2 = s.bias + kp * (err + (1 / ti) * integralError);
        out2 = Math.max(0, Math.min(100, out2));
        calcOp = out2;
      } else if (normExp === 'pd mode') {
        const pv1 = s.pv;
        const sp1 = s.sp;
        const pb = Math.max(s.pb, 0.001);
        const kp = 100 / pb;
        const td = s.dt;
        const err = s.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        const derivative = (err - prevError) / 1.0;
        prevError = err;
        let out2 = s.bias + kp * (err + td * derivative);
        out2 = Math.max(0, Math.min(100, out2));
        calcOp = out2;
      } else if (normExp === 'pid mode') {
        const pv1 = s.pv;
        const sp1 = s.sp;
        const pb = Math.max(s.pb, 0.001);
        const kp = 100 / pb;
        const ti = Math.max(s.it, 1);
        const td = s.dt;
        const err = s.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        integralError += err * 1.0;
        integralError = Math.max(-50, Math.min(50, integralError));
        const derivative = (err - prevError) / 1.0;
        prevError = err;
        let out2 = s.bias + kp * (err + (1 / ti) * integralError + td * derivative);
        out2 = Math.max(0, Math.min(100, out2));
        calcOp = out2;
      } else {
        calcOp = isAutoRef.current
          ? Math.max(0, Math.min(100, s.bias + (100 / Math.max(s.pb, 1)) * (s.sp - s.pv)))
          : s.op;
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

        if (isLoggingRef.current) {
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
  }, [isRunning]);

  // Handle write requests from sliders and text boxes
  const handleParamWrite = useCallback(
    (param: string, value: number | string) => {
      pendingWritesRef.current[param] = {
        value,
        expiresAt: Date.now() + 3000,
      };
      const modbusService = DeltaDTBService.getInstance();
      modbusService.writeRegister(param, value, ctrlState.deviceId);
    },
    [ctrlState.deviceId]
  );

  const handlePortConnected = (port: string, _isRemote?: boolean) => {
    DeltaDTBService.getInstance().stopPolling(); // Idle until Run
    setComPort(port);
    setIsConnected(true);
    setCtrlState((prev) => ({
      ...prev,
      sp: 50.0,
      pv: 0.0,
      op: 0.0,
      bias: 73.0,
      selectedExperiment: '', // Blank initially; must be selected from Experiment menu per SOP
    }));
    setTrendData([]);
    setLogEntries([]);
    simTimeRef.current = 0;
    setIsConnNoticeOpen(true); // Popup: Connection Established!
  };

  const handleSaveSettings = useCallback((settings: { deviceId: number; action: 'Direct' | 'Reverse' }) => {
    setCtrlState((prev) => ({
      ...prev,
      deviceId: settings.deviceId,
      action: settings.action,
    }));
  }, []);

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

  const handleSelectExperiment = async (expName: string) => {
    setOpenTopMenu(null);
    setSelectedExpNotice(expName); // Requirement 1: popup saying experiment is selected
    const modbusService = DeltaDTBService.getInstance();
    const norm = expName.trim().toLowerCase();

    if (norm === 'open loop') {
      setIsAuto(false); // Requirement 1: Open loop automatically goes to Manual
      pendingWritesRef.current['autoMan'] = {
        value: 'Manual',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 2, ctrlState.deviceId);

      pendingWritesRef.current['op'] = {
        value: ctrlState.op,
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('op', ctrlState.op, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
      }));
    } else if (norm === 'on / off control' || norm === 'on/off control') {
      setIsAuto(false); // Requirement 2: On/Off automatically goes to Manual
      pendingWritesRef.current['autoMan'] = {
        value: 'Manual',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 2, ctrlState.deviceId);

      // Default SP: 50, Hys: 2
      pendingWritesRef.current['sp'] = {
        value: 50.0,
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('sp', 50.0, ctrlState.deviceId);

      pendingWritesRef.current['op'] = {
        value: ctrlState.op,
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('op', ctrlState.op, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        hysteresis: 2,
      }));
    } else if (norm === 'p mode') {
      setIsAuto(true);
      pendingWritesRef.current['autoMan'] = {
        value: 'Auto',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 0, ctrlState.deviceId);

      // Default SP: 50, Bias: 73.0, PB: 100, IT: 0, DT: 0
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('sp', 50.0, ctrlState.deviceId);

      pendingWritesRef.current['bias'] = { value: 73.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('bias', 73.0, ctrlState.deviceId);

      pendingWritesRef.current['pb'] = { value: 100, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('pb', 100, ctrlState.deviceId);

      pendingWritesRef.current['it'] = { value: 0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('it', 0, ctrlState.deviceId);

      pendingWritesRef.current['dt'] = { value: 0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('dt', 0, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 73.0,
        pb: 100,
        it: 0,
        dt: 0,
      }));
    } else if (norm === 'pi mode') {
      setIsAuto(true);
      pendingWritesRef.current['autoMan'] = {
        value: 'Auto',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 0, ctrlState.deviceId);

      // Default SP: 50, Bias: 73.0, PB: 20, IT: 30, DT: 0
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('sp', 50.0, ctrlState.deviceId);

      pendingWritesRef.current['bias'] = { value: 73.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('bias', 73.0, ctrlState.deviceId);

      pendingWritesRef.current['pb'] = { value: 20, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('pb', 20, ctrlState.deviceId);

      pendingWritesRef.current['it'] = { value: 30, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('it', 30, ctrlState.deviceId);

      pendingWritesRef.current['dt'] = { value: 0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('dt', 0, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 73.0,
        pb: 20,
        it: 30,
        dt: 0,
      }));
    } else if (norm === 'pd mode') {
      setIsAuto(true);
      pendingWritesRef.current['autoMan'] = {
        value: 'Auto',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 0, ctrlState.deviceId);

      // Default SP: 50, Bias: 73.0, PB: 20, IT: 0, DT: 1
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('sp', 50.0, ctrlState.deviceId);

      pendingWritesRef.current['bias'] = { value: 73.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('bias', 73.0, ctrlState.deviceId);

      pendingWritesRef.current['pb'] = { value: 20, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('pb', 20, ctrlState.deviceId);

      pendingWritesRef.current['it'] = { value: 0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('it', 0, ctrlState.deviceId);

      pendingWritesRef.current['dt'] = { value: 1, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('dt', 1, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 73.0,
        pb: 20,
        it: 0,
        dt: 1,
      }));
    } else if (norm === 'pid mode') {
      setIsAuto(true);
      pendingWritesRef.current['autoMan'] = {
        value: 'Auto',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 0, ctrlState.deviceId);

      // Default SP: 50, Bias: 73.0, PB: 20, IT: 30, DT: 1
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('sp', 50.0, ctrlState.deviceId);

      pendingWritesRef.current['bias'] = { value: 73.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('bias', 73.0, ctrlState.deviceId);

      pendingWritesRef.current['pb'] = { value: 20, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('pb', 20, ctrlState.deviceId);

      pendingWritesRef.current['it'] = { value: 30, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('it', 30, ctrlState.deviceId);

      pendingWritesRef.current['dt'] = { value: 1, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('dt', 1, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 73.0,
        pb: 20,
        it: 30,
        dt: 1,
      }));
    } else if (norm === 'closed loop') {
      setIsAuto(true);
      pendingWritesRef.current['autoMan'] = {
        value: 'Auto',
        expiresAt: Date.now() + 6000,
      };
      await modbusService.writeRegister('autoMan', 0, ctrlState.deviceId);

      // Default SP: 50, Bias: 0.0, PB: 100, IT: 0, DT: 0
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('sp', 50.0, ctrlState.deviceId);

      pendingWritesRef.current['bias'] = { value: 0.0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('bias', 0.0, ctrlState.deviceId);

      pendingWritesRef.current['pb'] = { value: 100, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('pb', 100, ctrlState.deviceId);

      pendingWritesRef.current['it'] = { value: 0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('it', 0, ctrlState.deviceId);

      pendingWritesRef.current['dt'] = { value: 0, expiresAt: Date.now() + 6000 };
      await modbusService.writeRegister('dt', 0, ctrlState.deviceId);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 0.0,
        pb: 100,
        it: 0,
        dt: 0,
      }));
    } else {
      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
      }));
    }
  };

  const handleRun = useCallback(() => {
    setIsRunning(true);
    DeltaDTBService.getInstance().startPolling();
  }, []);

  const handleStopClick = () => {
    setIsStopModalOpen(true);
  };

  const handleConfirmStop = useCallback(() => {
    // 1. Immediately halt Modbus hardware polling
    DeltaDTBService.getInstance().stopPolling();
    // 2. Halt running state
    setIsRunning(false);
    // 3. Reset Waveform Graph and Log table
    setTrendData([]);
    setLogEntries([]);
    simTimeRef.current = 0;
    // 4. Reset Process Variable to 0.0 and clear selected experiment
    setCtrlState((prev) => ({
      ...prev,
      selectedExperiment: '',
      pv: 0.0,
    }));
    // 5. Shift back to Auto mode and sync register 4101
    setIsAuto(true);
    pendingWritesRef.current['autoMan'] = {
      value: 'Auto',
      expiresAt: Date.now() + 6000,
    };
    DeltaDTBService.getInstance().writeRegister('autoMan', 0, ctrlState.deviceId);

    setIsStopModalOpen(false);
  }, [ctrlState.deviceId]);

  const handleCancelStop = () => {
    setIsStopModalOpen(false);
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
    const canvas = document.getElementById('ace101-trend-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('Waveform canvas is not ready to export.');
      return;
    }

    try {
      const dpr = window.devicePixelRatio || 1;
      const headerH = Math.round(56 * dpr);
      const footerH = Math.round(44 * dpr);

      // Create high-res composite export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height + headerH + footerH;

      const expCtx = exportCanvas.getContext('2d');
      if (!expCtx) return;

      // Fill white background
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Top colored bar
      expCtx.fillStyle = '#0047ba';
      expCtx.fillRect(0, 0, exportCanvas.width, Math.round(4 * dpr));

      // Header Text: Title and Subtitle
      expCtx.fillStyle = '#0f172a';
      expCtx.font = `bold ${Math.round(15 * dpr)}px "Segoe UI", Arial, sans-serif`;
      expCtx.textAlign = 'left';
      expCtx.textBaseline = 'middle';
      expCtx.fillText(
        'DELTA DTB9696 Level Process Trainer (ACE 101) — Trend Waveform',
        Math.round(20 * dpr),
        Math.round(22 * dpr)
      );

      expCtx.fillStyle = '#64748b';
      expCtx.font = `${Math.round(12 * dpr)}px "Segoe UI", Arial, sans-serif`;
      const expName = ctrlState.selectedExperiment || 'Level Control Simulation';
      const timeStr = new Date().toLocaleString();
      expCtx.fillText(
        `Experiment: ${expName}    |    Exported: ${timeStr}`,
        Math.round(20 * dpr),
        Math.round(42 * dpr)
      );

      // Draw Main Plot Canvas
      expCtx.drawImage(canvas, 0, headerH);

      // Footer Legend
      const footerY = headerH + canvas.height + Math.round(22 * dpr);
      expCtx.font = `bold ${Math.round(12 * dpr)}px "Segoe UI", Arial, sans-serif`;
      expCtx.textAlign = 'center';
      expCtx.textBaseline = 'middle';

      const cx = exportCanvas.width / 2;
      const spacing = Math.round(170 * dpr);

      // SP % (Blue)
      expCtx.fillStyle = '#0047ba';
      expCtx.fillText('━ SP (Set Point %)', cx - spacing, footerY);

      // PV % (Green)
      expCtx.fillStyle = '#16a34a';
      expCtx.fillText('━ PV (Process Variable %)', cx, footerY);

      // OP % (Red)
      expCtx.fillStyle = '#dc2626';
      expCtx.fillText('━ OP (Controller Output %)', cx + spacing, footerY);

      const filename = `ACE101_TrendGraph_${Date.now()}.png`;

      // Export using blob or dataUrl
      if (exportCanvas.toBlob) {
        exportCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          } else {
            const dataUrl = exportCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }, 'image/png');
      } else {
        const dataUrl = exportCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting graph:', err);
      // Fallback direct canvas export
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ACE101_TrendGraph_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [ctrlState.selectedExperiment]);

  const handleUserGuide = useCallback(() => {
    setIsUserGuideOpen(true);
  }, []);

  return (
    <div className="trainer-ace101-page">
      {/* ── Top-Level Menu Bar (Communication | Remote Lab | Experiment) ── */}
      <nav className="trainer-menubar" onClick={(e) => e.stopPropagation()}>
        {/* Communication Menu: Enabled before connect; disabled once connected per SOP */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className={`trainer-menu-trigger ${openTopMenu === 'com' ? 'active' : ''} ${isConnected ? 'disabled' : ''}`}
            disabled={isConnected}
            onClick={async () => {
              if (isConnected) return;
              setOpenTopMenu('com');
              if (availablePorts.length === 0 && !isScanningPorts) {
                setIsScanningPorts(true);
                try {
                  const ports = await fetchAvailablePorts();
                  setAvailablePorts(ports);
                } finally {
                  setIsScanningPorts(false);
                }
              }
            }}
            title={isConnected ? `Connected to ${comPort || 'Port'} (Disabled while connected)` : 'Select Communication Port and connect'}
          >
            Communication {isConnected && comPort ? `(${comPort})` : ''}
          </button>
          {!isConnected && openTopMenu === 'com' && (
            <div className="trainer-menu-dropdown">
              {isScanningPorts ? (
                <div className="dropdown-no-device">Scanning ports...</div>
              ) : availablePorts.length > 0 ? (
                availablePorts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="dropdown-action-btn"
                    onClick={async () => {
                      setOpenTopMenu(null);
                      const modbusService = DeltaDTBService.getInstance();
                      const res = await modbusService.connect(p, ctrlState.deviceId, ctrlState.action);
                      if (res.success) {
                        handlePortConnected(p, false);
                      } else {
                        // Action handshake failed: recheck port availability and inform user
                        const freshPorts = await fetchAvailablePorts();
                        setAvailablePorts(freshPorts);
                        alert(
                          `Connection Failed on ${p}:\n\n` +
                          `${res.message || 'Delta DTB9696 controller did not respond to Action register (4102) handshake.'}\n\n` +
                          `• Ensure the controller is powered ON.\n` +
                          `• Verify RS-485 (+/-) wiring.\n` +
                          `• Check controller Device ID (currently ${ctrlState.deviceId}).\n\n` +
                          `Available ports have been refreshed.`
                        );
                      }
                    }}
                  >
                    {p}
                  </button>
                ))
              ) : (
                <div className="dropdown-no-device">No Communication Port Found</div>
              )}
            </div>
          )}
        </div>

        {/* Remote Lab Tab: Dedicated gateway for Local Network, Firebase, Internet Tunnel, MQTT */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className="trainer-menu-trigger"
            onClick={() => {
              setOpenTopMenu(null);
              setIsComModalOpen(true);
            }}
            title="Remote Lab Setup & Cloud Gateway"
          >
            Remote Lab
          </button>
        </div>

        {/* Experiment Menu: Enabled only after COM Port connection and when not running */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className={`trainer-menu-trigger ${openTopMenu === 'exp' ? 'active' : ''} ${!isConnected || isRunning ? 'disabled' : ''}`}
            disabled={!isConnected || isRunning}
            onClick={() => isConnected && !isRunning && setOpenTopMenu('exp')}
            title={
              !isConnected
                ? 'Connect to COM Port first to enable Experiment menu'
                : isRunning
                ? 'Stop experiment to change experiment'
                : 'Select Experiment'
            }
          >
            Experiment
          </button>
          {openTopMenu === 'exp' && isConnected && !isRunning && (
            <div className="trainer-menu-dropdown">
              {[
                { name: 'Open Loop', enabled: true },
                { name: 'On / Off Control', enabled: true },
                { name: 'P Mode', enabled: true },
                { name: 'PI Mode', enabled: true },
                { name: 'PD Mode', enabled: true },
                { name: 'PID Mode', enabled: true },
                { name: 'Closed Loop', enabled: true },
                { name: 'Auto Tuning', enabled: false, note: 'Will be informed later' },
                { name: 'Stability Analysis', enabled: false, note: 'Will be informed later' },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={`dropdown-action-btn ${!item.enabled ? 'disabled' : ''}`}
                  disabled={!item.enabled}
                  title={item.note || item.name}
                  onClick={() => {
                    if (item.enabled) {
                      handleSelectExperiment(item.name);
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {ctrlState.selectedExperiment === item.name && <span className="check-mark">✓</span>}
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
        isConnected={isConnected}
        isExperimentSelected={Boolean(ctrlState.selectedExperiment)}
        onRun={handleRun}
        onStop={handleStopClick}
        onToggleAuto={async () => {
          const nextAuto = !isAuto;
          setIsAuto(nextAuto);
          const modbusService = DeltaDTBService.getInstance();
          pendingWritesRef.current['autoMan'] = {
            value: nextAuto ? 'Auto' : 'Manual',
            expiresAt: Date.now() + 6000,
          };
          if (!nextAuto) {
            // Clicked from Auto -> text becomes Manual, Controller Output enabled
            // 1. Write value 2 to A/M register (4101 / 0x1005)
            await modbusService.writeRegister('autoMan', 2, ctrlState.deviceId);
            // 2. Write Controller Output value to OP register (4114 / 0x1012)
            pendingWritesRef.current['op'] = {
              value: ctrlState.op,
              expiresAt: Date.now() + 6000,
            };
            await modbusService.writeRegister('op', ctrlState.op, ctrlState.deviceId);
          } else {
            // Clicked from Manual -> text becomes Auto, Controller Output becomes read-only
            // Write value 0 to A/M register (4101 / 0x1005)
            await modbusService.writeRegister('autoMan', 0, ctrlState.deviceId);
          }
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
          />
        </div>

        {/* Right Column: Controller Parameters & Real-Time Graph */}
        <div className="layout-right-column">
          {/* Upper: Controller Parameters & Sliders */}
          <div className="right-upper-panel">
            <ControllerParametersPanel
              state={ctrlState}
              isRunning={isRunning}
              isConnected={isConnected}
              isAuto={isAuto}
              comPort={comPort}
              logEntries={logEntries}
              onOpenComModal={() => setIsComModalOpen(true)}
              onStateChange={setCtrlState}
              onParamWrite={handleParamWrite}
              onSaveSettings={handleSaveSettings}
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

      {/* ── Connection Established Notice Modal ───────────────── */}
      <ConnectionNoticeModal
        isOpen={isConnNoticeOpen}
        portName={comPort}
        onClose={() => setIsConnNoticeOpen(false)}
      />

      {/* ── Experiment Selected Notice Modal ───────────────────── */}
      <ExperimentNoticeModal
        isOpen={selectedExpNotice !== null}
        experimentName={selectedExpNotice || ''}
        onClose={() => setSelectedExpNotice(null)}
      />

      {/* ── Stop Experiment Confirmation Modal ─────────────────── */}
      <StopConfirmModal
        isOpen={isStopModalOpen}
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />

      {/* ── User Guide & Technical Manual Modal ──────────────────── */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
};
