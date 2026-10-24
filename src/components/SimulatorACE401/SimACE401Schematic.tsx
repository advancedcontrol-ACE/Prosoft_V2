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

  // ── 3 Disconnected Supply Pipe Segments (Skipping Control Valve, Rotameter, and Table Platform) ──
  // Segment 1: Above table edge (Y=625) up to Control Valve inlet (stops before CV body at X=896)
  const pipePath1 = 'M 954,625 L 954,422 Q 954,412 944,412 L 896,412';

  // Segment 2: Control Valve outlet (starts after CV body at X=806) to Rotameter bottom fitting (stops at Y=395)
  const pipePath2 = 'M 806,412 L 694,412 Q 684,412 684,402 L 684,395';

  // Segment 3: Rotameter top fitting (starts above rotameter at Y=215) to Process Tank top flange (Y=335)
  const pipePath3 = 'M 684,215 L 684,198 Q 684,188 674,188 L 487,188 Q 477,188 477,198 L 477,335';

  const pipeSegments = [pipePath1, pipePath2, pipePath3];

  // ── 3 Drain Line Segments (Process Tank to Supply Tank through Drain Valve - Green Boarded) ──
  // Drain 1: Process tank bottom outlet (X=600) to Drain Valve inlet (X=646)
  const drainPath1 = 'M 600,625 L 646,625';

  // Drain 2: Drain Valve outlet (X=674) to elbow, down to table top (Y=645)
  const drainPath2 = 'M 674,625 L 714,625 Q 722,625 722,633 L 722,645';

  // Drain 3: Below table (Y=665) down to drain discharge nozzle (Y=752)
  const drainPath3 = 'M 722,665 L 722,752';

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

              {/* Drain Discharging into Supply Tank Nozzle */}
              <g className="drain-outlet-stream">
                <line
                  x1="722"
                  y1="752"
                  x2="722"
                  y2="780"
                  stroke="#0284c7"
                  strokeWidth="5"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />
                <line
                  x1="722"
                  y1="752"
                  x2="722"
                  y2="780"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="fluid-jet-flow"
                />
                <line
                  x1="722"
                  y1="752"
                  x2="722"
                  y2="780"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="fluid-jet-bubbles"
                />
                <ellipse
                  cx="722"
                  cy="780"
                  rx="11"
                  ry="3.5"
                  fill="none"
                  stroke="#7dd3fc"
                  strokeWidth="1.8"
                  className="fluid-ripple-1"
                />
              </g>

              {/* Water Stream Pouring into Process Tank */}
              {tankWaterTopY > 340 && (
                <g className="tank-inlet-stream">
                  <line
                    x1="477"
                    y1="335"
                    x2="477"
                    y2={tankWaterTopY}
                    stroke="#0284c7"
                    strokeWidth="6"
                    strokeOpacity="0.48"
                    strokeLinecap="round"
                  />
                  <line
                    x1="477"
                    y1="335"
                    x2="477"
                    y2={tankWaterTopY}
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="fluid-jet-flow"
                  />
                  <line
                    x1="477"
                    y1="335"
                    x2="477"
                    y2={tankWaterTopY}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="fluid-jet-bubbles"
                  />
                  <ellipse
                    cx="477"
                    cy={tankWaterTopY}
                    rx="14"
                    ry="4"
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="2"
                    className="fluid-ripple-1"
                  />
                  <ellipse
                    cx="477"
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
