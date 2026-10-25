import React, { useState, useEffect, useRef, useMemo } from 'react';
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

interface TrendPoint {
  pv: number;
  sp: number;
  op: number;
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

  // ── Real-Time Trend Buffer ───────────────────────────────────────────
  const [trendData, setTrendData] = useState<TrendPoint[]>(() => {
    const initial: TrendPoint[] = [];
    for (let i = 0; i < 25; i++) {
      initial.push({ pv: safePv, sp: safeSp, op: safeOp });
    }
    return initial;
  });

  const latestValuesRef = useRef({ safePv, safeSp, safeOp });
  latestValuesRef.current = { safePv, safeSp, safeOp };

  useEffect(() => {
    const interval = setInterval(() => {
      setTrendData((prev) => {
        const next = [...prev, {
          pv: latestValuesRef.current.safePv,
          sp: latestValuesRef.current.safeSp,
          op: latestValuesRef.current.safeOp,
        }];
        if (next.length > 25) {
          next.shift();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Trend Paths
  const trendPaths = useMemo(() => {
    const count = trendData.length;
    if (count < 2) return { pvPath: '', spPath: '', opPath: '' };

    const gridX = 440;
    const gridY = 125;
    const gridW = 340;
    const gridH = 320;

    const getX = (idx: number) => gridX + (idx / Math.max(1, count - 1)) * gridW;
    const getY = (val: number) => gridY + gridH - (Math.max(0, Math.min(100, val)) / 100) * gridH;

    let pvD = `M ${getX(0)},${getY(trendData[0].pv)}`;
    let spD = `M ${getX(0)},${getY(trendData[0].sp)}`;
    let opD = `M ${getX(0)},${getY(trendData[0].op)}`;

    for (let i = 1; i < count; i++) {
      pvD += ` L ${getX(i)},${getY(trendData[i].pv)}`;
      spD += ` L ${getX(i)},${getY(trendData[i].sp)}`;
      opD += ` L ${getX(i)},${getY(trendData[i].op)}`;
    }

    return { pvPath: pvD, spPath: spD, opPath: opD };
  }, [trendData]);

  if (!isOpen) return null;

  const pvBarWidth = Math.max(0, Math.min(324, (safePv / 100) * 324));
  const spBarWidth = Math.max(0, Math.min(324, (safeSp / 100) * 324));
  const opBarWidth = Math.max(0, Math.min(324, (safeOp / 100) * 324));
  const spNeedleX = 16 + spBarWidth;

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

                <linearGradient id="mPanelHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#082b4c" />
                  <stop offset="100%" stopColor="#0c3a64" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width="812" height="588" fill="url(#mGuiBgGrad)" />

              {/* Top Header Bar */}
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
                {currentTime || '20:30:00'}
              </text>

              {/* ── Left Column: Process Channels ── */}
              <rect x="8" y="74" width="384" height="438" rx="6" fill="#03152a" stroke="#0e3860" strokeWidth="1.5" />
              <rect x="8" y="74" width="384" height="28" rx="6" fill="url(#mPanelHeaderGrad)" />
              <text
                x="200"
                y="93"
                fontFamily="Segoe UI, sans-serif"
                fontSize="12.5"
                fontWeight="700"
                fill="#38bdf8"
                textAnchor="middle"
                letterSpacing="1"
              >
                PROCESS CHANNELS (LEVEL CONTROL)
              </text>

              {/* PV (Process Variable) */}
              <g transform="translate(18, 108)">
                <rect width="364" height="118" rx="6" fill="#021824" stroke="#10b981" strokeWidth="1.8" />
                <text x="14" y="24" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="800" fill="#34d399">PV</text>
                <text x="44" y="24" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="600" fill="#6ee7b7">IP0 (Level PV)</text>
                <text x="350" y="28" fontFamily="Segoe UI, sans-serif" fontSize="17" fontWeight="700" fill="#a7f3d0" textAnchor="end">%</text>
                
                <text x="250" y="76" fontFamily="Consolas, monospace" fontSize="48" fontWeight="900" fill="#10b981" textAnchor="end">
                  {safePv.toFixed(1)}
                </text>
                
                <rect x="14" y="90" width="336" height="15" rx="3" fill="#072a3a" />
                <rect x="14" y="90" width={pvBarWidth} height="15" rx="3" fill="url(#mGuiPvGrad)" />
              </g>

              {/* SP (Target Set Point) */}
              <g transform="translate(18, 234)">
                <rect width="364" height="118" rx="6" fill="#02172a" stroke="#0ea5e9" strokeWidth="1.8" />
                <text x="14" y="24" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="800" fill="#38bdf8">SP</text>
                <text x="44" y="24" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="600" fill="#7dd3fc">Target Set Point</text>
                <text x="350" y="28" fontFamily="Segoe UI, sans-serif" fontSize="17" fontWeight="700" fill="#bae6fd" textAnchor="end">%</text>
                
                <text x="250" y="76" fontFamily="Consolas, monospace" fontSize="48" fontWeight="900" fill="#38bdf8" textAnchor="end">
                  {safeSp.toFixed(1)}
                </text>
                
                <rect x="14" y="90" width="336" height="15" rx="3" fill="#06233d" />
                <rect x="14" y="90" width={spBarWidth} height="15" rx="3" fill="url(#mGuiSpGrad)" />
                <line x1={spNeedleX} y1="86" x2={spNeedleX} y2="108" stroke="#ffffff" strokeWidth="2.5" />
              </g>

              {/* OP (Controller Output) */}
              <g transform="translate(18, 360)">
                <rect width="364" height="118" rx="6" fill="#1c1602" stroke="#f59e0b" strokeWidth="1.8" />
                <text x="14" y="24" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="800" fill="#fbbf24">OP</text>
                <text x="44" y="24" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="600" fill="#fde68a">OP0 (Valve Output)</text>
                <text x="350" y="28" fontFamily="Segoe UI, sans-serif" fontSize="17" fontWeight="700" fill="#fef3c7" textAnchor="end">%</text>
                
                <text x="250" y="76" fontFamily="Consolas, monospace" fontSize="48" fontWeight="900" fill="#f59e0b" textAnchor="end">
                  {safeOp.toFixed(1)}
                </text>
                
                <rect x="14" y="90" width="336" height="15" rx="3" fill="#2d1e02" />
                <rect x="14" y="90" width={opBarWidth} height="15" rx="3" fill="url(#mGuiOpGrad)" />
              </g>

              {/* ── Right Column: Real-Time Trend ── */}
              <rect x="400" y="74" width="404" height="438" rx="6" fill="#03152a" stroke="#0e3860" strokeWidth="1.5" />
              <rect x="400" y="74" width="404" height="28" rx="6" fill="url(#mPanelHeaderGrad)" />
              <text
                x="602"
                y="93"
                fontFamily="Segoe UI, sans-serif"
                fontSize="12.5"
                fontWeight="700"
                fill="#38bdf8"
                textAnchor="middle"
                letterSpacing="1"
              >
                REALTIME TREND
              </text>

              {/* Trend Canvas Area */}
              <rect x="440" y="115" width="340" height="330" fill="#020b16" stroke="#0a3055" strokeWidth="1" />

              {/* Grid Lines & Labels */}
              <g fontFamily="Consolas, monospace" fontSize="11" fill="#64748b" textAnchor="end">
                <line x1="440" y1="120" x2="780" y2="120" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="434" y="124">100</text>

                <line x1="440" y1="184" x2="780" y2="184" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="434" y="188">80</text>

                <line x1="440" y1="248" x2="780" y2="248" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="434" y="252">60</text>

                <line x1="440" y1="312" x2="780" y2="312" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="434" y="316">40</text>

                <line x1="440" y1="376" x2="780" y2="376" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="434" y="380">20</text>

                <line x1="440" y1="440" x2="780" y2="440" stroke="#1e4060" />
                <text x="434" y="443">0</text>
              </g>

              {/* Time X-Labels */}
              <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#64748b" textAnchor="middle">
                <line x1="440" y1="115" x2="440" y2="440" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="440" y="456">0</text>

                <line x1="508" y1="115" x2="508" y2="440" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="508" y="456">10</text>

                <line x1="576" y1="115" x2="576" y2="440" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="576" y="456">20</text>

                <line x1="644" y1="115" x2="644" y2="440" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="644" y="456">30</text>

                <line x1="712" y1="115" x2="712" y2="440" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="712" y="456">40</text>

                <line x1="780" y1="115" x2="780" y2="440" stroke="#0d3862" strokeDasharray="3,3" />
                <text x="780" y="456">50</text>
              </g>
              <text x="610" y="471" fontFamily="Segoe UI, sans-serif" fontSize="11" fill="#94a3b8" textAnchor="middle">Time (s)</text>

              {/* Curves */}
              {trendPaths.spPath && (
                <path d={trendPaths.spPath} fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="5,3" />
              )}
              {trendPaths.opPath && (
                <path d={trendPaths.opPath} fill="none" stroke="#f59e0b" strokeWidth="2.2" />
              )}
              {trendPaths.pvPath && (
                <path d={trendPaths.pvPath} fill="none" stroke="#10b981" strokeWidth="3" />
              )}

              {/* Legend */}
              <g transform="translate(438, 485)">
                <rect x="0" y="0" width="13" height="13" rx="2.5" fill="#10b981" />
                <text x="18" y="11" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#e2e8f0">PV (Level)</text>

                <rect x="110" y="0" width="13" height="13" rx="2.5" fill="#38bdf8" />
                <text x="128" y="11" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#e2e8f0">SP</text>

                <rect x="175" y="0" width="13" height="13" rx="2.5" fill="#f59e0b" />
                <text x="193" y="11" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#e2e8f0">OP (Valve)</text>
              </g>

              {/* ── Bottom Navigation & Status Bar ── */}
              <g transform="translate(8, 518)">
                <rect width="796" height="60" rx="6" fill="#03142c" stroke="#103e6b" strokeWidth="1.5" />

                <g transform="translate(14, 9)">
                  <rect width="170" height="42" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="85" y="27" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="800" fill="#ffffff" textAnchor="middle">
                    ⌂  HOME
                  </text>
                </g>

                <g transform="translate(210, 9)">
                  <rect width="170" height="42" rx="6" fill="#042036" stroke={isRunning ? '#10b981' : '#f59e0b'} strokeWidth="1.2" />
                  <circle cx="30" cy="21" r="5" fill={isRunning ? '#10b981' : '#f59e0b'} />
                  <text x="96" y="27" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill={isRunning ? '#10b981' : '#f59e0b'} textAnchor="middle">
                    {isRunning ? 'RUNNING' : 'STOPPED'}
                  </text>
                </g>

                <g transform="translate(405, 9)">
                  <rect width="170" height="42" rx="6" fill="#042036" stroke="#38bdf8" strokeWidth="1.2" />
                  <text x="85" y="27" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill="#38bdf8" textAnchor="middle">
                    {isAuto ? 'AUTO MODE' : 'MANUAL MODE'}
                  </text>
                </g>

                <g transform="translate(600, 9)">
                  <rect width="182" height="42" rx="6" fill="#042036" stroke={isConnected ? '#10b981' : '#94a3b8'} strokeWidth="1.2" />
                  <circle cx="28" cy="21" r="5" fill={isConnected ? '#10b981' : '#64748b'} />
                  <text x="98" y="26" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="700" fill={isConnected ? '#e2e8f0' : '#94a3b8'} textAnchor="middle">
                    {isConnected ? 'WiFi DAQ ONLINE' : 'DAQ STANDBY'}
                  </text>
                </g>
              </g>
            </svg>

            {/* Bezel Overlay Image */}
            <img
              src="/images/ace2007_bezel_frame.png"
              alt="ACE 2007 Touchscreen Bezel"
              className="ace2007-hmi-bezel-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
