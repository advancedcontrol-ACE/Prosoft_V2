import React from 'react';
import '../TrainerACE101/ProcessSchematicSvg.css';
import { Ace2007ScreenSvg } from './Ace2007ScreenSvg';
import schematicAce106Img from '../../assets/schematic_ace106.jpg';

interface ProcessSchematic106SvgProps {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
  isAuto?: boolean;
  isConnected?: boolean;
}

export const ProcessSchematic106Svg: React.FC<ProcessSchematic106SvgProps> = ({
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

  // Active pumping condition: active ONLY when running
  const isPumping = isRunning;

  // ── Level Tank Geometry (1024 x 850) ─────────────────────────────────
  const tankTotalHeight = 235; // from base Y=630 to top flange Y=395
  const tankWaterHeight = (safePv / 100) * tankTotalHeight;
  const tankBaseY = 630;
  const tankWaterTopY = tankBaseY - tankWaterHeight;

  // ── Supply Pipe Segments from Pump to Tank ────────────────────────────
  // Excludes Control Valve, Rotameter, and Drain Valve as requested
  // Segment 0: Pump connection (X=888, Y=733) to below table (Y=664)
  const pipePath0 = 'M 888,733 L 968,733 Q 980,733 980,721 L 980,664';
  // Segment 1: Above table (Y=638) to Control Valve inlet flange (stops cleanly at X=920, Y=434)
  const pipePath1 = 'M 980,638 L 980,446 Q 980,434 968,434 L 920,434';
  // Segment 2: Starts AFTER Control Valve at X=842 to Rotameter bottom fitting (stops cleanly at Y=400)
  const pipePath2 = 'M 842,434 L 734,434 Q 722,434 722,422 L 722,400';
  // Segment 3: Starts AFTER Rotameter top at Y=230 to Process Tank top flange (Y=385)
  const pipePath3 = 'M 722,230 L 722,216 Q 722,204 710,204 L 567,204 Q 555,204 555,216 L 555,385';

  const pipeSegments = [pipePath0, pipePath1, pipePath2, pipePath3];

  // ── Drain Line Segments (Process Tank to Supply Tank through Drain Valve - Centered at Y=607) ──
  // Drain 1: Process tank bottom outlet (X=652) to Drain Valve inlet (X=692)
  const drainPath1 = 'M 652,607 L 692,607';

  // Drain 2: Drain Valve outlet (starts at X=735 after valve body) to elbow, down to table top (Y=645)
  const drainPath2 = 'M 735,607 L 760,607 Q 770,607 770,617 L 770,645';

  // Drain 3: Below table (Y=665) down to drain discharge nozzle collar (Y=712)
  const drainPath3 = 'M 770,665 L 770,712';

  const drainSegments = [drainPath1, drainPath2, drainPath3];

  const flowSpeed = `${Math.max(0.35, 1.25 - (safeOp / 100) * 0.85).toFixed(2)}s`;

  // ── Screen aperture on the physical 3D module (1024 x 850) ───────────
  const screenX = 52;
  const screenY = 101;
  const screenW = 324;
  const screenH = 256;

  return (
    <svg
      className="process-scada-svg-root"
      viewBox="0 0 1024 850"
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
      </defs>

      {/* ── Base Schematic Picture (ACE 106 3D Apparatus) ── */}
      <image
        href={schematicAce106Img}
        x="0"
        y="0"
        width="1024"
        height="850"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* ── 1. Level Tank: 25% Transparent Blue Rectangular Bar (Linked with PV, exact match to ACE 101) ── */}
      {safePv > 0 && (
        <g className="level-tank-water-group">
          <rect
            x="480"
            y={tankWaterTopY}
            width="172"
            height={tankWaterHeight}
            fill="#1e60ff"
            fillOpacity="0.75"
          />
          <line
            x1="480"
            y1={tankWaterTopY}
            x2="652"
            y2={tankWaterTopY}
            stroke="#70b5ff"
            strokeWidth="2.5"
          />
        </g>
      )}

      {/* ── 1. Line Animation from Pump to Tank (Excluding Control Valve, Rotameter, Drain Valve) ── */}
      {isPumping && (
        <g className="pump-to-tank-water-flow-group">
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

          {/* 2. Drain Line Fluid Segments */}
          {drainSegments.map((pathD, idx) => (
            <g key={`drain-segment-106-${idx}`} className="pipe-fluid-subsegment">
              {/* Outer Translucent Water Column */}
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeOpacity="0.42"
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
                style={{ animationDuration: '0.85s' }}
              />

              {/* Luminous Core Stream Highlights */}
              <path
                d={pathD}
                fill="none"
                stroke="#bae6fd"
                strokeWidth="2.5"
                strokeOpacity="0.95"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fluid-slugs"
                style={{ animationDuration: '0.85s' }}
              />

              {/* Sparkling Droplets */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeOpacity="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fluid-bubbles"
                style={{ animationDuration: '0.85s' }}
              />
            </g>
          ))}

          {/* Submersible Pump Discharge Glow */}
          <circle
            cx="888"
            cy="733"
            r="22"
            fill="#38bdf8"
            fillOpacity="0.22"
            className="pump-discharge-glow"
          />

          {/* Water Stream Pouring into Process Tank */}
          {tankWaterTopY > 392 && (
            <g className="tank-inlet-stream">
              <line
                x1="555"
                y1="385"
                x2="555"
                y2={tankWaterTopY}
                stroke="#0284c7"
                strokeWidth="6"
                strokeOpacity="0.48"
                strokeLinecap="round"
              />
              <line
                x1="555"
                y1="385"
                x2="555"
                y2={tankWaterTopY}
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                className="fluid-jet-flow"
              />
              <line
                x1="555"
                y1="385"
                x2="555"
                y2={tankWaterTopY}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                className="fluid-jet-bubbles"
              />
              <ellipse
                cx="555"
                cy={tankWaterTopY}
                rx="14"
                ry="4"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="2"
                className="fluid-ripple-1"
              />
              <ellipse
                cx="555"
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

      {/* ── 2 & 3. ACE 2007 DAQ Display: Row 1 PV/SP/OP live, Row 2 --- ── */}
      <svg
        x={screenX}
        y={screenY}
        width={screenW}
        height={screenH}
        viewBox="0 0 324 256"
        preserveAspectRatio="none"
      >
        <Ace2007ScreenSvg
          pv={safePv}
          sp={safeSp}
          op={safeOp}
          isRunning={isRunning}
          isAuto={isAuto}
          isConnected={isConnected}
          showFrame={false}
        />
      </svg>
    </svg>
  );
};
