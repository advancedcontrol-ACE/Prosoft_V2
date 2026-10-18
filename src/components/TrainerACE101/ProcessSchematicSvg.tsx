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
