import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrainerHeader106 } from './TrainerHeader106';
import { TrainerToolbar } from '../TrainerACE101/TrainerToolbar';
import { ProcessSchematic106 } from './ProcessSchematic106';
import {
  type CalibrationConfig,
  DEFAULT_CALIBRATION_CONFIG,
  rawAdcToCalibrated,
  getChannelForPv,
} from '../../services/tcp/calibrationUtils';
import { ControllerParametersPanel106 } from './ControllerParametersPanel106';
import type { ControllerState, LogEntry } from './ControllerParametersPanel106';
import { TrendGraph } from '../TrainerACE101/TrendGraph';
import type { TrendDataPoint } from '../TrainerACE101/TrendGraph';
import { TcpConnectModal } from './TcpConnectModal';
import { RemoteLabModal106 } from './RemoteLabModal106';
import { StopConfirmModal } from '../TrainerACE101/StopConfirmModal';
import { ExperimentNoticeModal } from '../TrainerACE101/ExperimentNoticeModal';
import { ConnectionNoticeModal } from '../TrainerACE101/ConnectionNoticeModal';
import { UserGuideModal } from '../TrainerACE101/UserGuideModal';
import { MLControlModal } from '../TrainerACE101/MLControlModal';
import { Ace2007TcpService, type TcpLiveState } from '../../services/tcp/ace2007TcpService';
import {
  mpcOptimize,
  neuralPIDStep,
  inverseDynamicsStep,
  rlActorStep,
  lstmPredictiveStep,
  ML_LOGIC_OPTIONS,
} from '../../services/ml/mlControlAlgorithms';
import type { NNWeights, MLLogicType } from '../../services/ml/mlControlAlgorithms';
import '../TrainerACE101/TrainerACE101.css';

interface TrainerACE106LevelProps {
  onHome: () => void;
}

