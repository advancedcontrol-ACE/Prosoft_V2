import React, { useState, useEffect } from 'react';
import { type CalibrationConfig } from '../../services/tcp/calibrationUtils';

export interface Ace2007ScreenSvgProps {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  isAuto?: boolean;
  isConnected?: boolean;
  calibrationConfig?: CalibrationConfig;
  rawInputs?: {
    ip0?: number;
    ip1?: number;
    ip2?: number;
    ip3?: number;
  };
  showFrame?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Ace2007ScreenSvg: React.FC<Ace2007ScreenSvgProps> = ({
  pv,
  sp,
  op,
  showFrame = false,
  className,
  style,
}) => {
  // Clamp values 0..100
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

  // ── Progress Bar Widths (88px full scale) ────────────────────────────
  const barMax = 88;
  const pvBarW = Math.max(0, Math.min(barMax, (safePv / 100) * barMax));
  const spBarW = Math.max(0, Math.min(barMax, (safeSp / 100) * barMax));
  const opBarW = Math.max(0, Math.min(barMax, (safeOp / 100) * barMax));

  // SVG viewBox definition
  const viewBox = showFrame ? '0 0 400 346' : '0 0 324 256';

  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="aceScreenBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020b18" />
          <stop offset="100%" stopColor="#05152a" />
        </linearGradient>

        {/* Header gradient matching Figure */}
        <linearGradient id="aceHdrPillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Chassis Gradients for showFrame */}
        <linearGradient id="modalChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="25%" stopColor="#e2e8f0" />
          <stop offset="85%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <linearGradient id="modalBezelInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* ── Optional Outer Chassis Enclosure (for Modal Popup) ── */}
      {showFrame && (
        <g id="modal-enclosure">
          {/* Chassis body */}
          <rect x="8" y="6" width="384" height="332" rx="14" fill="url(#modalChassisGrad)" stroke="#64748b" strokeWidth="1.5" />
          {/* Corner Screw Bosses */}
          <circle cx="22" cy="20" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          <circle cx="378" cy="20" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          <circle cx="22" cy="324" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          <circle cx="378" cy="324" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          {/* Screen Bezel Inset */}
          <rect x="34" y="24" width="332" height="264" rx="6" fill="url(#modalBezelInnerGrad)" stroke="#334155" strokeWidth="1.2" />

          {/* Green Terminal Block at Bottom */}
          <g id="modal-terminal-block" transform="translate(34, 294)">
            <rect width="332" height="28" rx="4" fill="#065f46" stroke="#047857" strokeWidth="1" />
            {Array.from({ length: 14 }).map((_, i) => (
              <g key={`term-${i}`} transform={`translate(${14 + i * 23.3}, 14)`}>
                <circle r="6" fill="#042f2e" />
                <circle r="4" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
                <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke="#334155" strokeWidth="0.9" />
              </g>
            ))}
          </g>
        </g>
      )}

      {/* ── Main Screen Surface (324 x 256) ── */}
      <g transform={showFrame ? 'translate(38, 28)' : undefined}>
        {/* Screen Background */}
        <rect width="324" height="256" fill="url(#aceScreenBg)" rx="4" />

        {/* ── Top Header Bar ────────────────────────────────────────────── */}
        <rect x="4" y="4" width="316" height="34" rx="5" fill="#021024" stroke="#0e375e" strokeWidth="1" />

