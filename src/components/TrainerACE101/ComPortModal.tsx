import React, { useState, useEffect } from 'react';
import { DeltaDTBService } from '../../services/modbus/dtb9696Modbus';
import { fetchAvailablePorts } from '../../services/modbus/serialPorts';
import './ComPortModal.css';

interface ComPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (port: string) => void;
}

export const ComPortModal: React.FC<ComPortModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!selectedPort) return;
    setIsConnecting(true);
    setLogMessage(`Opening ${selectedPort} (9600, 8-N-1)... Writing High bit to Modbus Address 4101...`);
    setErrorMsg(null);

    const modbusService = DeltaDTBService.getInstance();
    const result = await modbusService.connect(selectedPort);

    if (result.success) {
      setLogMessage(
        `TX: [${result.txFrame}]\nRX: [${result.rxFrame}]\n${result.message}`
      );
      setTimeout(() => {
        setIsConnecting(false);
        onConnected(result.portName);
        onClose();
      }, 700);
    } else {
      setIsConnecting(false);
      setErrorMsg(result.message || 'Communication error.');
    }
  };

  return (
    <div className="com-modal-backdrop">
      <div className="com-modal-window">
        {/* Title Bar */}
        <div className="com-modal-titlebar">
          <span className="title-icon">🔌</span>
          <span className="title-text">Serial Communication Setup — DELTA DTB9696</span>
          <button type="button" className="close-x" onClick={onClose}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="com-modal-body">
          <div className="config-section">
            <label className="config-label">Select Serial Port (COM Port):</label>
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
                <div className="com-no-device-chip">No Device</div>
              )}
            </div>
          </div>

          <div className="param-summary">
            <div className="param-item">
              <span className="p-key">Controller:</span>
              <span className="p-val">DELTA DTB9696</span>
            </div>
            <div className="param-item">
              <span className="p-key">Baud Rate:</span>
              <span className="p-val">9600 bps</span>
            </div>
            <div className="param-item">
              <span className="p-key">Parity / Data:</span>
              <span className="p-val">None / 8 Bits / 1 Stop</span>
            </div>
            <div className="param-item">
              <span className="p-key">Device Slave ID:</span>
              <span className="p-val">1 (0x01)</span>
            </div>
            <div className="param-item">
              <span className="p-key">Handshake Register:</span>
              <span className="p-val highlight">4101 (High Bit = Run/Init)</span>
            </div>
          </div>

          {/* Status / Output Log */}
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
            Cancel
          </button>
          <button
            type="button"
            className="com-btn-connect"
            onClick={handleConnect}
            disabled={isConnecting || !selectedPort}
          >
            {isConnecting
              ? 'Communicating...'
              : selectedPort
              ? `Connect to ${selectedPort}`
              : 'Connect to Device'}
          </button>
        </div>
      </div>
    </div>
  );
};
