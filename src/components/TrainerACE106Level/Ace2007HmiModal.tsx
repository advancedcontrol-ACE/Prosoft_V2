import React, { useState, useEffect } from 'react';
import './Ace2007HmiModal.css';

interface Ace2007HmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  isAuto?: boolean;
  isConnected?: boolean;
}

export const Ace2007HmiModal: React.FC<Ace2007HmiModalProps> = ({
  isOpen,
  onClose,
  pv,
  sp,
  op,
  isRunning = false,
  isAuto = true,
  isConnected = true,
}) => {
  // Clamp values for safety
  const safePv = Math.max(0, Math.min(100, pv));
  const safeSp = Math.max(0, Math.min(100, sp));
  const safeOp = Math.max(0, Math.min(100, op));
  const isPumping = isRunning || safeOp > 0;

  // ── Clock ────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentDate(`${day}/${month}/${year}`);
      setCurrentTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Bar gauge widths (out of 240px in each card)
  const pvBarWidth = Math.max(0, Math.min(240, (safePv / 100) * 240));
  const spBarWidth = Math.max(0, Math.min(240, (safeSp / 100) * 240));
  const opBarWidth = Math.max(0, Math.min(240, (safeOp / 100) * 240));

  return (
    <div className="ace2007-modal-overlay" onClick={onClose}>
      <div className="ace2007-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ace2007-modal-header">
          <div className="ace2007-modal-title">
            <span className="hmi-badge">ACE 2007</span>
            <span>WiFi DAQ Touchscreen HMI — Level Control</span>
          </div>
          <button type="button" className="ace2007-modal-close" onClick={onClose} title="Close HMI View">
            ✕
          </button>
        </div>

        {/* HMI Bezel Frame & Screen */}
        <div className="ace2007-hmi-container">
          <div className="ace2007-screen-wrapper">
            <svg
              className="ace2007-hmi-svg"
              viewBox="0 0 812 588"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="mGuiBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#020b18" />
                  <stop offset="100%" stopColor="#061730" />
                </linearGradient>

                <linearGradient id="mGuiHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0369a1" />
                  <stop offset="50%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>

                <linearGradient id="mPvCardHeader" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#022c22" />
                </linearGradient>

                <linearGradient id="mSpCardHeader" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0c4a6e" />
                  <stop offset="100%" stopColor="#042337" />
                </linearGradient>

                <linearGradient id="mOpCardHeader" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#78350f" />
                  <stop offset="100%" stopColor="#3d1a03" />
                </linearGradient>

                <linearGradient id="mGuiPvGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                <linearGradient id="mGuiSpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                <linearGradient id="mGuiOpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width="812" height="588" fill="url(#mGuiBgGrad)" />

              {/* ── Top Header Bar ── */}
              <rect x="8" y="8" width="796" height="60" rx="6" fill="#03142c" stroke="#103e6b" strokeWidth="1.5" />

              {/* ACE Logo */}
              <rect x="18" y="14" width="70" height="48" rx="6" fill="#ffffff" />
              <image href="/images/ace2007_logo.png" x="20" y="16" width="66" height="44" preserveAspectRatio="xMidYMid meet" />

              {/* Title Banner */}
              <rect x="100" y="16" width="456" height="44" rx="8" fill="url(#mGuiHeaderGrad)" stroke="#38bdf8" strokeWidth="1.5" />
              <text
                x="328"
                y="46"
                fontFamily="Segoe UI, sans-serif"
                fontSize="23"
                fontWeight="700"
                fill="#ffffff"
                textAnchor="middle"
                letterSpacing="1.2"
              >
                ACE 2007 WiFi DAQ Module
              </text>

              {/* Live Clock */}
              <text x="790" y="34" fontFamily="Consolas, monospace" fontSize="15" fontWeight="600" fill="#e2e8f0" textAnchor="end">
                {currentDate || '25/10/2026'}
              </text>
              <text x="790" y="55" fontFamily="Consolas, monospace" fontSize="17" fontWeight="700" fill="#38bdf8" textAnchor="end">
                {currentTime || '23:30:00'}
              </text>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* ── CARD 1: PV (Process Variable - Level) ── */}
              {/* ══════════════════════════════════════════════════════════ */}
              <g transform="translate(8, 76)">
                {/* Card Outer */}
                <rect width="796" height="136" rx="8" fill="#021422" stroke="#10b981" strokeWidth="2" />
                <rect width="796" height="26" rx="8" fill="url(#mPvCardHeader)" />

                {/* Left Label & Tag */}
                <g transform="translate(20, 42)">
                  <rect width="64" height="32" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
                  <text x="32" y="23" fontFamily="Segoe UI, sans-serif" fontSize="18" fontWeight="900" fill="#ffffff" textAnchor="middle">
                    PV
                  </text>
                  <text x="78" y="20" fontFamily="Segoe UI, sans-serif" fontSize="19" fontWeight="800" fill="#34d399">
                    PROCESS VARIABLE
                  </text>
                  <text x="78" y="42" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="600" fill="#a7f3d0">
                    IP0 Channel • Level Transmitter
                  </text>
                </g>

                {/* Center Recessed Digital Display */}
                <g transform="translate(300, 36)">
                  <rect width="230" height="88" rx="6" fill="#010c14" stroke="#065f46" strokeWidth="2" />
                  <text
                    x="172"
                    y="66"
                    fontFamily="Consolas, monospace"
                    fontSize="60"
                    fontWeight="900"
                    fill="#10b981"
                    textAnchor="end"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.8))' }}
                  >
                    {safePv.toFixed(1)}
                  </text>
                  <text x="216" y="60" fontFamily="Segoe UI, sans-serif" fontSize="24" fontWeight="800" fill="#34d399" textAnchor="end">
                    %
                  </text>
                </g>

                {/* Right Analog Bar Gauge */}
                <g transform="translate(548, 38)">
                  <text x="0" y="14" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#6ee7b7">
                    ANALOG LEVEL GAUGE (0 - 100%)
                  </text>
                  <rect x="0" y="24" width="236" height="26" rx="5" fill="#042030" stroke="#064e3b" strokeWidth="1.5" />
                  <rect x="0" y="24" width={pvBarWidth} height="26" rx="5" fill="url(#mGuiPvGrad)" />
                  <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#a7f3d0" textAnchor="middle">
                    <text x="0" y="64">0%</text>
                    <text x="59" y="64">25%</text>
                    <text x="118" y="64">50%</text>
                    <text x="177" y="64">75%</text>
                    <text x="236" y="64">100%</text>
                  </g>
                  <text x="236" y="80" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fontWeight="700" fill="#10b981" textAnchor="end">
                    TANK LEVEL: {safePv.toFixed(1)} %
                  </text>
                </g>
              </g>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* ── CARD 2: SP (Target Set Point) ── */}
              {/* ══════════════════════════════════════════════════════════ */}
              <g transform="translate(8, 222)">
                <rect width="796" height="136" rx="8" fill="#021528" stroke="#0ea5e9" strokeWidth="2" />
                <rect width="796" height="26" rx="8" fill="url(#mSpCardHeader)" />

                <g transform="translate(20, 42)">
                  <rect width="64" height="32" rx="6" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="32" y="23" fontFamily="Segoe UI, sans-serif" fontSize="18" fontWeight="900" fill="#ffffff" textAnchor="middle">
                    SP
                  </text>
                  <text x="78" y="20" fontFamily="Segoe UI, sans-serif" fontSize="19" fontWeight="800" fill="#38bdf8">
                    SET POINT
                  </text>
                  <text x="78" y="42" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="600" fill="#bae6fd">
                    Target Level Command
                  </text>
                </g>

                <g transform="translate(300, 36)">
                  <rect width="230" height="88" rx="6" fill="#011020" stroke="#075985" strokeWidth="2" />
                  <text
                    x="172"
                    y="66"
                    fontFamily="Consolas, monospace"
                    fontSize="60"
                    fontWeight="900"
                    fill="#38bdf8"
                    textAnchor="end"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.8))' }}
                  >
                    {safeSp.toFixed(1)}
                  </text>
                  <text x="216" y="60" fontFamily="Segoe UI, sans-serif" fontSize="24" fontWeight="800" fill="#7dd3fc" textAnchor="end">
                    %
                  </text>
                </g>

                <g transform="translate(548, 38)">
                  <text x="0" y="14" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#7dd3fc">
                    TARGET SETTING GAUGE (0 - 100%)
                  </text>
                  <rect x="0" y="24" width="236" height="26" rx="5" fill="#052844" stroke="#0284c7" strokeWidth="1.5" />
                  <rect x="0" y="24" width={spBarWidth} height="26" rx="5" fill="url(#mGuiSpGrad)" />
                  <polygon
                    points={`${spBarWidth - 6},20 ${spBarWidth + 6},20 ${spBarWidth},28`}
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="1"
                  />
                  <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#bae6fd" textAnchor="middle">
                    <text x="0" y="64">0%</text>
                    <text x="59" y="64">25%</text>
                    <text x="118" y="64">50%</text>
                    <text x="177" y="64">75%</text>
                    <text x="236" y="64">100%</text>
                  </g>
                  <text x="236" y="80" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fontWeight="700" fill="#38bdf8" textAnchor="end">
                    SETPOINT: {safeSp.toFixed(1)} %
                  </text>
                </g>
              </g>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* ── CARD 3: OP (Controller Output - Valve) ── */}
              {/* ══════════════════════════════════════════════════════════ */}
              <g transform="translate(8, 368)">
                <rect width="796" height="136" rx="8" fill="#1f1502" stroke="#f59e0b" strokeWidth="2" />
                <rect width="796" height="26" rx="8" fill="url(#mOpCardHeader)" />

                <g transform="translate(20, 42)">
                  <rect width="64" height="32" rx="6" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="32" y="23" fontFamily="Segoe UI, sans-serif" fontSize="18" fontWeight="900" fill="#ffffff" textAnchor="middle">
                    OP
                  </text>
                  <text x="78" y="20" fontFamily="Segoe UI, sans-serif" fontSize="19" fontWeight="800" fill="#fbbf24">
                    CONTROLLER OUTPUT
                  </text>
                  <text x="78" y="42" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="600" fill="#fde68a">
                    OP0 Channel • Control Valve
                  </text>
                </g>

                <g transform="translate(300, 36)">
                  <rect width="230" height="88" rx="6" fill="#140d01" stroke="#b45309" strokeWidth="2" />
                  <text
                    x="172"
                    y="66"
                    fontFamily="Consolas, monospace"
                    fontSize="60"
                    fontWeight="900"
                    fill="#f59e0b"
                    textAnchor="end"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.8))' }}
                  >
                    {safeOp.toFixed(1)}
                  </text>
                  <text x="216" y="60" fontFamily="Segoe UI, sans-serif" fontSize="24" fontWeight="800" fill="#fbbf24" textAnchor="end">
                    %
                  </text>
                </g>

                <g transform="translate(548, 38)">
                  <text x="0" y="14" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#fde68a">
                    VALVE OPENING GAUGE (0 - 100%)
                  </text>
                  <rect x="0" y="24" width="236" height="26" rx="5" fill="#2d1c02" stroke="#b45309" strokeWidth="1.5" />
                  <rect x="0" y="24" width={opBarWidth} height="26" rx="5" fill="url(#mGuiOpGrad)" />
                  <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#fde68a" textAnchor="middle">
                    <text x="0" y="64">0%</text>
                    <text x="59" y="64">25%</text>
                    <text x="118" y="64">50%</text>
                    <text x="177" y="64">75%</text>
                    <text x="236" y="64">100%</text>
                  </g>
                  <text x="236" y="80" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fontWeight="700" fill="#f59e0b" textAnchor="end">
                    {safeOp > 0 ? (safeOp >= 100 ? 'VALVE: 100% FULL OPEN' : `VALVE: ${safeOp.toFixed(1)}% OPEN`) : 'VALVE: 0.0% CLOSED'}
                  </text>
                </g>
              </g>

              {/* ── Bottom Navigation & Status Bar ── */}
              <g transform="translate(8, 516)">
                <rect width="796" height="62" rx="6" fill="#03142c" stroke="#103e6b" strokeWidth="1.5" />

                <g transform="translate(14, 9)">
                  <rect width="170" height="44" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="85" y="28" fontFamily="Segoe UI, sans-serif" fontSize="16" fontWeight="800" fill="#ffffff" textAnchor="middle">
                    ⌂  HOME
                  </text>
                </g>

                <g transform="translate(210, 9)">
                  <rect width="170" height="44" rx="6" fill="#042036" stroke={isPumping ? '#10b981' : '#f59e0b'} strokeWidth="1.2" />
                  <circle cx="28" cy="22" r="5" fill={isPumping ? '#10b981' : '#f59e0b'} />
                  <text x="96" y="28" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill={isPumping ? '#10b981' : '#f59e0b'} textAnchor="middle">
                    {isPumping ? 'PUMP RUNNING' : 'PUMP STOPPED'}
                  </text>
                </g>

                <g transform="translate(405, 9)">
                  <rect width="170" height="44" rx="6" fill="#042036" stroke="#38bdf8" strokeWidth="1.2" />
                  <text x="85" y="28" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill="#38bdf8" textAnchor="middle">
                    {isAuto ? 'AUTO MODE' : 'MANUAL MODE'}
                  </text>
                </g>

                <g transform="translate(600, 9)">
                  <rect width="182" height="44" rx="6" fill="#042036" stroke={isConnected ? '#10b981' : '#94a3b8'} strokeWidth="1.2" />
                  <circle cx="28" cy="22" r="5" fill={isConnected ? '#10b981' : '#64748b'} />
                  <text x="98" y="27" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="700" fill={isConnected ? '#e2e8f0' : '#94a3b8'} textAnchor="middle">
                    {isConnected ? 'ACE 2007 ONLINE' : 'DISCONNECTED'}
                  </text>
                </g>
              </g>
            </svg>
          </div>

          <div className="ace2007-bezel-layer">
            <img src="/images/ace2007_bezel_frame.png" alt="ACE 2007 Bezel" className="ace2007-bezel-img" />
          </div>
        </div>
      </div>
    </div>
  );
};