        {/* White ACE Logo Badge */}
        <rect x="8" y="7" width="40" height="28" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
        <image
          href="/images/ace2007_logo.png"
          x="10"
          y="9"
          width="36"
          height="24"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Centered Blue Gradient Title Banner */}
        <rect
          x="52"
          y="7"
          width="178"
          height="28"
          rx="5"
          fill="url(#aceHdrPillGrad)"
          stroke="#38bdf8"
          strokeWidth="0.9"
        />
        <text
          x="141"
          y="25"
          fontFamily="Segoe UI, sans-serif"
          fontSize="11"
          fontWeight="800"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="0.4"
        >
          ACE 2007 WiFi DAQ Module
        </text>

        {/* Real-time Clock and Date */}
        <text
          x="314"
          y="18"
          fontFamily="Consolas, Segoe UI, monospace"
          fontSize="9.5"
          fontWeight="600"
          fill="#cbd5e1"
          textAnchor="end"
        >
          {currentDate || '26/10/2026'}
        </text>
        <text
          x="314"
          y="31"
          fontFamily="Consolas, monospace"
          fontSize="12"
          fontWeight="700"
          fill="#38bdf8"
          textAnchor="end"
        >
          {currentTime || '10:15:00'}
        </text>

        {/* ── ROW 1: LIVE VALUES (PV, SP, OP) ──────────────────────────── */}
        {/* Card 1: PV (AI0) */}
        <g id="card-pv-ai0">
          <rect x="6" y="44" width="100" height="78" rx="5" fill="#02140c" stroke="#10b981" strokeWidth="1.5" />
          <text x="12" y="58" fontFamily="Segoe UI, sans-serif" fontSize="11" fontWeight="800" fill="#10b981">
            PV (AI0)
          </text>
          <text
            x="76"
            y="86"
            fontFamily="Consolas, monospace"
            fontSize="26"
            fontWeight="900"
            fill="#00ff88"
            textAnchor="end"
            textRendering="geometricPrecision"
          >
            {safePv.toFixed(1)}
          </text>
          <text x="94" y="84" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="800" fill="#6ee7b7" textAnchor="end">
            %
          </text>
          <rect x="12" y="96" width="88" height="8" rx="3" fill="#042618" stroke="#065f46" strokeWidth="0.8" />
          <rect x="12" y="96" width={pvBarW} height="8" rx="3" fill="#00ff88" />
        </g>

        {/* Card 2: SP */}
        <g id="card-sp-row1">
          <rect x="110" y="44" width="100" height="78" rx="5" fill="#021620" stroke="#06b6d4" strokeWidth="1.5" />
          <text x="116" y="58" fontFamily="Segoe UI, sans-serif" fontSize="11" fontWeight="800" fill="#38bdf8">
            SP
          </text>
          <text
            x="180"
            y="86"
            fontFamily="Consolas, monospace"
            fontSize="26"
            fontWeight="900"
            fill="#00e5ff"
            textAnchor="end"
            textRendering="geometricPrecision"
          >
            {safeSp.toFixed(1)}
          </text>
          <text x="198" y="84" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="800" fill="#7dd3fc" textAnchor="end">
            %
          </text>
          <rect x="116" y="96" width="88" height="8" rx="3" fill="#032533" stroke="#0891b2" strokeWidth="0.8" />
          <rect x="116" y="96" width={spBarW} height="8" rx="3" fill="#00e5ff" />
        </g>

        {/* Card 3: OP (AO0) */}
        <g id="card-op-ao0">
          <rect x="214" y="44" width="100" height="78" rx="5" fill="#1c0f02" stroke="#f97316" strokeWidth="1.5" />
          <text x="220" y="58" fontFamily="Segoe UI, sans-serif" fontSize="11" fontWeight="800" fill="#fb923c">
            OP (AO0)
          </text>
          <text
            x="284"
            y="86"
            fontFamily="Consolas, monospace"
            fontSize="26"
            fontWeight="900"
            fill="#ff9100"
            textAnchor="end"
            textRendering="geometricPrecision"
          >
            {safeOp.toFixed(1)}
          </text>
          <text x="302" y="84" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="800" fill="#fdba74" textAnchor="end">
            %
          </text>
          <rect x="220" y="96" width="88" height="8" rx="3" fill="#2d1703" stroke="#c2410c" strokeWidth="0.8" />
          <rect x="220" y="96" width={opBarW} height="8" rx="3" fill="#ff9100" />
        </g>

        {/* ── ROW 2: UNUSED VALUES (---) ────────────────────────────────── */}
        {/* Card 4: PV (AI1) */}
        <g id="card-pv-ai1">
          <rect x="6" y="126" width="100" height="78" rx="5" fill="#021020" stroke="#0284c7" strokeWidth="1.5" />
          <text x="12" y="140" fontFamily="Segoe UI, sans-serif" fontSize="11" fontWeight="800" fill="#38bdf8">
            PV (AI1)
          </text>
          <text
            x="76"
            y="168"
            fontFamily="Consolas, monospace"
            fontSize="26"
            fontWeight="900"
            fill="#64748b"
            textAnchor="end" textRendering="geometricPrecision"
          >
            ---
          </text>
          <text x="94" y="166" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="800" fill="#475569" textAnchor="end">
            %
          </text>
          <rect x="12" y="178" width="88" height="8" rx="3" fill="#021e33" stroke="#0369a1" strokeWidth="0.8" />
        </g>

        {/* Card 5: SP Row 2 */}
        <g id="card-sp-row2">
          <rect x="110" y="126" width="100" height="78" rx="5" fill="#020f28" stroke="#2563eb" strokeWidth="1.5" />
          <text x="116" y="140" fontFamily="Segoe UI, sans-serif" fontSize="11" fontWeight="800" fill="#60a5fa">
            SP
          </text>
          <text
            x="180"
            y="168"
            fontFamily="Consolas, monospace"
            fontSize="26"
            fontWeight="900"
            fill="#64748b"
            textAnchor="end" textRendering="geometricPrecision"
          >
            ---
          </text>
          <text x="198" y="166" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="800" fill="#475569" textAnchor="end">
            %
          </text>
          <rect x="116" y="178" width="88" height="8" rx="3" fill="#041c48" stroke="#1d4ed8" strokeWidth="0.8" />
        </g>

        {/* Card 6: OP (AO1) */}
        <g id="card-op-ao1">
          <rect x="214" y="126" width="100" height="78" rx="5" fill="#1a0420" stroke="#d946ef" strokeWidth="1.5" />
          <text x="220" y="140" fontFamily="Segoe UI, sans-serif" fontSize="11" fontWeight="800" fill="#e879f9">
            OP (AO1)
          </text>
          <text
            x="284"
            y="168"
            fontFamily="Consolas, monospace"
            fontSize="26"
            fontWeight="900"
            fill="#64748b"
            textAnchor="end" textRendering="geometricPrecision"
          >
            ---
          </text>
          <text x="302" y="166" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="800" fill="#475569" textAnchor="end">
            %
          </text>
          <rect x="220" y="178" width="88" height="8" rx="3" fill="#260630" stroke="#a21caf" strokeWidth="0.8" />
        </g>

        {/* ── BOTTOM PINOUT STRIP ──────────────────────────────────────── */}
        <g id="bottom-pinout-strip">
          <rect x="6" y="208" width="308" height="42" rx="4" fill="#021024" stroke="#0e375e" strokeWidth="1" />

          {/* Section Dividers */}
          <line x1="136" y1="212" x2="136" y2="246" stroke="#1e4976" strokeWidth="1" />
          <line x1="232" y1="212" x2="232" y2="246" stroke="#1e4976" strokeWidth="1" />

          {/* AI (4-20mA) */}
          <text x="71" y="220" fontFamily="Segoe UI, sans-serif" fontSize="9" fontWeight="800" fill="#94a3b8" textAnchor="middle">
            AI (4-20mA)
          </text>
          <line x1="20" y1="227" x2="122" y2="227" stroke="#475569" strokeWidth="1" />
          {[0, 1, 2, 3].map((num, idx) => {
            const x = 24 + idx * 30;
            return (
              <g key={`ai-tick-${num}`}>
                <line x1={x} y1="227" x2={x} y2="232" stroke="#475569" strokeWidth="1" />
                <text x={x} y="242" fontFamily="Consolas, monospace" fontSize="8.5" fontWeight="700" fill="#cbd5e1" textAnchor="middle">
                  {num}
                </text>
              </g>
            );
          })}

          {/* AO (4-20mA) */}
          <text x="184" y="220" fontFamily="Segoe UI, sans-serif" fontSize="9" fontWeight="800" fill="#94a3b8" textAnchor="middle">
            AO (4-20mA)
          </text>
          <line x1="154" y1="227" x2="214" y2="227" stroke="#475569" strokeWidth="1" />
          {[0, 1].map((num, idx) => {
            const x = 166 + idx * 36;
            return (
              <g key={`ao-tick-${num}`}>
                <line x1={x} y1="227" x2={x} y2="232" stroke="#475569" strokeWidth="1" />
                <text x={x} y="242" fontFamily="Consolas, monospace" fontSize="8.5" fontWeight="700" fill="#cbd5e1" textAnchor="middle">
                  {num}
                </text>
              </g>
            );
          })}

          {/* 24 VDC */}
          <text x="272" y="220" fontFamily="Segoe UI, sans-serif" fontSize="9" fontWeight="800" fill="#94a3b8" textAnchor="middle">
            24 VDC
          </text>
          <line x1="248" y1="227" x2="296" y2="227" stroke="#475569" strokeWidth="1" />
          {['+', '-'].map((sym, idx) => {
            const x = 258 + idx * 28;
            return (
              <g key={`dc-tick-${sym}`}>
                <line x1={x} y1="227" x2={x} y2="232" stroke="#475569" strokeWidth="1" />
                <text x={x} y="242" fontFamily="Consolas, monospace" fontSize="9.5" fontWeight="700" fill="#cbd5e1" textAnchor="middle">
                  {sym}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
};
