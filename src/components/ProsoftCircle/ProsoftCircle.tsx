import React from 'react';
import './ProsoftCircle.css';

/**
 * ProsoftCircle
 * Pure-SVG recreation of the four-quadrant Prosoft illustration.
 *
 * Screenshot analysis:
 *   Top-left   — blue        — "Process"
 *   Top-right  — green/teal  — "Controller Design"
 *   Bot-right  — orange      — "Modelling & Simulation"
 *   Bot-left   — dark navy   — "Software"
 *
 * Central white disc with bidirectional circular arrows.
 * "Prosoft" in large white bold text to the right of the circle.
 * "Software" label also appears in large white text to the left (matching screenshot).
 */
const ProsoftCircle: React.FC = () => {
  const R  = 108;   // circle radius
  const CX = 130;   // circle centre X
  const CY = 118;   // circle centre Y

  // Arc helper: returns SVG path for a quarter-circle sector
  const sector = (startDeg: number, endDeg: number): string => {
    const toR = (d: number) => (d * Math.PI) / 180;
    const x1 = CX + R * Math.cos(toR(startDeg));
    const y1 = CY + R * Math.sin(toR(startDeg));
    const x2 = CX + R * Math.cos(toR(endDeg));
    const y2 = CY + R * Math.sin(toR(endDeg));
    return `M ${CX},${CY} L ${x1},${y1} A ${R},${R} 0 0,1 ${x2},${y2} Z`;
  };

  const viewW = 500;
  const viewH = 240;

  return (
    <div className="prosoft-wrapper" aria-label="Prosoft process-control cycle diagram">
      <svg
        className="prosoft-svg"
        viewBox={`0 0 ${viewW} ${viewH}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Large "Software" label — bottom-left (outside circle, like screenshot) ── */}
        <text
          x={CX - R - 4}
          y={CY + 70}
          textAnchor="middle"
          fill="white"
          fontSize="22"
          fontWeight="bold"
          fontFamily="Segoe UI, Arial, sans-serif"
        >Software</text>

        {/* ── Four quadrant sectors ──────────────────────────────── */}
        {/* Top-left: Process — blue (270° → 360°, i.e. left half top) */}
        <path d={sector(180, 270)} fill="#1565c0" />
        {/* Top-right: Controller Design — green */}
        <path d={sector(270, 360)} fill="#2e7d32" />
        {/* Bottom-right: Modelling & Simulation — orange */}
        <path d={sector(0, 90)}   fill="#e65100" />
        {/* Bottom-left: Software — dark navy */}
        <path d={sector(90, 180)} fill="#0d1b5e" />

        {/* ── Divider lines ──────────────────────────────────────── */}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R}
              stroke="white" strokeWidth="2.5" />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY}
              stroke="white" strokeWidth="2.5" />

        {/* ── Central white disc ─────────────────────────────────── */}
        <circle cx={CX} cy={CY} r={38} fill="white" />

        {/* ── Circular arrows (clockwise top arc) ───────────────── */}
        {/* Top arc — clockwise */}
        <path
          d={`M ${CX - 26},${CY} A 26,26 0 0,1 ${CX + 26},${CY}`}
          fill="none" stroke="#444" strokeWidth="3.5" strokeLinecap="round"
        />
        {/* Arrowhead at right end of top arc */}
        <polygon
          points="0,-5 5,5 -5,5"
          fill="#444"
          transform={`translate(${CX + 26},${CY}) rotate(-90)`}
        />

        {/* Bottom arc — clockwise continues */}
        <path
          d={`M ${CX + 26},${CY} A 26,26 0 0,1 ${CX - 26},${CY}`}
          fill="none" stroke="#444" strokeWidth="3.5" strokeLinecap="round"
        />
        {/* Arrowhead at left end of bottom arc */}
        <polygon
          points="0,-5 5,5 -5,5"
          fill="#444"
          transform={`translate(${CX - 26},${CY}) rotate(90)`}
        />

        {/* ── Quadrant text labels ──────────────────────────────── */}
        {/* Process — top-left quadrant */}
        <text
          x={CX - 52} y={CY - 22}
          textAnchor="middle" fill="white"
          fontSize="14" fontWeight="bold"
          fontFamily="Segoe UI, Arial, sans-serif"
        >Process</text>

        {/* Controller Design — top-right quadrant */}
        <text x={CX + 58} y={CY - 20} textAnchor="middle" fill="white"
              fontSize="12" fontWeight="bold"
              fontFamily="Segoe UI, Arial, sans-serif">Controller</text>
        <text x={CX + 58} y={CY - 7} textAnchor="middle" fill="white"
              fontSize="12" fontWeight="bold"
              fontFamily="Segoe UI, Arial, sans-serif">Design</text>

        {/* Modelling & Simulation — bottom-right quadrant */}
        <text x={CX + 56} y={CY + 20} textAnchor="middle" fill="white"
              fontSize="12" fontWeight="bold"
              fontFamily="Segoe UI, Arial, sans-serif">Modelling &amp;</text>
        <text x={CX + 56} y={CY + 33} textAnchor="middle" fill="white"
              fontSize="12" fontWeight="bold"
              fontFamily="Segoe UI, Arial, sans-serif">Simulation</text>

        {/* Software — bottom-left (small label inside sector) */}
        {/* main label is outside, just keep a subtle indicator inside */}

        {/* ── "Prosoft" text — right of circle ─────────────────── */}
        <text
          x={CX + R + 24}
          y={CY + 16}
          textAnchor="start"
          fill="white"
          fontSize="46"
          fontWeight="bold"
          fontFamily="Segoe UI, Arial, sans-serif"
          letterSpacing="1"
        >Prosoft</text>
      </svg>
    </div>
  );
};

export default ProsoftCircle;
