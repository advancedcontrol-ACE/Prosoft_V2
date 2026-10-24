import React, { useState, useEffect } from 'react';
import { Ace2007TcpService } from '../../services/tcp/ace2007TcpService';
import './TcpConnectModal.css';

interface TcpConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (hostStr: string) => void;
}

export const TcpConnectModal: React.FC<TcpConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const tcpService = Ace2007TcpService.getInstance();
  const [host, setHost] = useState<string>(() => {
    return localStorage.getItem('ace2007_tcp_host') || '192.168.0.1';
  });
  const [port, setPort] = useState<string>(() => {
    return localStorage.getItem('ace2007_tcp_port') || '8080';
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>(
    'Ready to connect to ACE 2007 DAQ Module over TCP (Port 8080).'
  );
  const [connected, setConnected] = useState<boolean>(tcpService.getConnected());

  useEffect(() => {
    if (isOpen) {
      setConnected(tcpService.getConnected());
      if (tcpService.getConnected()) {
        setStatusMsg(`Connected to ${tcpService.getCurrentHost()}:${tcpService.getCurrentPort()} (TCP)`);
      }
    }
  }, [isOpen, tcpService]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatusMsg(`Connecting to ${host.trim()}:${port.trim()}...`);

    try {
      localStorage.setItem('ace2007_tcp_host', host.trim());
      localStorage.setItem('ace2007_tcp_port', port.trim());

      const res = await tcpService.connect(host.trim(), Number(port) || 8080);
      setIsConnecting(false);

      if (res.success) {
        setConnected(true);
        setStatusMsg(res.message);
        onConnected(`${host.trim()}:${port.trim()}`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setConnected(false);
        setStatusMsg(`Error: ${res.message || res.error || 'Connection failed'}`);
      }
    } catch (err: unknown) {
      setIsConnecting(false);
      setConnected(false);
      setStatusMsg(`Connection error: ${String(err)}`);
    }
  };

  const handleDisconnect = async () => {
    await tcpService.disconnect();
    setConnected(false);
    setStatusMsg('Disconnected from ACE 2007 DAQ.');
  };

  return (
    <div className="tcp-modal-overlay">
      <div className="tcp-modal-card">
        <div className="tcp-modal-header">
          <span className="tcp-modal-title">ACE 2007 DAQ — TCP Communication Setup</span>
          <button type="button" className="tcp-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="tcp-modal-body">
          <div className="tcp-info-banner">
            <strong>ACE 2007 Wi-Fi / Ethernet DAQ Module:</strong> Connects over TCP socket to stream
            analog inputs (IP0: Level PV) and send controller output (OP0). Default: 192.168.0.1:8080.
          </div>

          <div className="tcp-field-row">
            <span className="tcp-field-label">DAQ IP Address:</span>
            <input
              type="text"
              className="tcp-input-box"
              value={host}
              disabled={connected || isConnecting}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. 192.168.0.1"
            />
          </div>

          <div className="tcp-field-row">
            <span className="tcp-field-label">TCP Port:</span>
            <input
              type="number"
              className="tcp-input-box"
              value={port}
              disabled={connected || isConnecting}
              onChange={(e) => setPort(e.target.value)}
              placeholder="8080"
            />
          </div>

          <div className="tcp-status-box">{statusMsg}</div>
        </div>

        <div className="tcp-modal-footer">
          <button type="button" className="tcp-btn tcp-btn-secondary" onClick={onClose}>
            Close
          </button>

          {connected ? (
            <button
              type="button"
              className="tcp-btn tcp-btn-danger"
              onClick={handleDisconnect}
              disabled={isConnecting}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              className="tcp-btn tcp-btn-primary"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect (TCP)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
