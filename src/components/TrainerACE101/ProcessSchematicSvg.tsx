import React from 'react';
import './ProcessSchematicSvg.css';

interface ProcessSchematicSvgProps {
  pv: number;
  sp: number;
  op: number;
  isRunning?: boolean;
}

export const ProcessSchematicSvg: React.FC<ProcessSchematicSvgProps> = ({
  pv,
  sp,
  op,
  isRunning = false,
}) => {
  // Clamp values for safety
  const safePv = Math.max(0, Math.min(100, pv));
  const safeSp = Math.max(0, Math.min(100, sp));
  const safeOp = Math.max(0, Math.min(100, op));

  // Level Tank (Process Tank) Geometry from the picture (1024 x 844):
  // Tank cylinder: X from 416 to 599 (Width = 183), Y from 345 to 630 (Total Height = 285)
  const tankTotalHeight = 285;
  const tankWaterHeight = (safePv / 100) * tankTotalHeight;
  const tankBaseY = 630;
  const tankWaterTopY = tankBaseY - tankWaterHeight;

  // ── Supply Pipe Segments (Skipping Control Valve Body and Rotameter Body) ──
  // Segment 1: From Pump connection flange (X=884, Y=739), through lower horizontal pipe, around lower elbow,
  // continuously UP the vertical pipeline (X=958) to upper elbow, and left to Control Valve inlet flange (X=908, Y=415)
  const pipePath1 = 'M 884,739 L 946,739 Q 958,739 958,727 L 958,427 Q 958,415 946,415 L 908,415';

  // Segment 2: Control Valve outlet (starts after CV body at X=804) to Rotameter bottom fitting (stops at Y=385)
  const pipePath2 = 'M 804,415 L 697,415 Q 685,415 685,403 L 685,385';

  // Segment 3: Rotameter top fitting (starts above rotameter at Y=215) to Process Tank top flange (Y=335)
  const pipePath3 = 'M 685,215 L 685,202 Q 685,190 673,190 L 488,190 Q 476,190 476,202 L 476,335';

  const pipeSegments = [pipePath1, pipePath2, pipePath3];

  // ── 3 Drain Line Segments (Process Tank to Supply Tank through Drain Valve - Centered at Y=612) ──
  // Drain 1: Process tank bottom outlet (X=600) to Drain Valve inlet (X=644)
  const drainPath1 = 'M 600,612 L 644,612';

  // Drain 2: Drain Valve outlet (X=672) to elbow, down to table top (Y=645)
  const drainPath2 = 'M 672,612 L 710,612 Q 718,612 718,620 L 718,645';

  // Drain 3: Below table (Y=665) down to drain discharge nozzle (Y=752)
  const drainPath3 = 'M 718,665 L 718,752';

  const drainSegments = [drainPath1, drainPath2, drainPath3];

  // Responsive flow animation duration based on OP (faster when valve is further open)
  const flowSpeed = `${Math.max(0.45, 1.25 - (safeOp / 100) * 0.8).toFixed(2)}s`;

  return (
    <svg
      className="process-scada-svg-root"
      viewBox="0 0 1024 844"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Base Schematic Picture ── */}
      <image
        href="/images/schematic_base.png"
        x="0"
        y="0"
        width="1024"
        height="844"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* ── Volumetric Fluid Flow Animation (Active when Start/isRunning is high) ── */}
      {/* Disconnected over Control Valve, Rotameter, and Table Platform; Active on Supply & Drain */}
      {isRunning && (
        <g className="pump-to-tank-water-flow-group">
          {/* Subtle water glow filter defs */}
          <defs>
            <filter id="fluid-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 2. Disconnected Pipe Fluid Segments */}
          {pipeSegments.map((pathD, idx) => (
            <g key={`pipe-segment-${idx}`} className="pipe-fluid-subsegment">
              {/* Outer Translucent Water Column (liquid body in pipe lumen) */}
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeOpacity="0.42"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Moving Rounded Fluid Slugs (Capsule-shaped liquid pulses) */}
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
                style={{ animationDuration: flowSpeed }}
              />

              {/* Gliding Micro-Bubbles / Sparkling Highlight Droplets */}
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

          {/* 3. Drain Line Fluid Segments (Green Boarded Paths) */}
          {drainSegments.map((pathD, idx) => (
            <g key={`drain-segment-${idx}`} className="pipe-fluid-subsegment">
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

          {/* 4. Drain Discharging into Supply Tank Nozzle (X=718, Y=752 to 780) */}
          <g className="drain-outlet-stream">
            <line
              x1="718"
              y1="752"
              x2="718"
              y2="780"
              stroke="#0284c7"
              strokeWidth="5"
              strokeOpacity="0.45"
              strokeLinecap="round"
            />
            <line
              x1="718"
              y1="752"
              x2="718"
              y2="780"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="fluid-jet-flow"
            />
            <line
              x1="718"
              y1="752"
              x2="718"
              y2="780"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="fluid-jet-bubbles"
            />
            <ellipse
              cx="718"
              cy="780"
              rx="11"
              ry="3.5"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="1.8"
              className="fluid-ripple-1"
            />
          </g>

          {/* 5. Water Stream Pouring into Process Tank from Top Flange (Y=335) to Water Surface */}
          {tankWaterTopY > 340 && (
            <g className="tank-inlet-stream">
              {/* Base falling fluid column */}
              <line
                x1="476"
                y1="335"
                x2="476"
                y2={tankWaterTopY}
                stroke="#0284c7"
                strokeWidth="6"
                strokeOpacity="0.48"
                strokeLinecap="round"
              />
              {/* Falling fluid pulses */}
              <line
                x1="476"
                y1="335"
                x2="476"
                y2={tankWaterTopY}
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                className="fluid-jet-flow"
              />
              {/* Sparkling droplet beads */}
              <line
                x1="476"
                y1="335"
                x2="476"
                y2={tankWaterTopY}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                className="fluid-jet-bubbles"
              />
              {/* Dual Concentric Surface Ripples at impact */}
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

      {/* ── 1. Level Tank: 25% Transparent Blue Rectangular Bar (Linked with PV) ── */}
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

      {/* ── 2. Display Digits: Exactly Over Existing Digits on Picture ── */}
      {/* Black panel covering the static digits */}
      <rect
        x="170"
        y="88"
        width="182"
        height="238"
        fill="#000000"
      />

      {/* PV: SVGFont1, 34pt scale, bright lime-green */}
      <text
        x="345"
        y="148"
        className="dtb-led-pv"
        textAnchor="end"
      >
        {safePv.toFixed(1)}
      </text>

      {/* SP: SVGFont1, 24pt scale, Blue */}
      <text
        x="345"
        y="222"
        className="dtb-led-sp"
        textAnchor="end"
      >
        {safeSp.toFixed(1)}
      </text>

      {/* CO (OP): SVGFont1, 24pt scale, Red */}
      <text
        x="345"
        y="300"
        className="dtb-led-op"
        textAnchor="end"
      >
        {safeOp.toFixed(1)}
      </text>
    </svg>
  );
};
