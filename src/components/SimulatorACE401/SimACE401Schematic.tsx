import React from 'react';
import '../TrainerACE101/ProcessSchematicSvg.css';
import './SimACE401Schematic.css';

interface SimACE401SchematicProps {
  pv: number;
  sp: number;
  op: number;
  isRunning: boolean;
  currentTimeStr: string;
}

export const SimACE401Schematic: React.FC<SimACE401SchematicProps> = ({
  pv,
  sp,
  op,
  isRunning,
  currentTimeStr,
}) => {
  const safePv = Math.max(0, Math.min(100, pv));
  const safeSp = Math.max(0, Math.min(100, sp));
  const safeOp = Math.max(0, Math.min(100, op));

  // Tank water height calculation
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
  // Drain 1: Process tank bottom outlet (X=600) to Drain Valve inlet (X=642)
  const drainPath1 = 'M 600,612 L 642,612';

  // Drain 2: Drain Valve outlet (starts at X=690 after valve collar) to elbow, down to table top (Y=645)
  const drainPath2 = 'M 690,612 L 710,612 Q 718,612 718,620 L 718,645';

  // Drain 3: Below table (Y=665) down to drain discharge nozzle (ends right at nozzle rim Y=748)
  const drainPath3 = 'M 718,665 L 718,748';

  const drainSegments = [drainPath1, drainPath2, drainPath3];

  const flowSpeed = `${Math.max(0.45, 1.25 - (safeOp / 100) * 0.8).toFixed(2)}s`;

  return (
    <div className="sim401-schematic-card">
      <div className="sim401-schematic-svg-container">
        <svg
          className="sim401-schematic-svg"
          viewBox="0 0 1024 844"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Schematic Background */}
          <image
            href="/images/schematic_base.png"
            x="0"
            y="0"
            width="1024"
            height="844"
            preserveAspectRatio="xMidYMid meet"
          />

          {/* ── Volumetric Fluid Flow Animation (Active when Start/isRunning is high) ── */}
          {isRunning && (
            <g className="pump-to-tank-water-flow-group">
              <defs>
                <filter id="fluid-glow-401" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Supply Pipe Fluid Segments */}
              {pipeSegments.map((pathD, idx) => (
                <g key={`pipe-segment-401-${idx}`} className="pipe-fluid-subsegment">
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="7"
                    strokeOpacity="0.42"
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
                    filter="url(#fluid-glow-401)"
                    className="fluid-slugs"
                    style={{ animationDuration: flowSpeed }}
                  />
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

              {/* Drain Line Fluid Segments */}
              {drainSegments.map((pathD, idx) => (
                <g key={`drain-segment-401-${idx}`} className="pipe-fluid-subsegment">
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="7"
                    strokeOpacity="0.42"
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
                    filter="url(#fluid-glow-401)"
                    className="fluid-slugs"
                    style={{ animationDuration: '0.85s' }}
                  />
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

              {/* Water Stream Pouring into Process Tank */}
              {tankWaterTopY > 340 && (
                <g className="tank-inlet-stream">
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

          {/* Level Tank Water Fill */}
          {safePv > 0 && (
            <g className="sim401-tank-water">
              <rect
                x="416"
                y={tankWaterTopY}
                width="183"
                height={tankWaterHeight}
                fill="#1e60ff"
                fillOpacity="0.75"
              />
              {/* Water surface line */}
              <line
                x1="416"
                y1={tankWaterTopY}
                x2="599"
                y2={tankWaterTopY}
                stroke="#93c5fd"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* DTB9696 Controller Display Digits Backdrop (covers static numbers, preserves PV/SP/OP labels) */}
          <rect
            x="232"
            y="92"
            width="120"
            height="228"
            fill="#000000"
          />

          {/* PV: Lime Green Digits (Fitting frame as in Figure 1) */}
          <text
            x="344"
            y="142"
            className="sim401-led-pv"
            textAnchor="end"
          >
            {safePv.toFixed(1)}
          </text>

          {/* SP: Sky Blue Digits (Shifted up to close gap and align with SP slot) */}
          <text
            x="344"
            y="204"
            className="sim401-led-sp"
            textAnchor="end"
          >
            {safeSp.toFixed(1)}
          </text>

          {/* OP: Vivid Red Digits (Shifted up to close gap and align with OP slot) */}
          <text
            x="344"
            y="268"
            className="sim401-led-op"
            textAnchor="end"
          >
            {safeOp.toFixed(1)}
          </text>

          {/* OUT1 LED (illuminated when pump/valve active) */}
          {isRunning && safeOp > 0 && (
            <circle
              cx="149"
              cy="367"
              r="4.5"
              fill="#22c55e"
              filter="drop-shadow(0 0 4px #22c55e)"
            />
          )}
        </svg>
      </div>

      {/* Clock Capsule Pill at bottom left (matching Figure 4) */}
      <div className="sim401-schematic-footer">
        <div className="sim401-clock-pill">
          <span className="sim401-clock-icon">🕒</span>
          <span className="sim401-clock-text">{currentTimeStr}</span>
        </div>
      </div>
    </div>
  );
};