export const TrainerACE106Level: React.FC<TrainerACE106LevelProps> = ({ onHome }) => {
  // Connection and Port State
  const [tcpHost, setTcpHost] = useState<string>('192.168.0.1:8080');
  const comPort = tcpHost;
  const [moduleName, setModuleName] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTcpModalOpen, setIsTcpModalOpen] = useState<boolean>(false);
  const [isRemoteLabModalOpen, setIsRemoteLabModalOpen] = useState<boolean>(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false);
  const [isConnNoticeOpen, setIsConnNoticeOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [isMLModalOpen, setIsMLModalOpen] = useState<boolean>(false);
  const [selectedExpNotice, setSelectedExpNotice] = useState<string | null>(null);

  // Top Menu States in this Trainer Screen (Experiment)
  const [openTopMenu, setOpenTopMenu] = useState<'exp' | null>(null);

  // Auto-connect and Alert Popup states
  interface DaqPopupState {
    type: 'connected' | 'not-detected';
    title: string;
    message: string;
  }
  const [daqPopup, setDaqPopup] = useState<DaqPopupState | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState<boolean>(false);

  const attemptAutoConnect = useCallback(async () => {
    setIsAutoConnecting(true);
    setDaqPopup(null);

    let detectedSsid = '';
    try {
      const sRes = await fetch('/api/tcp/wifi-ssid');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.success && sData.moduleName) {
          detectedSsid = sData.moduleName;
        } else if (sData.ssid && /^ACE/i.test(sData.ssid)) {
          detectedSsid = sData.ssid;
        }
      }
    } catch {}

    const host = localStorage.getItem('ace2007_tcp_host') || '192.168.0.1';
    const port = Number(localStorage.getItem('ace2007_tcp_port')) || 8080;
    const tcp = Ace2007TcpService.getInstance();

    const res = await tcp.connect(host, port);
    setIsAutoConnecting(false);

    if (res.success) {
      setIsConnected(true);
      const rawName = detectedSsid || (tcp.getCurrentHost() === '192.168.0.1' ? 'ACE2007-2' : tcp.getCurrentHost());
      setModuleName(rawName);
      setTcpHost(`${host}:${port}`);
      localStorage.setItem('ace2007_module_name', rawName);

      let formattedName = rawName;
      if (/^ACE\s*2007[-_\s]*(\d+)/i.test(rawName)) {
        const match = rawName.match(/^ACE\s*2007[-_\s]*(\d+)/i);
        if (match) formattedName = `ACE 2007 - ${match[1]}`;
      } else if (!formattedName.toLowerCase().startsWith('ace')) {
        formattedName = `ACE 2007 - ${formattedName}`;
      }

      setDaqPopup({
        type: 'connected',
        title: 'Hardware Connection Status',
        message: `The ${formattedName} DAQ is auto connected. Select Experiment from Experiment Menu or Proceed with Remote Lab Setting`,
      });
    } else {
      setIsConnected(false);
      setModuleName('');
      setDaqPopup({
        type: 'not-detected',
        title: 'Hardware Connection Alert',
        message: 'No ACE DAQ is detected. Please check the connection and Retry',
      });
    }
  }, []);

  useEffect(() => {
    attemptAutoConnect();
  }, [attemptAutoConnect]);

  // Listen for Remote Lab session revocation
  useEffect(() => {
    const tcpService = Ace2007TcpService.getInstance();
    tcpService.setOnRevoked(() => {
      alert('⚠️ Your remote lab session has been revoked or ended by the Host teacher.');
      setIsConnected(false);
      setTcpHost('');
    });
  }, []);

  const handleRemoteConnected = (portStr: string) => {
    setTcpHost(portStr);
    setIsConnected(true);
    setIsConnNoticeOpen(true);
  };

  const fetchSsid = useCallback(async () => {
    try {
      const res = await fetch('/api/tcp/wifi-ssid');
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.moduleName) {
          setModuleName(d.moduleName);
          localStorage.setItem('ace2007_module_name', d.moduleName);
        } else if (d.ssid && /^ACE/i.test(d.ssid)) {
          setModuleName(d.ssid);
          localStorage.setItem('ace2007_module_name', d.ssid);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSsid();
    const interval = setInterval(fetchSsid, 3000);
    return () => clearInterval(interval);
  }, [fetchSsid]);

  useEffect(() => {
    const tcp = Ace2007TcpService.getInstance();
    setIsConnected(tcp.getConnected());
    setTcpHost(`${tcp.getCurrentHost()}:${tcp.getCurrentPort()}`);

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
          if (s.calibration_ace106 && typeof s.calibration_ace106 === 'object') {
            setCalibrationConfig((prev) => ({
              ...prev,
              ...s.calibration_ace106,
            }));
          }
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
      bias: 40.0,
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

  // Calibration Config & Real-time DAQ Raw ADC Inputs
  const [calibrationConfig, setCalibrationConfig] = useState<CalibrationConfig>(() => {
    try {
      const stored = localStorage.getItem('ace_prosoft_calibration_ace106');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.transmitters && parsed.calibrations) {
          return {
            ...DEFAULT_CALIBRATION_CONFIG,
            ...parsed,
          };
        }
      }
    } catch {}
    return DEFAULT_CALIBRATION_CONFIG;
  });

  const calibrationConfigRef = useRef<CalibrationConfig>(calibrationConfig);
  useEffect(() => {
    calibrationConfigRef.current = calibrationConfig;
  }, [calibrationConfig]);

  const [rawInputs, setRawInputs] = useState<{
    ip0?: number;
    ip1?: number;
    ip2?: number;
    ip3?: number;
  }>({});

  const handleCalibrationSave = async (cfg: CalibrationConfig) => {
    setCalibrationConfig(cfg);
    try {
      localStorage.setItem('ace_prosoft_calibration_ace106', JSON.stringify(cfg));
    } catch (e) {
      console.warn('localStorage calibration save warning:', e);
    }

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calibration_ace106: cfg }),
      });
    } catch (e) {
      console.warn('Backend settings calibration save warning:', e);
    }
  };

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

  // Active ML Controller State for Real-Time Validation on Main Screen
  interface ActiveMLModel {
    weights: NNWeights;
    logic: MLLogicType;
    setpoint: number;
    horizon: number;
  }
  const [activeMLModel, setActiveMLModel] = useState<ActiveMLModel | null>(null);
  const activeMLModelRef = useRef<ActiveMLModel | null>(null);
  activeMLModelRef.current = activeMLModel;

  const mlPrevPVRef = useRef<number>(0);
  const mlIntegralErrRef = useRef<number>(0);
  const mlHistoryRef = useRef<{ pv: number; op: number }[]>([]);
  const hwIntegralErrRef = useRef<number>(0);
  const hwPrevErrRef = useRef<number>(0);

  // Pending writes tracking to prevent poll jitter / old value flickering
  const pendingWritesRef = useRef<{ [param: string]: { value: number | string; expiresAt: number } }>({});

  const normExp = (ctrlState.selectedExperiment || '').trim().toLowerCase();
  const isManualExp = normExp === 'open loop' || normExp === 'on / off control' || normExp === 'on/off control';

  // Handle Live Modbus Polling (1 second sampling time from hardware)
  useEffect(() => {
    const tcpService = Ace2007TcpService.getInstance();
    const unsub = tcpService.onLivePoll((live: TcpLiveState) => {
      setIsConnected(live.connected);
      if (live.moduleName) {
        setModuleName(live.moduleName);
      }
      if (live.raw) {
        setRawInputs({
          ip0: live.raw.raw0,
          ip1: live.raw.raw1,
          ip2: live.raw.raw2,
          ip3: live.raw.raw3,
        });
      }
      // Live updates are only accepted while experiment is running!
      if (!isRunningRef.current) return;

      // Calibration & Channel Mapping:
      // Front end reads PV0. PV0 maps to an IP channel (default IP0 or configured in calibration tab).
      const calCfg = calibrationConfigRef.current;
      const mappedChannel = getChannelForPv(calCfg, 'PV0');
      let rawAdc: number | undefined;
      if (live.raw) {
        const rawMap: Record<'ip0' | 'ip1' | 'ip2' | 'ip3', number | undefined> = {
          ip0: live.raw.raw0,
          ip1: live.raw.raw1,
          ip2: live.raw.raw2,
          ip3: live.raw.raw3,
        };
        rawAdc = rawMap[mappedChannel];
      }

      const pvLevel = rawAdc !== undefined
        ? rawAdcToCalibrated(rawAdc, calCfg.transmitters[mappedChannel], calCfg.calibrations[mappedChannel])
        : (typeof live[mappedChannel] === 'number' ? live[mappedChannel] : (typeof live.ip2 === 'number' ? live.ip2 : live.pv));

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

      const pollNormExp = (stateRef.current.selectedExperiment || '').trim().toLowerCase();
      const pollIsManual = pollNormExp === 'open loop' || pollNormExp === 'on / off control' || pollNormExp === 'on/off control';

      // In Hardware mode while running:
      if (pollNormExp === 'on / off control' || pollNormExp === 'on/off control') {
        const pv1 = pvLevel;
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
          tcpService.writeRegister('op', out2);
        }
      } else if (pollNormExp === 'p mode') {
        const pv1 = pvLevel;
        const sp1 = effSp;
        const pb = Math.max(stateRef.current.pb, 0.001);
        const kp = 100 / pb;
        const err = stateRef.current.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        let out2 = isAutoRef.current ? (kp * err + stateRef.current.bias) : stateRef.current.op;
        out2 = Math.max(0, Math.min(100, out2));
        effOp = out2;
        if (Math.abs(out2 - lastOpRef.current) > 0.2) {
          lastOpRef.current = out2;
          pendingWritesRef.current['op'] = {
            value: out2,
            expiresAt: Date.now() + 3000,
          };
          tcpService.writeRegister('op', out2);
        }
      } else if (pollNormExp === 'closed loop') {
        const pv1 = pvLevel;
        const sp1 = effSp;
        const pb = Math.max(stateRef.current.pb, 0.001);
        const kp = 100 / pb;
        const err = stateRef.current.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        let out2 = isAutoRef.current ? (kp * err) : stateRef.current.op;
        out2 = Math.max(0, Math.min(100, out2));
        effOp = out2;
        if (Math.abs(out2 - lastOpRef.current) > 0.2) {
          lastOpRef.current = out2;
          pendingWritesRef.current['op'] = {
            value: out2,
            expiresAt: Date.now() + 3000,
          };
          tcpService.writeRegister('op', out2);
        }
      } else if (pollNormExp === 'pi mode') {
        const pv1 = pvLevel;
        const sp1 = effSp;
        const pb = Math.max(stateRef.current.pb, 0.001);
        const kp = 100 / pb;
        const ti = Math.max(stateRef.current.it, 1);
        const err = stateRef.current.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        if (isAutoRef.current) {
          hwIntegralErrRef.current += err * 1.0;
          hwIntegralErrRef.current = Math.max(-50, Math.min(50, hwIntegralErrRef.current));
          let out2 = stateRef.current.bias + kp * (err + (1 / ti) * hwIntegralErrRef.current);
          out2 = Math.max(0, Math.min(100, out2));
          effOp = out2;
          if (Math.abs(out2 - lastOpRef.current) > 0.2) {
            lastOpRef.current = out2;
            pendingWritesRef.current['op'] = {
              value: out2,
              expiresAt: Date.now() + 3000,
            };
            tcpService.writeRegister('op', out2);
          }
        } else {
          effOp = stateRef.current.op;
          if (Math.abs(effOp - lastOpRef.current) > 0.2) {
            lastOpRef.current = effOp;
            pendingWritesRef.current['op'] = {
              value: effOp,
              expiresAt: Date.now() + 3000,
            };
            tcpService.writeRegister('op', effOp);
          }
        }
      } else if (pollNormExp === 'pd mode') {
        const pv1 = pvLevel;
        const sp1 = effSp;
        const pb = Math.max(stateRef.current.pb, 0.001);
        const kp = 100 / pb;
        const td = stateRef.current.dt;
        const err = stateRef.current.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        if (isAutoRef.current) {
          const derivative = (err - hwPrevErrRef.current) / 1.0;
          hwPrevErrRef.current = err;
          let out2 = stateRef.current.bias + kp * (err + td * derivative);
          out2 = Math.max(0, Math.min(100, out2));
          effOp = out2;
          if (Math.abs(out2 - lastOpRef.current) > 0.2) {
            lastOpRef.current = out2;
            pendingWritesRef.current['op'] = {
              value: out2,
              expiresAt: Date.now() + 3000,
            };
            tcpService.writeRegister('op', out2);
          }
        } else {
          effOp = stateRef.current.op;
          if (Math.abs(effOp - lastOpRef.current) > 0.2) {
            lastOpRef.current = effOp;
            pendingWritesRef.current['op'] = {
              value: effOp,
              expiresAt: Date.now() + 3000,
            };
            tcpService.writeRegister('op', effOp);
          }
        }
      } else if (pollNormExp === 'pid mode') {
        const pv1 = pvLevel;
        const sp1 = effSp;
        const pb = Math.max(stateRef.current.pb, 0.001);
        const kp = 100 / pb;
        const ti = Math.max(stateRef.current.it, 1);
        const td = stateRef.current.dt;
        const err = stateRef.current.action === 'Direct' ? (pv1 - sp1) : (sp1 - pv1);
        if (isAutoRef.current) {
          hwIntegralErrRef.current += err * 1.0;
          hwIntegralErrRef.current = Math.max(-50, Math.min(50, hwIntegralErrRef.current));
          const derivative = (err - hwPrevErrRef.current) / 1.0;
          hwPrevErrRef.current = err;
          let out2 = stateRef.current.bias + kp * (err + (1 / ti) * hwIntegralErrRef.current + td * derivative);
          out2 = Math.max(0, Math.min(100, out2));
          effOp = out2;
          if (Math.abs(out2 - lastOpRef.current) > 0.2) {
            lastOpRef.current = out2;
            pendingWritesRef.current['op'] = {
              value: out2,
              expiresAt: Date.now() + 3000,
            };
            tcpService.writeRegister('op', out2);
          }
        } else {
          effOp = stateRef.current.op;
          if (Math.abs(effOp - lastOpRef.current) > 0.2) {
            lastOpRef.current = effOp;
            pendingWritesRef.current['op'] = {
              value: effOp,
              expiresAt: Date.now() + 3000,
            };
            tcpService.writeRegister('op', effOp);
          }
        }
      } else if (pollNormExp === 'open loop' || !isAutoRef.current) {
        // Manual mode: output OP from user slider
        effOp = stateRef.current.op;
        if (Math.abs(effOp - lastOpRef.current) > 0.2) {
          lastOpRef.current = effOp;
          pendingWritesRef.current['op'] = {
            value: effOp,
            expiresAt: Date.now() + 3000,
          };
          tcpService.writeRegister('op', effOp);
        }
      } else if (
        (pollNormExp === 'machine learning control' || pollNormExp === 'ml control') &&
        activeMLModelRef.current &&
        isRunningRef.current
      ) {
        // Real-Time Machine Learning Control Running on Main Screen
        const ml = activeMLModelRef.current;
        const pv1 = pvLevel;
        const sp1 = effSp;
        const u1 = lastOpRef.current;
        let nextU = u1;

        if (ml.logic === 'mpc') {
          nextU = mpcOptimize(ml.weights, pv1, u1, sp1, ml.horizon);
        } else if (ml.logic === 'pid_autotuning') {
          const res = neuralPIDStep(
            ml.weights,
            pv1,
            sp1,
            mlPrevPVRef.current,
            mlIntegralErrRef.current
          );
          nextU = res.op;
          mlIntegralErrRef.current = res.newIntegral;
        } else if (ml.logic === 'inverse_dynamics') {
          nextU = inverseDynamicsStep(ml.weights, pv1, sp1, u1);
        } else if (ml.logic === 'rl_ddpg') {
          nextU = rlActorStep(ml.weights, pv1, sp1, u1);
        } else if (ml.logic === 'lstm_predictive') {
          const pvHist = mlHistoryRef.current.map((d) => d.pv);
          const opHist = mlHistoryRef.current.map((d) => d.op);
          nextU = lstmPredictiveStep(ml.weights, pvHist, opHist, sp1, u1);
        }

        mlPrevPVRef.current = pv1;
        nextU = Math.max(0, Math.min(100, nextU));
        effOp = nextU;

        if (Math.abs(nextU - lastOpRef.current) > 0.5) {
          lastOpRef.current = nextU;
          pendingWritesRef.current['op'] = {
            value: nextU,
            expiresAt: Date.now() + 3000,
          };
          tcpService.writeRegister('op', nextU);
        }
      }

      // Synchronize controller state from hardware with anti-reversion protection
      setCtrlState((prev) => ({
        ...prev,
        pv: pvLevel,     // Channel 3 (IP2) Level PV
        sp: effSp,
        op: effOp,
        pb: effPb,
        it: effIt,
        dt: effDt,
        bias: effBias,
        action: effAction,
      }));

      const effAutoMan = getEffective('autoMan', live.autoMan);
      if (effAutoMan && !pollIsManual) {
        setIsAuto(effAutoMan === 'Auto');
      }

      // Record Graph and Log Table entries every 1 second
      if (isRunningRef.current && !isHoldRef.current) {
        simTimeRef.current += 1;
        const curTime = simTimeRef.current;
        const newPoint = {
          time: curTime,
          sp: effSp,
          pv: pvLevel,
          op: effOp,
        };
        setTrendData((prev) => {
          if (prev.length === 0) {
            return [
              { time: 0, sp: effSp, pv: pvLevel, op: effOp },
              newPoint,
            ];
          }
          return [...prev.slice(-9999), newPoint];
        });
        mlHistoryRef.current.push({ pv: pvLevel, op: effOp });
        if (mlHistoryRef.current.length > 300) mlHistoryRef.current.shift();

        if (isLoggingRef.current) {
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          setLogEntries((prev) => [
            ...prev.slice(-9999),
            {
              timeStr,
              timeSec: curTime,
              sp: effSp,
              pv: pvLevel,
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
    const tcpService = Ace2007TcpService.getInstance();
    if (tcpService.isHardware()) return; // Hardware poll handles updates

    let integralError = 0;
    let prevError = 0;

    const interval = setInterval(() => {
      if (!isRunningRef.current) return;

      const s = stateRef.current;
      const normExp = (s.selectedExperiment || '').trim().toLowerCase();
      let calcOp = s.op;

      if (normExp === 'open loop') {
        calcOp = s.op;
      } else if (!isAutoRef.current) {
        // In Manual mode across P, PI, PD, PID, Closed loop: use user-commanded Controller Output (%)
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
        setTrendData((prev) => {
          if (prev.length === 0) {
            return [
              { time: 0, sp: s.sp, pv: s.pv, op: s.op },
              newPoint,
            ];
          }
          return [...prev.slice(-9999), newPoint];
        });

        if (isLoggingRef.current) {
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          setLogEntries((prev) => [
            ...prev.slice(-9999),
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
      const tcpService = Ace2007TcpService.getInstance();
      tcpService.writeRegister(param, value);
    },
    [ctrlState.deviceId]
  );

  const handleTcpConnected = (hostStr: string) => {
    Ace2007TcpService.getInstance().stopPolling(); // Idle until Run
    setTcpHost(hostStr);
    setIsConnected(true);
    setCtrlState((prev) => ({
      ...prev,
      sp: 50.0,
      pv: 0.0,
      op: 0.0,
      bias: 40.0,
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

  // Close menus on outside click
  useEffect(() => {
    const handleDocClick = () => setOpenTopMenu(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const handleSelectExperiment = async (expName: string) => {
    setOpenTopMenu(null);
    const tcpService = Ace2007TcpService.getInstance();
    const norm = expName.trim().toLowerCase();

    // Do NOT show popup notification on menu click for Machine Learning Control;
    // it will be shown when "Start Realtime Model Validation on Main Screen" is clicked in Step 3.
    if (norm !== 'machine learning control' && norm !== 'ml control' && norm !== 'ml control (mpc)') {
      setSelectedExpNotice(expName);
    }

    if (norm === 'open loop') {
      setIsAuto(false); // Requirement 1: Open loop automatically goes to Manual
      pendingWritesRef.current['autoMan'] = {
        value: 'Manual',
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('autoMan', 2);

      pendingWritesRef.current['op'] = {
        value: ctrlState.op,
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('op', ctrlState.op);

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
      await tcpService.writeRegister('autoMan', 2);

      // Default SP: 50, Hys: 2
      pendingWritesRef.current['sp'] = {
        value: 50.0,
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('sp', 50.0);

      pendingWritesRef.current['op'] = {
        value: ctrlState.op,
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('op', ctrlState.op);

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
      await tcpService.writeRegister('autoMan', 0);

      // Default SP: 50, Bias: 40.0, PB: 100, IT: 0, DT: 0
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('sp', 50.0);

      pendingWritesRef.current['bias'] = { value: 40.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('bias', 40.0);

      pendingWritesRef.current['pb'] = { value: 100, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('pb', 100);

      pendingWritesRef.current['it'] = { value: 0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('it', 0);

      pendingWritesRef.current['dt'] = { value: 0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('dt', 0);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 40.0,
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
      await tcpService.writeRegister('autoMan', 0);

      // Default SP: 50, Bias: 40.0, PB: 20, IT: 30, DT: 0
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('sp', 50.0);

      pendingWritesRef.current['bias'] = { value: 40.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('bias', 40.0);

      pendingWritesRef.current['pb'] = { value: 20, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('pb', 20);

      pendingWritesRef.current['it'] = { value: 30, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('it', 30);

      pendingWritesRef.current['dt'] = { value: 0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('dt', 0);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 40.0,
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
      await tcpService.writeRegister('autoMan', 0);

      // Default SP: 50, Bias: 40.0, PB: 20, IT: 0, DT: 1
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('sp', 50.0);

      pendingWritesRef.current['bias'] = { value: 40.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('bias', 40.0);

      pendingWritesRef.current['pb'] = { value: 20, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('pb', 20);

      pendingWritesRef.current['it'] = { value: 0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('it', 0);

      pendingWritesRef.current['dt'] = { value: 1, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('dt', 1);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 40.0,
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
      await tcpService.writeRegister('autoMan', 0);

      // Default SP: 50, Bias: 40.0, PB: 20, IT: 30, DT: 1
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('sp', 50.0);

      pendingWritesRef.current['bias'] = { value: 40.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('bias', 40.0);

      pendingWritesRef.current['pb'] = { value: 20, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('pb', 20);

      pendingWritesRef.current['it'] = { value: 30, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('it', 30);

      pendingWritesRef.current['dt'] = { value: 1, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('dt', 1);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 40.0,
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
      await tcpService.writeRegister('autoMan', 0);

      // Default SP: 50, Bias: 0.0, PB: 100, IT: 0, DT: 0
      pendingWritesRef.current['sp'] = { value: 50.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('sp', 50.0);

      pendingWritesRef.current['bias'] = { value: 0.0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('bias', 0.0);

      pendingWritesRef.current['pb'] = { value: 100, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('pb', 100);

      pendingWritesRef.current['it'] = { value: 0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('it', 0);

      pendingWritesRef.current['dt'] = { value: 0, expiresAt: Date.now() + 6000 };
      await tcpService.writeRegister('dt', 0);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
        sp: 50.0,
        bias: 0.0,
        pb: 100,
        it: 0,
        dt: 0,
      }));
    } else if (norm === 'process reaction' || norm === 'two point method' || norm === 'classical method') {
      setIsAuto(false);
      pendingWritesRef.current['autoMan'] = {
        value: 'Manual',
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('autoMan', 2);

      pendingWritesRef.current['op'] = {
        value: ctrlState.op,
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('op', ctrlState.op);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
      }));
    } else if (norm === 'machine learning control' || norm === 'ml control' || norm === 'ml control (mpc)') {
      // Once ML control is selected, switch to Manual mode and open dedicated window
      setIsAuto(false);
      setIsMLModalOpen(true);
      pendingWritesRef.current['autoMan'] = {
        value: 'Manual',
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('autoMan', 2);

      pendingWritesRef.current['op'] = {
        value: ctrlState.op,
        expiresAt: Date.now() + 6000,
      };
      await tcpService.writeRegister('op', ctrlState.op);

      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: 'Machine Learning Control',
      }));
    } else {
      setActiveMLModel(null);
      activeMLModelRef.current = null;
      setCtrlState((prev) => ({
        ...prev,
        selectedExperiment: expName,
      }));
    }
  };

  const handleStartMLValidationOnMainScreen = async (params: {
    weights: NNWeights;
    logic: MLLogicType;
    setpoint: number;
    horizon: number;
  }) => {
    setIsMLModalOpen(false);
    setIsAuto(false);
    setActiveMLModel(params);
    activeMLModelRef.current = params;
    mlPrevPVRef.current = ctrlState.pv;
    mlIntegralErrRef.current = 0;

    // Show experiment notice popup on Main Screen upon starting validation
    setSelectedExpNotice('Machine Learning Control');

    const tcpService = Ace2007TcpService.getInstance();
    pendingWritesRef.current['autoMan'] = {
      value: 'Manual',
      expiresAt: Date.now() + 6000,
    };
    await tcpService.writeRegister('autoMan', 2);

    pendingWritesRef.current['sp'] = {
      value: params.setpoint,
      expiresAt: Date.now() + 6000,
    };
    await tcpService.writeRegister('sp', params.setpoint);

    setCtrlState((prev) => ({
      ...prev,
      selectedExperiment: 'Machine Learning Control',
      sp: params.setpoint,
    }));
  };

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTrendData((prev) => {
      if (prev.length === 0) {
        return [
          {
            time: 0,
            sp: stateRef.current.sp,
            pv: stateRef.current.pv,
            op: stateRef.current.op,
          },
        ];
      }
      return prev;
    });
    Ace2007TcpService.getInstance().startPolling();
  }, []);

  const handleStopClick = () => {
    setIsStopModalOpen(true);
  };

  const handleConfirmStop = useCallback(() => {
    // 1. Immediately halt Modbus hardware polling
    Ace2007TcpService.getInstance().stopPolling();
    // 2. Halt running state and clear active ML controller
    setIsRunning(false);
    setActiveMLModel(null);
    activeMLModelRef.current = null;
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
    Ace2007TcpService.getInstance().writeRegister('autoMan', 0);
    Ace2007TcpService.getInstance().writeOutput(0, 0);

    setIsStopModalOpen(false);
  }, []);

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
    link.setAttribute('download', `ACE106_Level_Log_${Date.now()}.csv`);
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
        'Cascade Process Trainer (Level + Flow) (ACE 106) — ACE 2007 DAQ — Trend Waveform',
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

      const filename = `ACE106_Level_TrendGraph_${Date.now()}.png`;

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
      a.download = `ACE106_Level_TrendGraph_${Date.now()}.png`;
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
      {/* ── Top-Level Menu Bar (Remote Lab | Experiment) ── */}
      <nav className="trainer-menubar" onClick={(e) => e.stopPropagation()}>
        {/* Remote Lab Tab: Dedicated gateway for Local Network, Firebase, Internet Tunnel, MQTT */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className={`trainer-menu-trigger ${Boolean(ctrlState.selectedExperiment) ? 'disabled' : ''}`}
            disabled={Boolean(ctrlState.selectedExperiment)}
            onClick={() => {
              if (Boolean(ctrlState.selectedExperiment)) return;
              setOpenTopMenu(null);
              setIsRemoteLabModalOpen(true);
            }}
            title={Boolean(ctrlState.selectedExperiment) ? 'Remote Lab is disabled while experiment is selected' : 'Remote Lab Setup & Cloud Gateway'}
          >
            Remote Lab
          </button>
        </div>

        {/* Experiment Menu: Enabled for testing */}
        <div className="trainer-menu-group">
          <button
            type="button"
            className={`trainer-menu-trigger ${openTopMenu === 'exp' ? 'active' : ''}`}
            onClick={() => setOpenTopMenu(openTopMenu === 'exp' ? null : 'exp')}
            title="Select Experiment"
          >
            Experiment
          </button>
          {openTopMenu === 'exp' && (
            <div className="trainer-menu-dropdown">
              {[
                {
                  category: 'Manual Control',
                  items: [
                    { name: 'Open Loop', enabled: true },
                    { name: 'On/Off Control', enabled: true },
                  ],
                },
                {
                  category: 'PID Control',
                  items: [
                    { name: 'P Mode', enabled: true },
                    { name: 'PI Mode', enabled: true },
                    { name: 'PD Mode', enabled: true },
                    { name: 'PID Mode', enabled: true },
                  ],
                },
                {
                  category: 'Tuning',
                  items: [
                    { name: 'Process Reaction', enabled: true },
                    { name: 'Closed Loop', enabled: true },
                    { name: 'Auto Tuning', enabled: false, note: 'Will be informed later' },
                  ],
                },
                {
                  category: 'Model Estimation',
                  items: [
                    { name: 'Process Reaction', enabled: true },
                    { name: 'Two Point Method', enabled: true },
                    { name: 'Classical Method', enabled: true },
                  ],
                },
                {
                  category: 'Modern Control',
                  items: [
                    { name: 'Fuzzy Logic Control', enabled: false, note: 'Will be informed later' },
                    { name: 'Machine Learning Control', enabled: true },
                  ],
                },
              ].map((group) => (
                <div key={group.category} className="dropdown-submenu-item">
                  <div className="dropdown-submenu-trigger">
                    <span>{group.category}</span>
                    <span className="submenu-arrow">▶</span>
                  </div>
                  <div className="dropdown-submenu-panel">
                    {group.items.map((item) => (
                      <button
                        key={`${group.category}-${item.name}`}
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
                        {(ctrlState.selectedExperiment === item.name ||
                          (item.name === 'Machine Learning Control' && ctrlState.selectedExperiment === 'ML Control') ||
                          (item.name === 'On/Off Control' && ctrlState.selectedExperiment === 'On / Off Control')) && (
                          <span className="check-mark">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Top Header Banner ─────────────────────────────────── */}
      <TrainerHeader106 />

      {/* ── Action Ribbon Toolbar ─────────────────────────────── */}
      <TrainerToolbar
        isRunning={isRunning}
        isLogging={isLogging}
        isAuto={!isManualExp && isAuto}
        isAutoDisabled={isManualExp}
        isGraphHold={isGraphHold}
        isConnected={isConnected}
        isExperimentSelected={Boolean(ctrlState.selectedExperiment)}
        onRun={handleRun}
        onStop={handleStopClick}
        onToggleAuto={async () => {
          if (isManualExp) return;
          const nextAuto = !isAuto;
          setIsAuto(nextAuto);
          const tcpService = Ace2007TcpService.getInstance();
          pendingWritesRef.current['autoMan'] = {
            value: nextAuto ? 'Auto' : 'Manual',
            expiresAt: Date.now() + 6000,
          };
          if (!nextAuto) {
            // Clicked from Auto -> text becomes Manual, Controller Output enabled
            // 1. Write value 2 to A/M register (4101 / 0x1005)
            await tcpService.writeRegister('autoMan', 2);
            // 2. Write Controller Output value to OP register (4114 / 0x1012)
            pendingWritesRef.current['op'] = {
              value: ctrlState.op,
              expiresAt: Date.now() + 6000,
            };
            await tcpService.writeRegister('op', ctrlState.op);
          } else {
            // Clicked from Manual -> text becomes Auto, Controller Output becomes read-only
            // Write value 0 to A/M register (4101 / 0x1005)
            await tcpService.writeRegister('autoMan', 0);
          }
        }}
        onToggleLog={() => setIsLogging(!isLogging)}
        onSaveLog={handleSaveLog}
        onClearLog={handleClearLog}
        onToggleHold={() => setIsGraphHold(!isGraphHold)}
        onExportGraph={handleExportGraph}
        onUserGuide={handleUserGuide}
        onHome={onHome}
      />

      {/* ── Real-Time ML Control Status Ribbon ──────────────── */}
      {activeMLModel && (
        <div className="trainer-ml-status-ribbon">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="ribbon-icon">🤖</span>
            <span className="ribbon-text">
              <strong>Real-Time ML Control Active:</strong>{' '}
              {ML_LOGIC_OPTIONS.find((l) => l.id === activeMLModel.logic)?.label} | Setpoint:{' '}
              <strong>{activeMLModel.setpoint}%</strong> | Plant Commanded by Neural Network
            </span>
          </div>
          <button
            type="button"
            className="ribbon-stop-btn"
            onClick={() => {
              setActiveMLModel(null);
              activeMLModelRef.current = null;
            }}
          >
            ■ Stop ML Validation
          </button>
        </div>
      )}

      {/* ── Main Dashboard Content Grid ──────────────────────── */}
      <div className="trainer-main-layout">
        {/* Left Column: Process Schematic / P&I Diagram */}
        <div className="layout-left-column">
          <ProcessSchematic106
            pv={ctrlState.pv}
            sp={ctrlState.sp}
            op={ctrlState.op}
            isRunning={isRunning}
            isAuto={isAuto}
            isConnected={isConnected}
            calibrationConfig={calibrationConfig}
            onCalibrationChange={setCalibrationConfig}
            onCalibrationSave={handleCalibrationSave}
            rawInputs={rawInputs}
          />
        </div>

        {/* Right Column: Controller Parameters & Real-Time Graph */}
        <div className="layout-right-column">
          {/* Upper: Controller Parameters & Sliders */}
          <div className="right-upper-panel">
            <ControllerParametersPanel106
              state={ctrlState}
              isRunning={isRunning}
              isConnected={isConnected}
              isAuto={isAuto}
              tcpHost={tcpHost}
              moduleName={moduleName}
              
              logEntries={logEntries}
              onOpenTcpModal={() => setIsTcpModalOpen(true)}
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

      {/* ── TCP Connection Setup Modal ───────────────────────── */}
      <TcpConnectModal
        isOpen={isTcpModalOpen}
        onClose={() => setIsTcpModalOpen(false)}
        onConnected={handleTcpConnected}
      />

      {/* ── Remote Lab Setup Modal (Local Network, Firebase, Internet Tunnel, MQTT) ── */}
      <RemoteLabModal106
        isOpen={isRemoteLabModalOpen}
        onClose={() => setIsRemoteLabModalOpen(false)}
        onConnected={handleRemoteConnected}
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

      {/* ── ML Control Window Modal ───────────────────────────────── */}
      <MLControlModal
        isOpen={isMLModalOpen}
        onClose={() => setIsMLModalOpen(false)}
        isConnected={isConnected}
        isRunning={isRunning}
        currentPV={ctrlState.pv}
        currentOP={ctrlState.op}
        deviceId={ctrlState.deviceId}
        onSetManual={async () => {
          setIsAuto(false);
          const tcpService = Ace2007TcpService.getInstance();
          pendingWritesRef.current['autoMan'] = {
            value: 'Manual',
            expiresAt: Date.now() + 6000,
          };
          await tcpService.writeRegister('autoMan', 2);
          pendingWritesRef.current['op'] = {
            value: ctrlState.op,
            expiresAt: Date.now() + 6000,
          };
          await tcpService.writeRegister('op', ctrlState.op);
        }}
        onStartValidationOnMainScreen={handleStartMLValidationOnMainScreen}
      />

      {/* ── Auto-Connecting Status Spinner Overlay ── */}
      {isAutoConnecting && (
        <div className="conn-modal-backdrop" style={{ zIndex: 10001 }}>
          <div className="conn-modal-window" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📡</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Auto-Connecting to ACE 2007 DAQ...
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Detecting Wi-Fi DAQ Module on {tcpHost || '192.168.0.1:8080'}
            </div>
          </div>
        </div>
      )}

      {/* ── DAQ Auto-Connect Notice & Alert Modal ── */}
      {daqPopup && (
        <div className="conn-modal-backdrop" onClick={() => daqPopup.type === 'connected' && setDaqPopup(null)}>
          <div className="conn-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="conn-modal-titlebar">
              <div className="conn-title-left">
                <span className="conn-title-icon">{daqPopup.type === 'connected' ? '🔌' : '⚠️'}</span>
                <span>{daqPopup.title}</span>
              </div>
              {daqPopup.type === 'connected' && (
                <button
                  type="button"
                  className="conn-close-x"
                  onClick={() => setDaqPopup(null)}
                  title="Close"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="conn-modal-body">
              <div className="conn-success-icon">
                {daqPopup.type === 'connected' ? '✅' : '⚠️'}
              </div>
              <div className="conn-modal-text">
                <div
                  className="conn-highlight-name"
                  style={{
                    color: daqPopup.type === 'connected' ? '#166534' : '#991b1b',
                    fontSize: '14px',
                    lineHeight: '1.45',
                    fontWeight: 700,
                  }}
                >
                  {daqPopup.message}
                </div>
              </div>
            </div>

            <div
              className="conn-modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                padding: '12px 16px',
                background: '#f1f5f9',
                borderTop: '1px solid #cbd5e1',
              }}
            >
              {daqPopup.type === 'not-detected' ? (
                <>
                  <button
                    type="button"
                    className="conn-ok-btn"
                    onClick={() => attemptAutoConnect()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 22px',
                      background: '#0284c7',
                      color: '#ffffff',
                      fontWeight: 700,
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Retry
                  </button>
                  <button
                    type="button"
                    className="conn-ok-btn"
                    onClick={onHome}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 22px',
                      background: '#475569',
                      color: '#ffffff',
                      fontWeight: 700,
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    🏠 Home
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="conn-ok-btn"
                  onClick={() => setDaqPopup(null)}
                  style={{
                    padding: '8px 32px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Proceed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
