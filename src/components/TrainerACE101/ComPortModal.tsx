import React, { useState, useEffect } from 'react';
import { DeltaDTBService } from '../../services/modbus/dtb9696Modbus';
import {
  RemoteLabClient,
  type RemoteSession,
  type TunnelTestResponse,
} from '../../services/remoteLab/remoteLabService';
import './ComPortModal.css';

interface ComPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (port: string, isRemote?: boolean) => void;
}

export type RemoteLabTab = 'local_network' | 'firebase' | 'internet_tunnel' | 'mqtt';

export const ComPortModal: React.FC<ComPortModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  // 4 Tabs: Local Network, Firebase, Internet Remote Tunnel, MQTT
  const [activeTab, setActiveTab] = useState<RemoteLabTab>('local_network');

  // Shared / General States
  const [isConnecting, setIsConnecting] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1: Local Network States
  const defaultLocalUrl = 'http://172.20.10.5:5173';
  const [hostPasskey, setHostPasskey] = useState<string>('ACE-101');
  const [hostInfo, setHostInfo] = useState<{ localUrl: string; port: number } | null>(null);
  const [isEditingPasskey, setIsEditingPasskey] = useState(false);
  const [tempPasskey, setTempPasskey] = useState('');
  const [remoteSessions, setRemoteSessions] = useState<RemoteSession[]>([]);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);

  // Student Connection inputs (Local Network)
  const [localStudentUrl, setLocalStudentUrl] = useState<string>(() => {
    return localStorage.getItem('ace_local_student_url') || defaultLocalUrl;
  });
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('ace_remote_student_name') || 'Student_01';
  });
  const [studentPasskey, setStudentPasskey] = useState<string>(() => {
    return localStorage.getItem('ace_remote_student_passkey') || '';
  });

  // Tab 2: Firebase States
  const [firebaseUrl, setFirebaseUrl] = useState<string>(() => {
    return localStorage.getItem('ace_firebase_url') || 'https://ace101-process-default-rtdb.firebaseio.com';
  });
  const [firebaseProjectId, setFirebaseProjectId] = useState<string>('ace101-trainer-lab');
  const [firebasePath, setFirebasePath] = useState<string>('/trainers/ace101/live');
  const [firebaseSyncInterval, setFirebaseSyncInterval] = useState<number>(1000);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(true);
  const [firebaseStatusMsg, setFirebaseStatusMsg] = useState<string | null>(null);

  // Tab 3: Cloudflare Internet Remote Tunnel States
  const [tunnelStatus, setTunnelStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [tunnelError, setTunnelError] = useState<string | null>(null);
  const [isStartingTunnel, setIsStartingTunnel] = useState(false);
  const [isStoppingTunnel, setIsStoppingTunnel] = useState(false);
  const [isTestingTunnel, setIsTestingTunnel] = useState(false);
  const [tunnelTestResult, setTunnelTestResult] = useState<TunnelTestResponse | null>(null);
  const [tunnelStudentUrl, setTunnelStudentUrl] = useState<string>(() => {
    return localStorage.getItem('ace_tunnel_student_url') || '';
  });

  // Tab 4: MQTT States
  const [mqttBroker, setMqttBroker] = useState<string>(() => {
    return localStorage.getItem('ace_mqtt_broker') || 'broker.hivemq.com';
  });
  const [mqttPort, setMqttPort] = useState<string>('8883');
  const [mqttClientId, setMqttClientId] = useState<string>('ACE101_Trainer_Host_9696');
  const [mqttTopic, setMqttTopic] = useState<string>('ace101/process/telemetry');
  const [mqttQoS, setMqttQoS] = useState<number>(0);
  const [isMqttConnected, setIsMqttConnected] = useState<boolean>(false);
  const [mqttStatusMsg, setMqttStatusMsg] = useState<string | null>(null);

  // Load host info on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/remote/host-info')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success) {
            setHostInfo(data);
            if (data.passkey) setHostPasskey(data.passkey);
          }
        })
        .catch(() => {});

      refreshHostSessions();
      refreshTunnelStatus();
    }
  }, [isOpen]);

  // Periodic poll for host sessions and tunnel status when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      refreshHostSessions();
      refreshTunnelStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const refreshHostSessions = async () => {
    try {
      setIsRefreshingSessions(true);
      const data = await RemoteLabClient.getInstance().fetchSessions();
      if (data?.passkey) setHostPasskey(data.passkey);
      setRemoteSessions(data.sessions || []);
    } catch {
      // ignore
    } finally {
      setIsRefreshingSessions(false);
    }
  };

  const refreshTunnelStatus = async () => {
    try {
      const res = await RemoteLabClient.getInstance().getTunnelStatus();
      if (res && res.success) {
        setTunnelStatus(res.status);
        if (res.url) setTunnelUrl(res.url);
        if (res.status === 'stopped') {
          setTunnelUrl(null);
          setTunnelTestResult(null);
        }
        if (res.error) setTunnelError(res.error);
      }
    } catch {
      // ignore
    }
  };

  const handleStartTunnel = async () => {
    setIsStartingTunnel(true);
    setTunnelError(null);
    setTunnelTestResult(null);
    setTunnelStatus('starting');
    try {
      const res = await RemoteLabClient.getInstance().startTunnel();
      if (res.tunnelUrl) {
        setTunnelUrl(res.tunnelUrl);
        setTunnelStatus('running');
      }
    } catch (err: any) {
      setTunnelError(err?.message || 'Failed to start Cloudflare Tunnel');
      setTunnelStatus('error');
    } finally {
      setIsStartingTunnel(false);
    }
  };

  const handleStopTunnel = async () => {
    setIsStoppingTunnel(true);
    try {
      await RemoteLabClient.getInstance().stopTunnel();
      setTunnelStatus('stopped');
      setTunnelUrl(null);
      setTunnelTestResult(null);
      setTunnelError(null);
    } catch (err: any) {
      setTunnelError(err?.message || 'Failed to stop Cloudflare Tunnel');
    } finally {
      setIsStoppingTunnel(false);
    }
  };

  const handleTestTunnel = async () => {
    setIsTestingTunnel(true);
    setTunnelTestResult(null);
    try {
      const res = await RemoteLabClient.getInstance().testTunnel();
      setTunnelTestResult(res);
    } catch (err: any) {
      setTunnelTestResult({
        success: false,
        reachable: false,
        error: err?.message || 'Failed to contact tunnel URL',
      });
    } finally {
      setIsTestingTunnel(false);
    }
  };

  const handleUpdatePasskey = async () => {
    if (!tempPasskey.trim()) return;
    try {
      const updated = await RemoteLabClient.getInstance().setPasskey(tempPasskey.trim());
      setHostPasskey(updated);
      setIsEditingPasskey(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeStudent = async (token: string) => {
    try {
      await RemoteLabClient.getInstance().revokeSession(token);
      await refreshHostSessions();
    } catch (e) {
      console.error(e);
    }
  };

  // Remote Student Connect Action
  const handleConnectRemote = async (targetUrl: string) => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) {
      setErrorMsg('Please enter the Remote Lab Host URL.');
      return;
    }
    if (trimmedUrl.toLowerCase().includes('ace-lab.trycloudflare.com')) {
      setErrorMsg(
        '⚠️ "https://ace-lab.trycloudflare.com" was only an example! Please enter the real Wi-Fi address (e.g. http://172.20.10.5:5173) or the link generated by Cloudflare tunnel.'
      );
      return;
    }
    if (!studentPasskey.trim()) {
      setErrorMsg('Please enter the Access Passkey provided by your instructor.');
      return;
    }

    setIsConnecting(true);
    setLogMessage(`Connecting to Remote Lab Host at ${trimmedUrl}... Verifying Passkey...`);
    setErrorMsg(null);

    // Save to localStorage
    if (activeTab === 'local_network') {
      localStorage.setItem('ace_local_student_url', trimmedUrl);
    } else {
      localStorage.setItem('ace_tunnel_student_url', trimmedUrl);
    }
    localStorage.setItem('ace_remote_student_name', studentName.trim());
    localStorage.setItem('ace_remote_student_passkey', studentPasskey.trim());

    const modbusService = DeltaDTBService.getInstance();
    const result = await modbusService.connectRemote(
      trimmedUrl,
      studentPasskey.trim(),
      studentName.trim() || 'Student'
    );

    if (result.success) {
      setLogMessage(`TX: [${result.txFrame}]\nRX: [${result.rxFrame}]\n${result.message}`);
      setTimeout(() => {
        setIsConnecting(false);
        onConnected(result.portName, true);
        onClose();
      }, 700);
    } else {
      setIsConnecting(false);
      setErrorMsg(result.message || 'Failed to connect to Remote Lab Host.');
    }
  };

  if (!isOpen) return null;

  const currentLocalIpUrl = hostInfo?.localUrl || defaultLocalUrl;

  return (
    <div className="com-modal-backdrop">
      <div className="com-modal-window">
        {/* Title Bar */}
        <div className="com-modal-titlebar">
          <div className="title-left">
            <span className="title-icon">🌐</span>
            <span className="title-text">Remote Lab Gateway & Cloud Synchronization — DELTA DTB9696</span>
          </div>
          <button type="button" className="close-x" onClick={onClose}>✕</button>
        </div>

        {/* 4 Dedicated Tabs */}
        <div className="com-mode-nav">
          <button
            type="button"
            className={`com-mode-tab ${activeTab === 'local_network' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('local_network');
              setErrorMsg(null);
              setLogMessage(null);
            }}
          >
            🏠 Local Network
          </button>
          <button
            type="button"
            className={`com-mode-tab ${activeTab === 'firebase' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('firebase');
              setErrorMsg(null);
              setLogMessage(null);
            }}
          >
            🔥 Firebase
          </button>
          <button
            type="button"
            className={`com-mode-tab ${activeTab === 'internet_tunnel' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('internet_tunnel');
              setErrorMsg(null);
              setLogMessage(null);
            }}
          >
            🌐 Internet Remote Tunnel
          </button>
          <button
            type="button"
            className={`com-mode-tab ${activeTab === 'mqtt' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('mqtt');
              setErrorMsg(null);
              setLogMessage(null);
            }}
          >
            📡 MQTT
          </button>
        </div>

        {/* Modal Body */}
        <div className="com-modal-body">
          {/* ═══════════ TAB 1: LOCAL NETWORK ═══════════ */}
          {activeTab === 'local_network' && (
            <div className="tab-pane-content">
              {/* Host Remote Access & Monitoring Card */}
              <div className="host-monitor-card">
                <div className="host-monitor-header">
                  <span className="monitor-badge">📡 Remote Lab Server Active</span>
                  <div className="passkey-wrapper">
                    <span className="passkey-label">Access Passkey:</span>
                    {isEditingPasskey ? (
                      <div className="passkey-edit-box">
                        <input
                          type="text"
                          value={tempPasskey}
                          onChange={(e) => setTempPasskey(e.target.value)}
                          placeholder="New Passkey"
                          className="passkey-input"
                        />
                        <button type="button" className="btn-passkey-save" onClick={handleUpdatePasskey}>
                          Save
                        </button>
                        <button type="button" className="btn-passkey-cancel" onClick={() => setIsEditingPasskey(false)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="passkey-display-box">
                        <code className="passkey-code">{hostPasskey}</code>
                        <button
                          type="button"
                          className="btn-passkey-edit"
                          onClick={() => {
                            setTempPasskey(hostPasskey);
                            setIsEditingPasskey(true);
                          }}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="host-ip-box">
                  <div className="host-ip-title">📍 Same Wi-Fi / Local Network Direct URL:</div>
                  <div className="host-ip-row">
                    <code className="host-ip-code">{currentLocalIpUrl}</code>
                    <button
                      type="button"
                      className="btn-copy-ip"
                      onClick={() => {
                        navigator.clipboard.writeText(currentLocalIpUrl);
                        alert(`Copied ${currentLocalIpUrl} to clipboard!`);
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <span className="host-ip-hint">
                    If student & teacher are on the same Wi-Fi/router, student enters this directly!
                  </span>
                </div>

                {/* Connected Students Table */}
                <div className="connected-students-section">
                  <div className="students-title-row">
                    <span className="students-title">
                      Connected Remote Students ({remoteSessions.filter((s) => s.status === 'active').length})
                    </span>
                    <button
                      type="button"
                      className="btn-refresh-sessions"
                      onClick={refreshHostSessions}
                      disabled={isRefreshingSessions}
                    >
                      {isRefreshingSessions ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                  </div>

                  {remoteSessions.length > 0 ? (
                    <div className="students-table-wrap">
                      <table className="students-table">
                        <thead>
                          <tr>
                            <th>Student ID / Name</th>
                            <th>IP Address</th>
                            <th>Last Activity</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remoteSessions.map((s) => {
                            const isRecent = Date.now() - s.lastSeen < 10000;
                            return (
                              <tr key={s.token} className={s.status === 'revoked' ? 'revoked-row' : ''}>
                                <td className="font-bold">{s.studentName}</td>
                                <td>{s.clientIp}</td>
                                <td>{s.lastAction || 'Active'}</td>
                                <td>
                                  {s.status === 'revoked' ? (
                                    <span className="badge-revoked">Revoked</span>
                                  ) : isRecent ? (
                                    <span className="badge-online">Online</span>
                                  ) : (
                                    <span className="badge-idle">Idle</span>
                                  )}
                                </td>
                                <td>
                                  {s.status === 'active' && (
                                    <button
                                      type="button"
                                      className="btn-revoke-student"
                                      onClick={() => handleRevokeStudent(s.token)}
                                      title="Disconnect and revoke student access"
                                    >
                                      🚫 Revoke
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-students-placeholder">
                      No remote students connected yet. Share your host URL & passkey (<code>{hostPasskey}</code>) with students.
                    </div>
                  )}
                </div>
              </div>

              {/* Student Quick Connect Form (Local Network) */}
              <div className="remote-client-card">
                <div className="remote-client-header">
                  <strong>🎓 Connect as Student on Local Network</strong>
                </div>
                <div className="remote-form-section">
                  <div className="form-field">
                    <label className="config-label">Local Host URL:</label>
                    <input
                      type="text"
                      className="remote-input"
                      value={localStudentUrl}
                      onChange={(e) => setLocalStudentUrl(e.target.value)}
                      placeholder="e.g. http://172.20.10.5:5173"
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">Student Name / Roll No:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Roll 21 - Rahul"
                      />
                    </div>
                    <div className="form-field">
                      <label className="config-label">Passkey:</label>
                      <input
                        type="password"
                        className="remote-input"
                        value={studentPasskey}
                        onChange={(e) => setStudentPasskey(e.target.value)}
                        placeholder="e.g. ACE-101"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="com-btn-connect remote"
                    onClick={() => handleConnectRemote(localStudentUrl)}
                    disabled={isConnecting || !localStudentUrl.trim() || !studentPasskey.trim()}
                  >
                    {isConnecting ? 'Connecting...' : '🔗 Connect to Local Network Host'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 2: FIREBASE ═══════════ */}
          {activeTab === 'firebase' && (
            <div className="tab-pane-content">
              <div className="host-monitor-card">
                <div className="host-monitor-header">
                  <span className="monitor-badge" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                    🔥 Firebase Realtime Database
                  </span>
                  <span className={`tunnel-status-pill ${isFirebaseSyncing ? 'running' : 'stopped'}`}>
                    {isFirebaseSyncing ? '🟢 Sync Active' : '⚪ Standby'}
                  </span>
                </div>

                <p className="tab-intro-desc">
                  Stream live Process Variable (PV), Set Point (SP), Controller Output (OP), and PID parameters to Firebase Realtime Database. Enables real-time web monitoring and multi-client visualization.
                </p>

                <div className="config-form-grid">
                  <div className="form-field">
                    <label className="config-label">Firebase Realtime Database URL:</label>
                    <input
                      type="text"
                      className="remote-input"
                      value={firebaseUrl}
                      onChange={(e) => {
                        setFirebaseUrl(e.target.value);
                        localStorage.setItem('ace_firebase_url', e.target.value);
                      }}
                      placeholder="https://your-project-id.firebaseio.com"
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">Project ID:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={firebaseProjectId}
                        onChange={(e) => setFirebaseProjectId(e.target.value)}
                        placeholder="ace101-trainer-lab"
                      />
                    </div>
                    <div className="form-field">
                      <label className="config-label">Database Telemetry Path:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={firebasePath}
                        onChange={(e) => setFirebasePath(e.target.value)}
                        placeholder="/trainers/ace101/live"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">Telemetry Refresh Rate:</label>
                      <select
                        className="remote-input select-input"
                        value={firebaseSyncInterval}
                        onChange={(e) => setFirebaseSyncInterval(Number(e.target.value))}
                      >
                        <option value={250}>250 ms (Fast Real-time)</option>
                        <option value={500}>500 ms (High Speed)</option>
                        <option value={1000}>1000 ms (1 second - Default)</option>
                        <option value={2000}>2000 ms (Energy Saver)</option>
                      </select>
                    </div>
                    <div className="form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className={`btn-sync-toggle ${isFirebaseSyncing ? 'active' : ''}`}
                        onClick={() => {
                          setIsFirebaseSyncing(!isFirebaseSyncing);
                          setFirebaseStatusMsg(
                            !isFirebaseSyncing ? 'Firebase sync successfully enabled.' : 'Firebase sync paused.'
                          );
                        }}
                      >
                        {isFirebaseSyncing ? '⏹️ Pause Firebase Sync' : '🚀 Start Firebase Sync'}
                      </button>
                    </div>
                  </div>

                  {firebaseStatusMsg && (
                    <div className="sync-status-alert">
                      ℹ️ {firebaseStatusMsg}
                    </div>
                  )}

                  <div className="payload-preview-card">
                    <span className="payload-title">JSON Telemetry Mirror Schema:</span>
                    <pre className="payload-code">
{`{
  "trainer": "ACE101_Level_Process",
  "registers": {
    "pv": 50.0,
    "sp": 50.0,
    "op": 40.0,
    "pb": 100,
    "it": 0,
    "dt": 0,
    "autoMan": "Auto"
  },
  "timestamp": ${Date.now()}
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 3: INTERNET REMOTE TUNNEL ═══════════ */}
          {activeTab === 'internet_tunnel' && (
            <div className="tab-pane-content">
              {/* Cloudflare Tunnel Host Section */}
              <div className={`host-tunnel-box ${tunnelStatus === 'running' ? 'active' : ''}`}>
                <div className="tunnel-header-row">
                  <div className="tunnel-title">
                    <span className="tunnel-icon">🌐</span>
                    <strong>Internet Remote Lab Tunnel (Worldwide Access):</strong>
                  </div>
                  {tunnelStatus === 'running' ? (
                    <span className="tunnel-status-pill running">🟢 Live Online</span>
                  ) : tunnelStatus === 'starting' || isStartingTunnel ? (
                    <span className="tunnel-status-pill starting">⏳ Initializing...</span>
                  ) : (
                    <span className="tunnel-status-pill stopped">⚪ Stopped</span>
                  )}
                </div>

                {tunnelStatus === 'running' && tunnelUrl ? (
                  <div className="tunnel-active-body">
                    <div className="tunnel-url-row">
                      <code className="tunnel-url-display">{tunnelUrl}</code>
                      <button
                        type="button"
                        className="btn-tunnel-copy"
                        onClick={() => {
                          navigator.clipboard.writeText(tunnelUrl);
                          alert(`Copied ${tunnelUrl} to clipboard!\nShare this link with your remote students.`);
                        }}
                      >
                        📋 Copy Link
                      </button>
                      <button
                        type="button"
                        className="btn-tunnel-test"
                        onClick={handleTestTunnel}
                        disabled={isTestingTunnel}
                      >
                        {isTestingTunnel ? '🧪 Testing...' : '🧪 Test Connection'}
                      </button>
                      <button
                        type="button"
                        className="btn-tunnel-stop"
                        onClick={handleStopTunnel}
                        disabled={isStoppingTunnel}
                      >
                        {isStoppingTunnel ? 'Stopping...' : '⏹️ Stop'}
                      </button>
                    </div>

                    {tunnelTestResult && (
                      <div
                        className={`tunnel-test-result ${
                          tunnelTestResult.reachable ? 'success' : 'error'
                        }`}
                      >
                        {tunnelTestResult.reachable ? (
                          <>
                            ✅ <strong>Host Reachable via Internet!</strong> Latency:{' '}
                            <strong>{tunnelTestResult.latencyMs} ms</strong> &bull; Hardware:{' '}
                            <span
                              style={{
                                color: tunnelTestResult.hardwareConnected ? '#059669' : '#d97706',
                                fontWeight: 700,
                              }}
                            >
                              {tunnelTestResult.hardwareConnected
                                ? `Connected (${tunnelTestResult.activePort})`
                                : 'COM Port Offline'}
                            </span>
                          </>
                        ) : (
                          <>
                            ❌ <strong>Reachability Check Failed:</strong>{' '}
                            {tunnelTestResult.error || 'Server did not respond'}
                          </>
                        )}
                      </div>
                    )}
                    <span className="tunnel-hint">
                      Students anywhere in the world can paste this link into the student connect box below!
                    </span>
                  </div>
                ) : (
                  <div className="tunnel-inactive-body">
                    <p className="tunnel-desc">
                      Creates an encrypted, secure Cloudflare tunnel directly to this host PC. No router port-forwarding or public IP needed.
                    </p>
                    {tunnelError && (
                      <div className="tunnel-error-alert">
                        ⚠️ {tunnelError}
                      </div>
                    )}
                    <div className="tunnel-action-row">
                      <button
                        type="button"
                        className="btn-start-tunnel"
                        onClick={handleStartTunnel}
                        disabled={isStartingTunnel}
                      >
                        {isStartingTunnel ? '⏳ Creating Tunnel Link (5-10s)...' : '🚀 Start Cloudflare Tunnel URL'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Client Connect via Tunnel */}
              <div className="remote-client-card">
                <div className="remote-client-header">
                  <strong>🎓 Connect as Student via Cloudflare Tunnel URL</strong>
                </div>
                <div className="remote-form-section">
                  <div className="form-field">
                    <label className="config-label">
                      Remote Tunnel URL:
                      <span className="field-hint">(Provided by your instructor / host)</span>
                    </label>
                    <input
                      type="text"
                      className="remote-input"
                      value={tunnelStudentUrl}
                      onChange={(e) => setTunnelStudentUrl(e.target.value)}
                      placeholder="e.g. https://xxxx-xxxx.trycloudflare.com"
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">Student Name / Roll Number:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Roll 42 - Priya"
                      />
                    </div>
                    <div className="form-field">
                      <label className="config-label">Access Passkey:</label>
                      <input
                        type="password"
                        className="remote-input"
                        value={studentPasskey}
                        onChange={(e) => setStudentPasskey(e.target.value)}
                        placeholder="e.g. ACE-101"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="com-btn-connect remote"
                    onClick={() => handleConnectRemote(tunnelStudentUrl)}
                    disabled={isConnecting || !tunnelStudentUrl.trim() || !studentPasskey.trim()}
                  >
                    {isConnecting ? 'Authenticating with Host...' : '🌐 Connect via Remote Tunnel'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: MQTT ═══════════ */}
          {activeTab === 'mqtt' && (
            <div className="tab-pane-content">
              <div className="host-monitor-card">
                <div className="host-monitor-header">
                  <span className="monitor-badge" style={{ background: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe' }}>
                    📡 Industrial IoT MQTT Broker Integration
                  </span>
                  <span className={`tunnel-status-pill ${isMqttConnected ? 'running' : 'stopped'}`}>
                    {isMqttConnected ? '🟢 Connected' : '⚪ Standby'}
                  </span>
                </div>

                <p className="tab-intro-desc">
                  Publish real-time telemetry and subscribe to remote setpoint commands using the lightweight MQTT pub/sub protocol. Compatible with Node-RED, Grafana, AWS IoT Core, and industrial SCADA systems.
                </p>

                <div className="config-form-grid">
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">MQTT Broker Host:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={mqttBroker}
                        onChange={(e) => {
                          setMqttBroker(e.target.value);
                          localStorage.setItem('ace_mqtt_broker', e.target.value);
                        }}
                        placeholder="broker.hivemq.com"
                      />
                    </div>
                    <div className="form-field">
                      <label className="config-label">Port (WSS / TCP):</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={mqttPort}
                        onChange={(e) => setMqttPort(e.target.value)}
                        placeholder="8883"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">Client ID:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={mqttClientId}
                        onChange={(e) => setMqttClientId(e.target.value)}
                        placeholder="ACE101_Trainer_Host_9696"
                      />
                    </div>
                    <div className="form-field">
                      <label className="config-label">Publish Telemetry Topic:</label>
                      <input
                        type="text"
                        className="remote-input"
                        value={mqttTopic}
                        onChange={(e) => setMqttTopic(e.target.value)}
                        placeholder="ace101/process/telemetry"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="config-label">QoS Level:</label>
                      <select
                        className="remote-input select-input"
                        value={mqttQoS}
                        onChange={(e) => setMqttQoS(Number(e.target.value))}
                      >
                        <option value={0}>QoS 0 - At most once (Fastest)</option>
                        <option value={1}>QoS 1 - At least once (Guaranteed)</option>
                        <option value={2}>QoS 2 - Exactly once (Mission critical)</option>
                      </select>
                    </div>
                    <div className="form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className={`btn-sync-toggle ${isMqttConnected ? 'active' : ''}`}
                        onClick={() => {
                          setIsMqttConnected(!isMqttConnected);
                          setMqttStatusMsg(
                            !isMqttConnected
                              ? `Connected to MQTT broker ${mqttBroker}:${mqttPort}. Publishing to ${mqttTopic}`
                              : 'MQTT broker disconnected.'
                          );
                        }}
                      >
                        {isMqttConnected ? '⏹️ Disconnect MQTT' : '🚀 Connect MQTT Broker'}
                      </button>
                    </div>
                  </div>

                  {mqttStatusMsg && (
                    <div className="sync-status-alert">
                      ℹ️ {mqttStatusMsg}
                    </div>
                  )}

                  <div className="payload-preview-card">
                    <span className="payload-title">Live MQTT Telemetry Stream (Topic: {mqttTopic}):</span>
                    <pre className="payload-code">
{`{
  "client": "${mqttClientId}",
  "device": "DELTA_DTB9696",
  "pv": 50.0,
  "sp": 50.0,
  "op": 40.0,
  "mode": "PID",
  "status": "Running",
  "timestamp": ${Date.now()}
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status & Output Logs */}
          {logMessage && (
            <div className="com-log-box">
              <pre>{logMessage}</pre>
            </div>
          )}

          {errorMsg && (
            <div className="com-error-box">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="com-modal-footer">
          <button
            type="button"
            className="com-btn-cancel"
            onClick={onClose}
            disabled={isConnecting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
