import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../TrainerACE101/ProcessSchematicSvg.css';

interface ProcessSchematic106SvgProps {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  isAuto?: boolean;
  isConnected?: boolean;
  onOpenHmiModal?: () => void;
}

interface TrendPoint {
  pv: number;
  sp: number;
  op: number;
}

export const ProcessSchematic106Svg: React.FC<ProcessSchematic106SvgProps> = ({
  pv,
  sp,
  op,
  isRunning = false,
  isAuto = true,
  isConnected = true,
  onOpenHmiModal,
}) => {
  // Clamp values for safety
  const safePv = Math.max(0, Math.min(100, pv));
  const safeSp = Math.max(0, Math.min(100, sp));
  const safeOp = Math.max(0, Math.min(100, op));

  // ── Real-Time Dynamic Clock for DAQ Display ──────────────────────────
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

  // ── Real-Time Dynamic Trend Buffer (Last 25 sample points) ───────────
  const [trendData, setTrendData] = useState<TrendPoint[]>(() => {
    // Initialise with smooth initial baseline
    const initial: TrendPoint[] = [];
    for (let i = 0; i < 20; i++) {
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

  // Compute SVG Trend Paths (Grid bounds: X: 440..780, Y: 125..445, Width: 340, Height: 320)
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

  // ── Level Tank Geometry (1024 x 844) ─────────────────────────────────
  const tankTotalHeight = 285;
  const tankWaterHeight = (safePv / 100) * tankTotalHeight;
  const tankBaseY = 630;
  const tankWaterTopY = tankBaseY - tankWaterHeight;

  // ── Supply Pipe Segments ─────────────────────────────────────────────
  const pipePath0 = 'M 884,739 L 946,739 Q 958,739 958,727 L 958,664';
  const pipePath1 = 'M 958,638 L 958,427 Q 958,415 946,415 L 908,415';
  const pipePath2 = 'M 804,415 L 697,415 Q 685,415 685,403 L 685,385';
  const pipePath3 = 'M 685,215 L 685,202 Q 685,190 673,190 L 488,190 Q 476,190 476,202 L 476,312';
  const pipeSegments = [pipePath0, pipePath1, pipePath2, pipePath3];

  // ── Drain Line Segments ──────────────────────────────────────────────
  const drainPath1 = 'M 600,612 L 642,612';
  const drainPath2 = 'M 690,612 L 710,612 Q 718,612 718,620 L 718,645';
  const drainPath3 = 'M 718,665 L 718,715';
  const drainSegments = [drainPath1, drainPath2, drainPath3];

  const flowSpeed = `${Math.max(0.45, 1.25 - (safeOp / 100) * 0.8).toFixed(2)}s`;

  // ── ACE 2007 Hardware Dimensions & Coordinates ───────────────────────
  const chassisX = 40;
  const chassisY = 48;
  const chassisW = 372;
  const chassisH = 384;

  const bezelX = 45;
  const bezelY = 56;
  const bezelW = 362;
  const bezelH = 294;

  // Screen inside bezel (106..918 / 1024, 118..706 / 832)
  const screenX = bezelX + bezelW * (106 / 1024);
  const screenY = bezelY + bezelH * (118 / 832);
  const screenW = bezelW * (812 / 1024);
  const screenH = bezelH * (588 / 832);

  // Bar gauge widths (out of 324px in 812x588 viewBox)
  const pvBarWidth = Math.max(0, Math.min(324, (safePv / 100) * 324));
  const spBarWidth = Math.max(0, Math.min(324, (safeSp / 100) * 324));
  const opBarWidth = Math.max(0, Math.min(324, (safeOp / 100) * 324));
  const spNeedleX = 16 + spBarWidth;

  return (
    <svg
      className="process-scada-svg-root"
      viewBox="0 0 1024 844"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Fluid Glow Filter */}
        <filter id="fluid-glow-106" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Chassis Gradients */}
        <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e2530" />
          <stop offset="50%" stop-color="#141922" />
          <stop offset="100%" stop-color="#0e1218" />
        </linearGradient>

        <linearGradient id="terminalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2a3340" />
          <stop offset="100%" stop-color="#151b24" />
        </linearGradient>

        {/* Screen GUI Gradients */}
        <linearGradient id="guiBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#020b18" />
          <stop offset="100%" stop-color="#061730" />
        </linearGradient>

        <linearGradient id="guiHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0369a1" />
          <stop offset="50%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>

        <linearGradient id="guiPvGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#059669" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>

        <linearGradient id="guiSpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>

        <linearGradient id="guiOpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>

        <linearGradient id="panelHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#082b4c" />
          <stop offset="100%" stop-color="#0c3a64" />
        </linearGradient>
      </defs>

      {/* ── Base Schematic Picture ── */}
      <image
        href="/images/schematic_base.png"
        x="0"
        y="0"
        width="1024"
        height="844"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* ── Fluid Flow Animation (Active when Start/isRunning is high) ── */}
      {isRunning && (
        <g className="pump-to-tank-water-flow-group">
          {/* Disconnected Pipe Fluid Segments */}
          {pipeSegments.map((pathD, idx) => (
            <g key={`pipe-segment-106-${idx}`} className="pipe-fluid-subsegment">
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="10"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="6"
                strokeDasharray="16, 12"
                strokeLinecap="round"
                className="fluid-flow-dash"
                style={{ animationDuration: flowSpeed }}
              />
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeDasharray="4, 24"
                strokeLinecap="round"
                className="fluid-flow-bubbles"
                style={{ animationDuration: flowSpeed }}
              />
            </g>
          ))}

          {/* Drain Line Segments */}
          {drainSegments.map((pathD, idx) => (
            <g key={`drain-segment-106-${idx}`} className="drain-fluid-subsegment">
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="8"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4.5"
                strokeDasharray="12, 10"
                strokeLinecap="round"
                className="fluid-flow-dash"
                style={{ animationDuration: '0.85s' }}
              />
            </g>
          ))}

          {/* Water Stream Pouring into Process Tank */}
          {tankWaterTopY > 352 && (
            <g className="tank-inlet-stream">
              <line
                x1="476"
                y1="348"
                x2="476"
                y2={tankWaterTopY}
                stroke="#0284c7"
                strokeWidth="6"
                strokeOpacity="0.48"
                strokeLinecap="round"
              />
              <line
                x1="476"
                y1="348"
                x2="476"
                y2={tankWaterTopY}
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                className="fluid-jet-flow"
              />
              <line
                x1="476"
                y1="348"
                x2="476"
                y2={tankWaterTopY}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                className="fluid-jet-bubbles"
              />
              <ellipse
                cx="476"
                cy={tankWaterTopY}
                rx="14"
                ry="4"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="2"
                className="fluid-ripple-1"
              />
              <ellipse
                cx="476"
                cy={tankWaterTopY}
                rx="14"
                ry="4"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                className="fluid-ripple-2"
              />
            </g>
          )}
        </g>
      )}

      {/* ── Level Tank Water Column ── */}
      {safePv > 0 && (
        <g className="level-tank-water-group">
          <rect
            x="416"
            y={tankWaterTopY}
            width="183"
            height={tankWaterHeight}
            fill="#1e60ff"
            fillOpacity="0.75"
          />
          <line
            x1="416"
            y1={tankWaterTopY}
            x2="599"
            y2={tankWaterTopY}
            stroke="#70b5ff"
            strokeWidth="2.5"
          />
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ACE 2007 HARDWARE MODULE & DISPLAY (Replaces Delta DTB) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <g
        className="ace2007-daq-unit-group"
        onClick={onOpenHmiModal}
        style={{ cursor: onOpenHmiModal ? 'pointer' : 'default' }}
      >
        <title>ACE 2007 WiFi DAQ Module (Click to Enlarge Touchscreen)</title>

        {/* 1. Heavy Industrial Enclosure Chassis (Completely covers old DTB) */}
        <rect
          x={chassisX}
          y={chassisY}
          width={chassisW}
          height={chassisH}
          rx="8"
          fill="url(#chassisGrad)"
          stroke="#3b4859"
          strokeWidth="2.5"
        />

        {/* Chassis Corner Hex Screws */}
        <circle cx={chassisX + 8} cy={chassisY + 8} r="3" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
        <circle cx={chassisX + chassisW - 8} cy={chassisY + 8} r="3" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
        <circle cx={chassisX + 8} cy={chassisY + chassisH - 8} r="3" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
        <circle cx={chassisX + chassisW - 8} cy={chassisY + chassisH - 8} r="3" fill="#64748b" stroke="#1e293b" strokeWidth="1" />

        {/* 2. Lower Terminal / Connector Section (Figure 2 ACE 2007 body) */}
        <rect
          x={chassisX + 8}
          y={bezelY + bezelH + 6}
          width={chassisW - 16}
          height={chassisH - bezelH - 20}
          rx="4"
          fill="url(#terminalGrad)"
          stroke="#263140"
          strokeWidth="1.5"
        />

        {/* Hardware Module Badge */}
        <text
          x={chassisX + 22}
          y={bezelY + bezelH + 24}
          fontFamily="Segoe UI, sans-serif"
          fontSize="11"
          fontWeight="800"
          fill="#38bdf8"
          letterSpacing="0.8"
        >
          ACE 2007 WiFi DAQ
        </text>

        <text
          x={chassisX + 22}
          y={bezelY + bezelH + 37}
          fontFamily="Segoe UI, sans-serif"
          fontSize="8.5"
          fontWeight="600"
          fill="#94a3b8"
        >
          CH0: IP0 (Level PV) | OP0 (Valve Out) | 4-20mA
        </text>

        {/* Hardware Status LEDs */}
        <g transform={`translate(${chassisX + chassisW - 95}, ${bezelY + bezelH + 13})`}>
          {/* PWR LED */}
          <circle cx="0" cy="5" r="3.5" fill="#10b981" />
          <text x="7" y="8" fontFamily="Segoe UI, sans-serif" fontSize="7.5" fontWeight="700" fill="#94a3b8">PWR</text>
          
          {/* WiFi LED */}
          <circle cx="36" cy="5" r="3.5" fill={isConnected ? '#0ea5e9' : '#f59e0b'} />
          <text x="43" y="8" fontFamily="Segoe UI, sans-serif" fontSize="7.5" fontWeight="700" fill="#94a3b8">WIFI</text>

          {/* RUN/COMM LED */}
          <circle cx="70" cy="5" r="3.5" fill={isRunning ? '#10b981' : '#64748b'} />
          <text x="77" y="8" fontFamily="Segoe UI, sans-serif" fontSize="7.5" fontWeight="700" fill="#94a3b8">RUN</text>
        </g>

        {/* 3. Nested Vector Touchscreen Display GUI */}
        <svg
          viewBox="0 0 812 588"
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          preserveAspectRatio="none"
        >
          {/* Background */}
          <rect width="812" height="588" fill="url(#guiBgGrad)" />

          {/* Top Header Bar */}
          <rect x="8" y="8" width="796" height="60" rx="6" fill="#03142c" stroke="#103e6b" strokeWidth="1.5" />

          {/* ACE Logo (White rounded badge) */}
          <rect x="18" y="14" width="70" height="48" rx="6" fill="#ffffff" />
          <image href="/images/ace2007_logo.png" x="20" y="16" width="66" height="44" preserveAspectRatio="xMidYMid meet" />

          {/* Title Banner */}
          <rect x="100" y="16" width="456" height="44" rx="8" fill="url(#guiHeaderGrad)" stroke="#38bdf8" strokeWidth="1.5" />
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

          {/* Live Date & Time */}
          <text x="790" y="34" fontFamily="Consolas, monospace" fontSize="15" fontWeight="600" fill="#e2e8f0" textAnchor="end">
            {currentDate || '25/10/2026'}
          </text>
          <text x="790" y="55" fontFamily="Consolas, monospace" fontSize="17" fontWeight="700" fill="#38bdf8" textAnchor="end">
            {currentTime || '20:30:00'}
          </text>

          {/* ── Left Column: Process Channels (PV, SP, OP) ── */}
          <rect x="8" y="74" width="384" height="438" rx="6" fill="#03152a" stroke="#0e3860" strokeWidth="1.5" />
          <rect x="8" y="74" width="384" height="28" rx="6" fill="url(#panelHeaderGrad)" />
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

          {/* PV (Process Variable - Level) */}
          <g transform="translate(18, 108)">
            <rect width="364" height="118" rx="6" fill="#021824" stroke="#10b981" strokeWidth="1.8" />
            <text x="14" y="24" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="800" fill="#34d399">PV</text>
            <text x="44" y="24" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="600" fill="#6ee7b7">IP0 (Level PV)</text>
            <text x="350" y="28" fontFamily="Segoe UI, sans-serif" fontSize="17" fontWeight="700" fill="#a7f3d0" textAnchor="end">%</text>
            
            <text x="250" y="76" fontFamily="Consolas, monospace" fontSize="48" fontWeight="900" fill="#10b981" textAnchor="end">
              {safePv.toFixed(1)}
            </text>
            
            {/* Bar Meter */}
            <rect x="14" y="90" width="336" height="15" rx="3" fill="#072a3a" />
            <rect x="14" y="90" width={pvBarWidth} height="15" rx="3" fill="url(#guiPvGrad)" />
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
            
            {/* Bar Meter */}
            <rect x="14" y="90" width="336" height="15" rx="3" fill="#06233d" />
            <rect x="14" y="90" width={spBarWidth} height="15" rx="3" fill="url(#guiSpGrad)" />
            {/* Target Marker */}
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
            
            {/* Bar Meter */}
            <rect x="14" y="90" width="336" height="15" rx="3" fill="#2d1e02" />
            <rect x="14" y="90" width={opBarWidth} height="15" rx="3" fill="url(#guiOpGrad)" />
          </g>

          {/* ── Right Column: Real-Time Trend Graph ── */}
          <rect x="400" y="74" width="404" height="438" rx="6" fill="#03152a" stroke="#0e3860" strokeWidth="1.5" />
          <rect x="400" y="74" width="404" height="28" rx="6" fill="url(#panelHeaderGrad)" />
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

          {/* Horizontal Grid Lines & Y-Labels */}
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

          {/* Vertical Grid Lines & X-Labels */}
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

          {/* Real-Time Waveform Curves */}
          {trendPaths.spPath && (
            <path d={trendPaths.spPath} fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="5,3" />
          )}
          {trendPaths.opPath && (
            <path d={trendPaths.opPath} fill="none" stroke="#f59e0b" strokeWidth="2.2" />
          )}
          {trendPaths.pvPath && (
            <path d={trendPaths.pvPath} fill="none" stroke="#10b981" strokeWidth="3" />
          )}

          {/* Trend Legend */}
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

            {/* HOME Button */}
            <g transform="translate(14, 9)">
              <rect width="170" height="42" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="85" y="27" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="800" fill="#ffffff" textAnchor="middle">
                ⌂  HOME
              </text>
            </g>

            {/* STATUS Pill */}
            <g transform="translate(210, 9)">
              <rect width="170" height="42" rx="6" fill="#042036" stroke={isRunning ? '#10b981' : '#f59e0b'} strokeWidth="1.2" />
              <circle cx="30" cy="21" r="5" fill={isRunning ? '#10b981' : '#f59e0b'} />
              <text x="96" y="27" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill={isRunning ? '#10b981' : '#f59e0b'} textAnchor="middle">
                {isRunning ? 'RUNNING' : 'STOPPED'}
              </text>
            </g>

            {/* MODE Pill */}
            <g transform="translate(405, 9)">
              <rect width="170" height="42" rx="6" fill="#042036" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="85" y="27" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill="#38bdf8" textAnchor="middle">
                {isAuto ? 'AUTO MODE' : 'MANUAL MODE'}
              </text>
            </g>

            {/* COMM Status Pill */}
            <g transform="translate(600, 9)">
              <rect width="182" height="42" rx="6" fill="#042036" stroke={isConnected ? '#10b981' : '#94a3b8'} strokeWidth="1.2" />
              <circle cx="28" cy="21" r="5" fill={isConnected ? '#10b981' : '#64748b'} />
              <text x="98" y="26" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="700" fill={isConnected ? '#e2e8f0' : '#94a3b8'} textAnchor="middle">
                {isConnected ? 'WiFi DAQ ONLINE' : 'DAQ STANDBY'}
              </text>
            </g>
          </g>
        </svg>

        {/* 4. Photorealistic Bezel Frame Overlay with Screw Holes */}
        <image
          href="/images/ace2007_bezel_frame.png"
          x={bezelX}
          y={bezelY}
          width={bezelW}
          height={bezelH}
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none' }}
        />
      </g>
    </svg>
  );
};
