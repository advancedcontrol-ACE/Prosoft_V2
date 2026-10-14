import React, { useState, useEffect } from 'react';
import { DeltaDTBService } from '../../services/modbus/dtb9696Modbus';
import { fetchAvailablePorts } from '../../services/modbus/serialPorts';
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

export const ComPortModal: React.FC<ComPortModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  // Mode: 'local' (Host with hardware) vs 'remote' (Student client connecting over Internet)
  const [modalMode, setModalMode] = useState<'local' | 'remote'>('local');

  // Local Mode States
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Host Monitoring States
  const [hostPasskey, setHostPasskey] = useState<string>('ACE-101');
  const [hostInfo, setHostInfo] = useState<{ localUrl: string; port: number } | null>(null);
  const [isEditingPasskey, setIsEditingPasskey] = useState(false);
  const [tempPasskey, setTempPasskey] = useState('');
  const [remoteSessions, setRemoteSessions] = useState<RemoteSession[]>([]);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);

  // In-App Cloudflare Tunnel States
  const [tunnelStatus, setTunnelStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [tunnelError, setTunnelError] = useState<string | null>(null);
  const [isStartingTunnel, setIsStartingTunnel] = useState(false);
  const [isStoppingTunnel, setIsStoppingTunnel] = useState(false);
  const [isTestingTunnel, setIsTestingTunnel] = useState(false);
  const [tunnelTestResult, setTunnelTestResult] = useState<TunnelTestResponse | null>(null);

  // Remote Student Client States
  const [remoteHostUrl, setRemoteHostUrl] = useState<string>(() => {
    return localStorage.getItem('ace_remote_host_url') || '';
  });
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('ace_remote_student_name') || 'Student_01';
  });
  const [studentPasskey, setStudentPasskey] = useState<string>(() => {
    return localStorage.getItem('ace_remote_student_passkey') || '';
  });

  // Query local ports and host sessions when opened
  useEffect(() => {
    if (isOpen) {
      fetchAvailablePorts().then((ports) => {
        setAvailablePorts(ports);
        if (ports.length > 0) {
          setSelectedPort(ports[0]);
        } else {
          setSelectedPort('');
        }
      });

      // Fetch host info and sessions
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

  // Periodic poll for host sessions and tunnel status when modal is open on local mode
  useEffect(() => {
    if (!isOpen || modalMode !== 'local') return;
    const interval = setInterval(() => {
      refreshHostSessions();
      refreshTunnelStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, modalMode]);

  const refreshHostSessions = async () => {
    try {
      setIsRefreshingSessions(true);
      const data = await RemoteLabClient.getInstance().fetchSessions();
      setHostPasskey(data.passkey);
      setRemoteSessions(data.sessions || []);
    } catch {
      // ignore if local server not running or in client mode
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

  // Local Connect Action
  const handleConnectLocal = async () => {
    if (!selectedPort) return;
    setIsConnecting(true);
    setLogMessage(`Opening ${selectedPort} (9600, 8-N-1)... Initializing Modbus RTU...`);
    setErrorMsg(null);

    const modbusService = DeltaDTBService.getInstance();
    const result = await modbusService.connect(selectedPort);

    if (result.success) {
      setLogMessage(`TX: [${result.txFrame}]\nRX: [${result.rxFrame}]\n${result.message}`);
      setTimeout(() => {
        setIsConnecting(false);
        onConnected(result.portName, false);
        onClose();
      }, 700);
    } else {
      setIsConnecting(false);
      setErrorMsg(result.message || 'Communication error.');
    }
  };

  // Remote Student Connect Action
  const handleConnectRemote = async () => {
    if (!remoteHostUrl.trim()) {
      setErrorMsg('Please enter the Remote Lab Host URL.');
      return;
    }
    if (remoteHostUrl.toLowerCase().includes('ace-lab.trycloudflare.com')) {
      setErrorMsg('⚠️ "https://ace-lab.trycloudflare.com" was only an example! Please enter the real Wi-Fi address (e.g. http://10.55.5.115:5173) or the real link generated by Start_Remote_Lab_Tunnel.bat on the host PC.');
      return;
    }
    if (!studentPasskey.trim()) {
      setErrorMsg('Please enter the Access Passkey provided by your instructor.');
      return;
    }

    setIsConnecting(true);
    setLogMessage(`Connecting to Remote Lab Host at ${remoteHostUrl}... Verifying Passkey...`);
    setErrorMsg(null);

    // Save to localStorage for convenience
    localStorage.setItem('ace_remote_host_url', remoteHostUrl.trim());
    localStorage.setItem('ace_remote_student_name', studentName.trim());
    localStorage.setItem('ace_remote_student_passkey', studentPasskey.trim());

    const modbusService = DeltaDTBService.getInstance();
    const result = await modbusService.connectRemote(
      remoteHostUrl.trim(),
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

  return (
    <div className="com-modal-backdrop">
      <div className="com-modal-window">
        {/* Title Bar */}
        <div className="com-modal-titlebar">
          <div className="title-left">
            <span className="title-icon">🔌</span>
            <span className="title-text">Communication Setup & Remote Lab — DELTA DTB9696</span>
          </div>
          <button type="button" className="close-x" onClick={onClose}>✕</button>
        </div>

        {/* Top Mode Tabs */}
        <div className="com-mode-nav">
          <button
            type="button"
            className={`com-mode-tab ${modalMode === 'local' ? 'active' : ''}`}
            onClick={() => {
              setModalMode('local');
              setErrorMsg(null);
              setLogMessage(null);
            }}
          >
            🖥️ Local Hardware (Host Mode)
          </button>
          <button
            type="button"
            className={`com-mode-tab ${modalMode === 'remote' ? 'active' : ''}`}
            onClick={() => {
              setModalMode('remote');
              setErrorMsg(null);
              setLogMessage(null);
            }}
          >
            🌐 Remote Lab Client (Student Mode)
          </button>
        </div>

        {/* Modal Body */}
        <div className="com-modal-body">
          {modalMode === 'local' ? (
            /* ── Local Hardware Mode ── */
            <>
              <div className="config-section">
                <label className="config-label">Select Physical Serial Port (COM Port):</label>
                <div className="port-selection-grid">
                  {availablePorts.length > 0 ? (
                    availablePorts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`port-chip ${selectedPort === p ? 'selected' : ''}`}
                        onClick={() => setSelectedPort(p)}
                        disabled={isConnecting}
                      >
                        {p}
                      </button>
                    ))
                  ) : (
                    <div className="com-no-device-chip">No Physical COM Device Detected</div>
                  )}
                </div>
              </div>

              <div className="param-summary">
                <div className="param-item">
                  <span className="p-key">Hardware Controller:</span>
                  <span className="p-val">DELTA DTB9696 (Modbus RTU)</span>
                </div>
                <div className="param-item">
                  <span className="p-key">Baud Rate / Framing:</span>
                  <span className="p-val">9600 bps / 8-N-1 / Slave ID: 1</span>
                </div>
              </div>

              {/* Host Remote Access & Monitoring Section */}
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
                    <code className="host-ip-code">{hostInfo?.localUrl || 'http://10.55.5.115:5173'}</code>
                    <button
                      type="button"
                      className="btn-copy-ip"
                      onClick={() => {
                        const txt = hostInfo?.localUrl || 'http://10.55.5.115:5173';
                        navigator.clipboard.writeText(txt);
                        alert(`Copied ${txt} to clipboard!`);
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <span className="host-ip-hint">If student & teacher are on the same Wi-Fi/router, student enters this directly!</span>
                </div>

                {/* Cloudflare Internet Tunnel Section (In-App Host Control) */}
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
                        Students anywhere in the world can paste this link into their "Remote Lab Client" tab!
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
            </>
          ) : (
            /* ── Remote Student Client Mode ── */
            <>
              <div className="remote-form-section">
                <div className="form-field">
                  <label className="config-label">
                    Lab Server Host URL or IP Address:
                    <span className="field-hint">(Provided by your instructor / host)</span>
                  </label>
                  <input
                    type="text"
                    className="remote-input"
                    value={remoteHostUrl}
                    onChange={(e) => setRemoteHostUrl(e.target.value)}
                    placeholder="e.g. http://10.55.5.115:5173 (Wi-Fi) or https://[unique-name].trycloudflare.com"
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

                <div className="remote-info-banner">
                  🌐 <strong>Remote Student Mode:</strong> Connects to your instructor's physical Delta DTB9696 controller over the Internet. You will receive live PV/SP/OP graphs and can test PID control without needing physical hardware attached to your PC!
                </div>
              </div>
            </>
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

          {modalMode === 'local' ? (
            <button
              type="button"
              className="com-btn-connect"
              onClick={handleConnectLocal}
              disabled={isConnecting || !selectedPort}
            >
              {isConnecting
                ? 'Connecting Hardware...'
                : selectedPort
                ? `Connect Hardware (${selectedPort})`
                : 'Connect Hardware'}
            </button>
          ) : (
            <button
              type="button"
              className="com-btn-connect remote"
              onClick={handleConnectRemote}
              disabled={isConnecting || !remoteHostUrl.trim() || !studentPasskey.trim()}
            >
              {isConnecting ? 'Authenticating with Host...' : '🌐 Connect to Remote Lab'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
