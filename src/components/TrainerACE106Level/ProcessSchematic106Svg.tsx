import React, { useState, useEffect } from 'react';
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

  // Active pumping condition: active whenever running OR whenever valve output is applied
  const isPumping = isRunning || safeOp > 0;

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

  // ── Level Tank Geometry (1024 x 844) ─────────────────────────────────
  const tankTotalHeight = 285;
  const tankWaterHeight = (safePv / 100) * tankTotalHeight;
  const tankBaseY = 630;
  const tankWaterTopY = tankBaseY - tankWaterHeight;

  // ── Supply Pipe Segments ─────────────────────────────────────────────
  // Segment 0: Pump connection flange (X=884, Y=739) to below table (Y=664)
  const pipePath0 = 'M 884,739 L 946,739 Q 958,739 958,727 L 958,664';
  // Segment 1: Above table (Y=638) to Control Valve inlet (X=908, Y=415)
  const pipePath1 = 'M 958,638 L 958,427 Q 958,415 946,415 L 908,415';
  // Segment 1b: Through Control Valve body
  const pipePathValve = 'M 908,415 L 804,415';
  // Segment 2: Control Valve outlet (X=804) to Rotameter bottom fitting (Y=385)
  const pipePath2 = 'M 804,415 L 697,415 Q 685,415 685,403 L 685,385';
  // Segment 3: Rotameter top (Y=215) to Process Tank top flange (Y=312)
  const pipePath3 = 'M 685,215 L 685,202 Q 685,190 673,190 L 488,190 Q 476,190 476,202 L 476,312';

  const pipeSegments = [pipePath0, pipePath1, pipePathValve, pipePath2, pipePath3];

  // Rotameter float position (bottom=372, top=230)
  const rotameterFloatY = 372 - (safeOp / 100) * 140;

  // ── Drain Line Segments ──────────────────────────────────────────────
  const drainPath1 = 'M 600,612 L 642,612';
  const drainPath2 = 'M 690,612 L 710,612 Q 718,612 718,620 L 718,645';
  const drainPath3 = 'M 718,665 L 718,715';
  const drainSegments = [drainPath1, drainPath2, drainPath3];

  const flowSpeed = `${Math.max(0.35, 1.25 - (safeOp / 100) * 0.85).toFixed(2)}s`;

  // ── ACE 2007 Hardware Dimensions & Coordinates ───────────────────────
  // Chassis height adjusted to 308 to snugly frame the bezel without the lower box
  const chassisX = 40;
  const chassisY = 48;
  const chassisW = 372;
  const chassisH = 308;

  const bezelX = 45;
  const bezelY = 56;
  const bezelW = 362;
  const bezelH = 294;

  // Screen inside bezel (106..918 / 1024, 118..706 / 832)
  const screenX = bezelX + bezelW * (106 / 1024);
  const screenY = bezelY + bezelH * (118 / 832);
  const screenW = bezelW * (812 / 1024);
  const screenH = bezelH * (588 / 832);

  // Bar gauge widths (out of 240px in each card)
  const pvBarWidth = Math.max(0, Math.min(240, (safePv / 100) * 240));
  const spBarWidth = Math.max(0, Math.min(240, (safeSp / 100) * 240));
  const opBarWidth = Math.max(0, Math.min(240, (safeOp / 100) * 240));

  return (
    <svg
      className="process-scada-svg-root"
      viewBox="0 0 1024 844"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Fluid Glow Filter */}
        <filter id="fluid-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="fluid-glow-106" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Chassis Gradients */}
        <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e2530" />
          <stop offset="50%" stopColor="#141922" />
          <stop offset="100%" stopColor="#0e1218" />
        </linearGradient>

        {/* Screen GUI Gradients */}
        <linearGradient id="guiBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020b18" />
          <stop offset="100%" stopColor="#061730" />
        </linearGradient>

        <linearGradient id="guiHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Channel Card Gradients */}
        <linearGradient id="pvCardHeader" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>

        <linearGradient id="spCardHeader" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#042337" />
        </linearGradient>

        <linearGradient id="opCardHeader" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#3d1a03" />
        </linearGradient>

        <linearGradient id="guiPvGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id="guiSpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="guiOpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
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

      {/* ── Fluid Flow Animation (Active when running or safeOp > 0) ── */}
      {isPumping && (
        <g className="pump-to-tank-water-flow-group">
          {/* 1. Pipe Fluid Segments */}
          {pipeSegments.map((pathD, idx) => (
            <g key={`pipe-segment-106-${idx}`} className="pipe-fluid-subsegment">
              {/* Outer Translucent Water Column */}
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeOpacity="0.45"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Moving Fluid Slugs */}
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4.5"
                strokeOpacity="0.88"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#fluid-glow)"
                className="fluid-slugs"
                style={{ animationDuration: flowSpeed }}
              />
              {/* Core Stream Highlights */}
              <path
                d={pathD}
                fill="none"
                stroke="#bae6fd"
                strokeWidth="2.5"
                strokeOpacity="0.95"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fluid-slugs"
                style={{ animationDuration: flowSpeed }}
              />
              {/* Sparkling Micro-Bubbles */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeOpacity="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fluid-bubbles"
                style={{ animationDuration: flowSpeed }}
              />
            </g>
          ))}

          {/* 2. Drain Line Segments */}
          {drainSegments.map((pathD, idx) => (
            <g key={`drain-segment-106-${idx}`} className="drain-fluid-subsegment">
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeOpacity="0.45"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4.5"
                strokeOpacity="0.88"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#fluid-glow)"
                className="fluid-slugs"
                style={{ animationDuration: '0.85s' }}
              />
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeOpacity="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fluid-bubbles"
                style={{ animationDuration: '0.85s' }}
              />
            </g>
          ))}

          {/* 3. Rotameter Fluid Column & Animated Red Float */}
          {safeOp > 0 && (
            <g className="rotameter-animation-group">
              {/* Water column inside glass tube */}
              <rect
                x="679"
                y={rotameterFloatY}
                width="12"
                height={Math.max(2, 380 - rotameterFloatY)}
                fill="#38bdf8"
                fillOpacity="0.42"
                rx="2"
              />
              {/* Tapered Float */}
              <polygon
                points={`677,${rotameterFloatY} 693,${rotameterFloatY} 688,${rotameterFloatY + 12} 682,${rotameterFloatY + 12}`}
                fill="#ef4444"
                stroke="#991b1b"
                strokeWidth="1.2"
                className="rotameter-float"
              />
              {/* Metallic Highlight line */}
              <line
                x1="679"
                y1={rotameterFloatY + 3}
                x2="691"
                y2={rotameterFloatY + 3}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* 4. Submersible Pump Discharge Glow at bottom right */}
          <circle
            cx="836"
            cy="736"
            r="26"
            fill="#38bdf8"
            fillOpacity="0.22"
            className="pump-discharge-glow"
          />

          {/* 5. Water Stream Pouring into Process Tank */}
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

      {/* ── Level Tank Water Column (Linked with PV) ── */}
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

      {/* ── ACE 2007 HARDWARE MODULE & DISPLAY (Clean Panel Bezel) ── */}
      <g
        className="ace2007-daq-unit-group"
        onClick={onOpenHmiModal}
        style={{ cursor: onOpenHmiModal ? 'pointer' : 'default' }}
      >
        <title>ACE 2007 WiFi DAQ Module (Click to Enlarge Touchscreen)</title>

        {/* 1. Heavy Industrial Enclosure Chassis (Snugly wraps Bezel, covering old DTB) */}
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

        {/* 2. Embedded TFT Screen Display (viewBox 0 0 812 588) */}
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

          {/* ── Top Header Bar ── */}
          <rect x="8" y="8" width="796" height="60" rx="6" fill="#03142c" stroke="#103e6b" strokeWidth="1.5" />

          {/* ACE Logo Badge */}
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
            {currentTime || '23:30:00'}
          </text>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* ── CARD 1: PV (Process Variable - Level) ── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <g transform="translate(8, 76)">
            {/* Card Outer */}
            <rect width="796" height="136" rx="8" fill="#021422" stroke="#10b981" strokeWidth="2" />
            <rect width="796" height="26" rx="8" fill="url(#pvCardHeader)" />

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
              {/* Track */}
              <rect x="0" y="24" width="236" height="26" rx="5" fill="#042030" stroke="#064e3b" strokeWidth="1.5" />
              {/* Active Bar */}
              <rect x="0" y="24" width={pvBarWidth} height="26" rx="5" fill="url(#guiPvGrad)" />
              {/* Ticks */}
              <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#a7f3d0" textAnchor="middle">
                <text x="0" y="64">0%</text>
                <text x="59" y="64">25%</text>
                <text x="118" y="64">50%</text>
                <text x="177" y="64">75%</text>
                <text x="236" y="64">100%</text>
              </g>
              {/* Live readout */}
              <text x="236" y="80" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fontWeight="700" fill="#10b981" textAnchor="end">
                TANK LEVEL: {safePv.toFixed(1)} %
              </text>
            </g>
          </g>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* ── CARD 2: SP (Target Set Point) ── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <g transform="translate(8, 222)">
            {/* Card Outer */}
            <rect width="796" height="136" rx="8" fill="#021528" stroke="#0ea5e9" strokeWidth="2" />
            <rect width="796" height="26" rx="8" fill="url(#spCardHeader)" />

            {/* Left Label & Tag */}
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

            {/* Center Recessed Digital Display */}
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

            {/* Right Analog Bar Gauge */}
            <g transform="translate(548, 38)">
              <text x="0" y="14" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#7dd3fc">
                TARGET SETTING GAUGE (0 - 100%)
              </text>
              {/* Track */}
              <rect x="0" y="24" width="236" height="26" rx="5" fill="#052844" stroke="#0284c7" strokeWidth="1.5" />
              {/* Active Bar */}
              <rect x="0" y="24" width={spBarWidth} height="26" rx="5" fill="url(#guiSpGrad)" />
              {/* Needle pointer */}
              <polygon
                points={`${spBarWidth - 6},20 ${spBarWidth + 6},20 ${spBarWidth},28`}
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="1"
              />
              {/* Ticks */}
              <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#bae6fd" textAnchor="middle">
                <text x="0" y="64">0%</text>
                <text x="59" y="64">25%</text>
                <text x="118" y="64">50%</text>
                <text x="177" y="64">75%</text>
                <text x="236" y="64">100%</text>
              </g>
              {/* Live readout */}
              <text x="236" y="80" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fontWeight="700" fill="#38bdf8" textAnchor="end">
                SETPOINT: {safeSp.toFixed(1)} %
              </text>
            </g>
          </g>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* ── CARD 3: OP (Controller Output - Valve) ── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <g transform="translate(8, 368)">
            {/* Card Outer */}
            <rect width="796" height="136" rx="8" fill="#1f1502" stroke="#f59e0b" strokeWidth="2" />
            <rect width="796" height="26" rx="8" fill="url(#opCardHeader)" />

            {/* Left Label & Tag */}
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

            {/* Center Recessed Digital Display */}
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

            {/* Right Analog Bar Gauge */}
            <g transform="translate(548, 38)">
              <text x="0" y="14" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#fde68a">
                VALVE OPENING GAUGE (0 - 100%)
              </text>
              {/* Track */}
              <rect x="0" y="24" width="236" height="26" rx="5" fill="#2d1c02" stroke="#b45309" strokeWidth="1.5" />
              {/* Active Bar */}
              <rect x="0" y="24" width={opBarWidth} height="26" rx="5" fill="url(#guiOpGrad)" />
              {/* Ticks */}
              <g fontFamily="Consolas, monospace" fontSize="10.5" fill="#fde68a" textAnchor="middle">
                <text x="0" y="64">0%</text>
                <text x="59" y="64">25%</text>
                <text x="118" y="64">50%</text>
                <text x="177" y="64">75%</text>
                <text x="236" y="64">100%</text>
              </g>
              {/* Live readout */}
              <text x="236" y="80" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fontWeight="700" fill="#f59e0b" textAnchor="end">
                {safeOp > 0 ? (safeOp >= 100 ? 'VALVE: 100% FULL OPEN' : `VALVE: ${safeOp.toFixed(1)}% OPEN`) : 'VALVE: 0.0% CLOSED'}
              </text>
            </g>
          </g>

          {/* ── Bottom Navigation & Status Bar ── */}
          <g transform="translate(8, 516)">
            <rect width="796" height="62" rx="6" fill="#03142c" stroke="#103e6b" strokeWidth="1.5" />

            {/* HOME Button */}
            <g transform="translate(14, 9)">
              <rect width="170" height="44" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="85" y="28" fontFamily="Segoe UI, sans-serif" fontSize="16" fontWeight="800" fill="#ffffff" textAnchor="middle">
                ⌂  HOME
              </text>
            </g>

            {/* STATUS Pill */}
            <g transform="translate(210, 9)">
              <rect width="170" height="44" rx="6" fill="#042036" stroke={isPumping ? '#10b981' : '#f59e0b'} strokeWidth="1.2" />
              <circle cx="28" cy="22" r="5" fill={isPumping ? '#10b981' : '#f59e0b'} />
              <text x="96" y="28" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill={isPumping ? '#10b981' : '#f59e0b'} textAnchor="middle">
                {isPumping ? 'PUMP RUNNING' : 'PUMP STOPPED'}
              </text>
            </g>

            {/* MODE Pill */}
            <g transform="translate(405, 9)">
              <rect width="170" height="44" rx="6" fill="#042036" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="85" y="28" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="700" fill="#38bdf8" textAnchor="middle">
                {isAuto ? 'AUTO MODE' : 'MANUAL MODE'}
              </text>
            </g>

            {/* COMM Status Pill */}
            <g transform="translate(600, 9)">
              <rect width="182" height="44" rx="6" fill="#042036" stroke={isConnected ? '#10b981' : '#94a3b8'} strokeWidth="1.2" />
              <circle cx="28" cy="22" r="5" fill={isConnected ? '#10b981' : '#64748b'} />
              <text x="98" y="27" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="700" fill={isConnected ? '#e2e8f0' : '#94a3b8'} textAnchor="middle">
                {isConnected ? 'ACE 2007 ONLINE' : 'DISCONNECTED'}
              </text>
            </g>
          </g>
        </svg>

        {/* 3. Photorealistic Bezel Frame Overlay with Screw Holes */}
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
