import React from 'react';
import './ProcessSchematicSvg.css';

interface ProcessSchematicSvgProps {
  pv: number;
  sp: number;
  op: number;
  isRunning: boolean;
}

export const ProcessSchematicSvg: React.FC<ProcessSchematicSvgProps> = ({
  pv,
  sp,
  op,
  isRunning,
}) => {
  // Clamp values for safety
  const safePv = Math.max(0, Math.min(100, pv));
  const safeSp = Math.max(0, Math.min(100, sp));
  const safeOp = Math.max(0, Math.min(100, op));

  // Process Tank Water Calculation
  const tankTotalHeight = 205;
  const tankWaterHeight = (safePv / 100) * tankTotalHeight;
  const tankBaseY = 540;
  const tankWaterTopY = tankBaseY - tankWaterHeight;

  // Flow animation class based on OP
  const isFlowing = isRunning && safeOp > 0.5;
  const flowSpeedClass = safeOp > 65 ? 'fast' : safeOp > 25 ? 'medium' : 'slow';

  // Rotameter Float Position (travels up as OP increases)
  const floatMaxTravel = 85;
  const floatYOffset = -(safeOp / 100) * floatMaxTravel;

  // Valve Stem Travel (moves down or up proportional to OP)
  const valveTravel = (safeOp / 100) * 12;

  // Pressure gauge angle (3 psi to 15 psi across 180 degrees)
  const gaugeAngle = -90 + (safeOp / 100) * 180;

  return (
    <svg
      className="process-scada-svg-root"
      viewBox="0 0 920 680"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ── Background (Figure 2 Matching Solid Steel Slate Blue) ── */}
        <linearGradient id="scadaBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#425c77" />
          <stop offset="100%" stopColor="#425c77" />
        </linearGradient>

        {/* ── Metallic Pipe Gradients (Polished Chrome / Aluminum) ── */}
        <linearGradient id="pipeHorizGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8da0b3" />
          <stop offset="25%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#586e82" />
        </linearGradient>

        <linearGradient id="pipeVertGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8da0b3" />
          <stop offset="25%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#586e82" />
        </linearGradient>

        {/* ── Water Gradients ── */}
        <linearGradient id="waterTankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052cc" stopOpacity="0.88" />
          <stop offset="30%" stopColor="#2684ff" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#0052cc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0747a6" stopOpacity="0.92" />
        </linearGradient>

        <linearGradient id="waterBasinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2684ff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#0052cc" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0747a6" stopOpacity="1" />
        </linearGradient>

        {/* ── Process Tank Glass / Metallic Cylinder Gradients ── */}
        <linearGradient id="processTankWall" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7e95aa" stopOpacity="0.7" />
          <stop offset="20%" stopColor="#d5e2ec" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#9fb2c4" stopOpacity="0.55" />
          <stop offset="80%" stopColor="#c5d7e5" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#5e758a" stopOpacity="0.85" />
        </linearGradient>

        {/* ── Metallic Enclosures ── */}
        <linearGradient id="metalBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="40%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="valveBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="40%" stopColor="#2563eb" />
          <stop offset="70%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>

        {/* ── Glow Filters ── */}
        <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Clip Path for Tank Water Column */}
        <clipPath id="processTankClip">
          <rect x="375" y="335" width="140" height="205" rx="4" ry="4" />
        </clipPath>
      </defs>

      {/* ── Diagram Background matching Figure 2 (Uniform #425c77) ── */}
      <rect width="920" height="680" fill="#425c77" />

      {/* ════════════════════════════════════════════════════════════
          1. SKID BENCH & SUPPORT STRUCTURE
          ════════════════════════════════════════════════════════════ */}
      <g id="skidStructure">
        {/* Main Base Bench Platform Plate */}
        <rect x="235" y="540" width="590" height="15" fill="#587088" stroke="#324558" strokeWidth="1.5" />
        <rect x="235" y="540" width="590" height="4" fill="#8ea2b5" />

        {/* Supply Tank Mounting Frame */}
        <rect x="245" y="555" width="570" height="105" fill="#354a5e" stroke="#253646" strokeWidth="2" rx="4" />

        {/* Tank Side Mounting Brackets & Legs */}
        <rect x="238" y="555" width="10" height="105" fill="#253646" />
        <rect x="812" y="555" width="10" height="105" fill="#253646" />
      </g>

      {/* ════════════════════════════════════════════════════════════
          2. SUPPLY TANK (LOWER BASIN)
          ════════════════════════════════════════════════════════════ */}
      <g id="supplyTank">
        {/* Transparent Tank Back Wall */}
        <rect x="250" y="560" width="560" height="95" fill="#223344" fillOpacity="0.7" />

        {/* Water in Supply Basin */}
        <rect x="250" y="598" width="560" height="57" fill="url(#waterBasinGrad)" />
        {/* Water Surface Line */}
        <line x1="250" y1="598" x2="810" y2="598" stroke="#38bdf8" strokeWidth="2.5" />

        {/* Front Glass Highlights */}
        <rect x="250" y="560" width="560" height="95" fill="none" stroke="#7a93a8" strokeWidth="1.5" />
        <line x1="260" y1="570" x2="480" y2="570" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" />

        {/* Supply Tank Label */}
        <text x="500" y="585" className="scada-label" fontSize="16">
          Supply Tank
        </text>
      </g>

      {/* ════════════════════════════════════════════════════════════
          3. PROCESS TANK (MAIN CYLINDER)
          ════════════════════════════════════════════════════════════ */}
      <g id="processTank" filter="url(#dropShadow)">
        {/* Tank Base Mounting Flange & Pedestal */}
        <rect x="365" y="536" width="160" height="8" fill="#587088" stroke="#324558" />
        <rect x="375" y="534" width="140" height="4" fill="#8ea2b5" />

        {/* Tank Body Cylinder Back */}
        <rect x="375" y="335" width="140" height="205" fill="#9db0c2" rx="4" />

        {/* DYNAMIC WATER IN PROCESS TANK */}
        <g clipPath="url(#processTankClip)">
          {/* Animated Water Column */}
          {safePv > 0 && (
            <g>
              <rect
                x="375"
                y={tankWaterTopY}
                width="140"
                height={tankWaterHeight + 5}
                fill="url(#waterTankGrad)"
              />
              {/* Meniscus Ripple Line */}
              <ellipse
                cx="445"
                cy={tankWaterTopY}
                rx="68"
                ry="4.5"
                fill="#38bdf8"
                className={isFlowing ? 'tank-meniscus-wave' : ''}
              />
            </g>
          )}

          {/* Incoming Pouring Stream from Overhead Pipe when active */}
          {isFlowing && (
            <g>
              <line
                x1="435"
                y1="310"
                x2="435"
                y2={Math.min(tankWaterTopY, 535)}
                stroke="#38bdf8"
                strokeWidth="7"
                strokeLinecap="round"
                className="inlet-stream-flow"
              />
              {/* Splash Droplets hitting the water surface */}
              {tankWaterTopY < 535 && (
                <g transform={`translate(435, ${tankWaterTopY})`}>
                  <circle cx="-6" cy="-4" r="2.5" fill="#bae6fd" className="splash-droplet-1" />
                  <circle cx="6" cy="-5" r="2.5" fill="#bae6fd" className="splash-droplet-2" />
                </g>
              )}
            </g>
          )}
        </g>

        {/* Cylindrical Glass Reflection / Wall Gradient */}
        <rect
          x="375"
          y="335"
          width="140"
          height="205"
          fill="url(#processTankWall)"
          stroke="#587088"
          strokeWidth="2"
          rx="4"
          pointerEvents="none"
        />

        {/* Level Measurement Scale Markings on Tank (0 - 100%) */}
        <g id="tankGraduations">
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const tickY = 540 - (tick / 100) * 205;
            return (
              <g key={tick}>
                <line x1="375" y1={tickY} x2="388" y2={tickY} stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x="392"
                  y={tickY + 3.5}
                  fill="#ffffff"
                  fontSize="9.5"
                  fontFamily="Consolas, monospace"
                  fontWeight="bold"
                >
                  {tick}%
                </text>
              </g>
            );
          })}
          {/* Minor Ticks (10%, 30%, 50%, 70%, 90%) */}
          {[10, 30, 50, 70, 90].map((tick) => {
            const tickY = 540 - (tick / 100) * 205;
            return (
              <line
                key={tick}
                x1="375"
                y1={tickY}
                x2="383"
                y2={tickY}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* Process Tank Drain Pipe & Manual Drain Valve (Bottom Right) */}
        {/* Drain pipe leaving tank */}
        <path
          d="M 515 528 L 575 528 L 610 528 L 610 595"
          fill="none"
          stroke="url(#pipeHorizGrad)"
          strokeWidth="12"
          strokeLinecap="square"
        />
        {/* Drain Valve Body */}
        <g id="drainValve" transform="translate(565, 513)">
          {/* Flanges */}
          <rect x="0" y="8" width="4" height="14" fill="#64748b" />
          <rect x="22" y="8" width="4" height="14" fill="#64748b" />
          {/* Valve Body Triangles */}
          <polygon points="4,8 13,15 4,22" fill="#cbd5e1" stroke="#475569" />
          <polygon points="22,8 13,15 22,22" fill="#cbd5e1" stroke="#475569" />
          {/* Stem & Handwheel */}
          <line x1="13" y1="15" x2="13" y2="4" stroke="#475569" strokeWidth="2.5" />
          <rect x="3" y="1" width="20" height="4" fill="#dc2626" rx="1.5" />
        </g>
        <text x="590" y="500" className="scada-label" fontSize="13">
          Drain Valve
        </text>

        {/* Connection to Level Transmitter (Bottom Left) */}
        <path
          d="M 375 530 L 335 530"
          fill="none"
          stroke="url(#pipeHorizGrad)"
          strokeWidth="8"
        />
      </g>

      {/* ════════════════════════════════════════════════════════════
          4. LEVEL TRANSMITTER (HYDROSTATIC SENSOR - REAL PHOTO)
          ════════════════════════════════════════════════════════════ */}
      <g id="levelTransmitter">
        {/* Threaded Process Coupling connecting to tank base pipe */}
        <rect x="318" y="524" width="14" height="12" fill="#64748b" stroke="#334155" />

        {/* Real Level Transmitter Photo with Background Removed */}
        <image
          href="/images/components/level_transmitter.png"
          x="280"
          y="436"
          width="56"
          height="106"
          preserveAspectRatio="contain"
          filter="url(#dropShadow)"
        />

        <text x="235" y="515" className="scada-label" fontSize="13">
          Level Transmitter
        </text>
      </g>

      {/* ════════════════════════════════════════════════════════════
          5. CENTRIFUGAL PUMP (REAL PHOTO)
          ════════════════════════════════════════════════════════════ */}
      <g id="pumpUnit" transform="translate(710, 622)">
        {/* Pump Suction Pipe dipping into basin */}
        <path
          d="M -30 0 L 0 0"
          fill="none"
          stroke="url(#pipeHorizGrad)"
          strokeWidth="14"
        />
        {/* Suction Strainer Bell Mouth */}
        <path
          d="M -36 -12 L -30 0 L -36 12 Z"
          fill="#64748b"
          stroke="#475569"
        />

        {/* Real Centrifugal Pump Photo with Background Removed */}
        <image
          href="/images/components/pump.png"
          x="-52"
          y="-56"
          width="104"
          height="104"
          preserveAspectRatio="contain"
          filter="url(#dropShadow)"
        />

        {/* Animated Running Impeller Halo when isRunning */}
        {isRunning && (
          <circle
            cx="22"
            cy="0"
            r="16"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="pump-impeller-spin"
            filter="url(#glowGreen)"
          />
        )}

        {/* Discharge Port Flange extending to pipe 1 */}
        <rect x="28" y="-12" width="6" height="24" fill="#64748b" stroke="#475569" />

        <text x="0" y="-62" className="scada-label" fontSize="14">
          Pump
        </text>
      </g>

      {/* ════════════════════════════════════════════════════════════
          6. DISCHARGE PIPING SYSTEM WITH 3D METALLIC FINISH
          ════════════════════════════════════════════════════════════ */}
      <g id="pipingSystem">
        {/* Pipe 1: Pump discharge right to elbow */}
        <path
          d="M 744 622 L 795 622"
          fill="none"
          stroke="url(#pipeHorizGrad)"
          strokeWidth="14"
        />

        {/* Pipe 2: Elbow 90° up, Vertical Riser */}
        <path
          d="M 795 622 Q 805 622 805 612 L 805 445 Q 805 435 795 435 L 755 435"
          fill="none"
          stroke="url(#pipeVertGrad)"
          strokeWidth="14"
        />

        {/* Pipe 3: From Valve outlet left to Rotameter inlet */}
        <path
          d="M 675 435 L 610 435 Q 600 435 600 425 L 600 375"
          fill="none"
          stroke="url(#pipeHorizGrad)"
          strokeWidth="14"
        />

        {/* Pipe 4: From Rotameter outlet top, elbow left into Process Tank */}
        <path
          d="M 600 240 L 600 215 Q 600 205 590 205 L 445 205 Q 435 205 435 215 L 435 315"
          fill="none"
          stroke="url(#pipeHorizGrad)"
          strokeWidth="14"
        />

        {/* Pipe Connecting Flanges at Joints */}
        <rect x="750" y="426" width="6" height="18" fill="#475569" stroke="#1e293b" />
        <rect x="670" y="426" width="6" height="18" fill="#475569" stroke="#1e293b" />
        <rect x="591" y="370" width="18" height="6" fill="#475569" stroke="#1e293b" />
        <rect x="591" y="240" width="18" height="6" fill="#475569" stroke="#1e293b" />
        <rect x="426" y="310" width="18" height="6" fill="#475569" stroke="#1e293b" />

        {/* FLUID FLOW PATH OVERLAY (Animated Dashes when Running) */}
        {isFlowing && (
          <g>
            {/* Pipe 1 & 2 flow path */}
            <path
              d="M 740 622 L 795 622 Q 805 622 805 612 L 805 445 Q 805 435 795 435 L 750 435"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              className={`pipe-flow-path ${flowSpeedClass}`}
            />
            {/* Pipe 3 flow path */}
            <path
              d="M 675 435 L 610 435 Q 600 435 600 425 L 600 375"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              className={`pipe-flow-path ${flowSpeedClass}`}
            />
            {/* Pipe 4 flow path */}
            <path
              d="M 600 240 L 600 215 Q 600 205 590 205 L 445 205 Q 435 205 435 215 L 435 315"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              className={`pipe-flow-path ${flowSpeedClass}`}
            />
          </g>
        )}
      </g>

      {/* ════════════════════════════════════════════════════════════
          7. CONTROL VALVE (FCV-101 - REAL PHOTO)
          ════════════════════════════════════════════════════════════ */}
      <g id="controlValve" transform="translate(712, 435)">
        {/* Pipe Flange Connections */}
        <rect x="-38" y="-12" width="6" height="24" fill="#64748b" stroke="#475569" />
        <rect x="32" y="-12" width="6" height="24" fill="#64748b" stroke="#475569" />

        {/* Real Control Valve Photo with Background Removed */}
        <image
          href="/images/components/control_valve.png"
          x="-40"
          y="-92"
          width="80"
          height="132"
          preserveAspectRatio="contain"
          filter="url(#dropShadow)"
        />

        {/* Dynamic Valve Travel Indicator Pointer (Moves with OP) */}
        <g
          className="valve-stem-indicator"
          transform={`translate(0, ${-25 - valveTravel})`}
        >
          <polygon points="-6,0 0,-3 0,3" fill="#ef4444" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#ef4444" strokeWidth="2" />
        </g>

        <text x="0" y="52" className="scada-label" fontSize="13">
          Control Valve
        </text>
      </g>

      {/* ════════════════════════════════════════════════════════════
          8. ROTAMETER (VARIABLE AREA FLOWMETER FI-101 - REAL PHOTO)
          ════════════════════════════════════════════════════════════ */}
      <g id="rotameter" transform="translate(600, 305)">
        {/* Real Rotameter Photo with Background Removed */}
        <image
          href="/images/components/rotameter.png"
          x="-28"
          y="-70"
          width="56"
          height="138"
          preserveAspectRatio="contain"
          filter="url(#dropShadow)"
        />

        {/* Dynamic Float (Plummet / Bob) - Dynamically Rises with Flow Rate OP */}
        <g
          className="rotameter-float"
          transform={`translate(0, ${28 + floatYOffset})`}
        >
          <polygon points="-6,-4 6,-4 0,6" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          <circle cx="0" cy="-4" r="2" fill="#fca5a5" />
        </g>

        <text x="-34" y="6" className="scada-label" fontSize="13" textAnchor="end">
          Rotameter
        </text>
      </g>

      {/* ════════════════════════════════════════════════════════════
          9. I/P CONVERTER (CURRENT-TO-PNEUMATIC FY-101 - REAL PHOTO)
          ════════════════════════════════════════════════════════════ */}
      <g id="ipConverter" transform="translate(470, 135)">
        {/* Real I/P Converter Photo with Background Removed */}
        <image
          href="/images/components/ip_converter.png"
          x="-40"
          y="-60"
          width="82"
          height="120"
          preserveAspectRatio="contain"
          filter="url(#dropShadow)"
        />

        {/* Dynamic Pressure Gauge Needle Overlay (proportional to OP 3-15 psi) */}
        <g transform="translate(13.3, -17.2)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-13"
            stroke="#dc2626"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="gauge-needle"
            transform={`rotate(${gaugeAngle})`}
          />
          <circle cx="0" cy="0" r="2" fill="#1e293b" />
        </g>

        <text x="75" y="-25" className="scada-label" fontSize="13">
          I / P Converter
        </text>
      </g>

      {/* ════════════════════════════════════════════════════════════
          10. PNEUMATIC TUBING (3 - 15 PSI FROM I/P TO VALVE)
          ════════════════════════════════════════════════════════════ */}
      <g id="pneumaticLine">
        <path
          d="M 512 151 L 712 151 L 712 327"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ════════════════════════════════════════════════════════════
          11. ELECTRICAL SIGNAL WIRING (RED & BLACK)
          ════════════════════════════════════════════════════════════ */}
      <g id="signalWires">
        {/* Wire 1: From Controller Top Terminals to I/P Converter */}
        <path
          d="M 68 110 L 68 45 L 438 45 L 438 123"
          fill="none"
          stroke="#dc2626"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 62 125 L 62 39 L 432 39 L 432 123"
          fill="none"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Wire 2: From Controller Bottom Terminals to Level Transmitter */}
        <path
          d="M 68 180 L 68 450 L 290 450"
          fill="none"
          stroke="#dc2626"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 62 195 L 62 458 L 290 458"
          fill="none"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ════════════════════════════════════════════════════════════
          12. DELTA DTB9696 LEVEL CONTROLLER (REAL PHOTO + DIGITAL HMI)
          ════════════════════════════════════════════════════════════ */}
      <g id="deltaController" transform="translate(68, 70)" filter="url(#dropShadow)">
        {/* Left Screw Terminal Blocks (Blue Industrial Connectors) */}
        {/* Top Terminal Block */}
        <rect x="-24" y="32" width="22" height="34" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" rx="2" />
        <rect x="-22" y="36" width="18" height="11" fill="#0369a1" />
        <rect x="-22" y="51" width="18" height="11" fill="#0369a1" />
        <circle cx="-13" cy="41" r="3" fill="#cbd5e1" stroke="#475569" />
        <circle cx="-13" cy="56" r="3" fill="#cbd5e1" stroke="#475569" />

        {/* Bottom Terminal Block */}
        <rect x="-24" y="98" width="22" height="34" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" rx="2" />
        <rect x="-22" y="102" width="18" height="11" fill="#0369a1" />
        <rect x="-22" y="117" width="18" height="11" fill="#0369a1" />
        <circle cx="-13" cy="107" r="3" fill="#cbd5e1" stroke="#475569" />
        <circle cx="-13" cy="122" r="3" fill="#cbd5e1" stroke="#475569" />

        {/* Real Delta DTB9696 Controller Photo with Background Removed */}
        <image
          href="/images/components/delta_controller.png"
          x="0"
          y="0"
          width="260"
          height="260"
          preserveAspectRatio="contain"
        />

        {/* ── PV Display Row (Process Variable - Green) ── */}
        <text x="32" y="64" fill="#9ca3af" fontSize="13" fontFamily="Arial, sans-serif" fontWeight="bold">
          PV
        </text>
        {/* Large 7-Segment Value */}
        <text x="180" y="70" className="dtb-led-pv" fontSize="38" textAnchor="end">
          {safePv.toFixed(1)}
        </text>
        {/* Secondary Sub-Display */}
        <text x="228" y="58" className="dtb-led-pv" fontSize="16" textAnchor="end">
          {safePv.toFixed(1)}
        </text>

        {/* ── SP Display Row (Set Point - Cyan) ── */}
        <text x="32" y="118" fill="#9ca3af" fontSize="13" fontFamily="Arial, sans-serif" fontWeight="bold">
          SP
        </text>
        {/* Large 7-Segment Value */}
        <text x="180" y="124" className="dtb-led-sp" fontSize="38" textAnchor="end">
          {safeSp.toFixed(1)}
        </text>
        {/* Secondary Sub-Display */}
        <text x="228" y="112" className="dtb-led-sp" fontSize="16" textAnchor="end">
          {safeSp.toFixed(1)}
        </text>

        {/* ── OP Display Row (Output Percentage - Red) ── */}
        <text x="32" y="172" fill="#9ca3af" fontSize="13" fontFamily="Arial, sans-serif" fontWeight="bold">
          OP
        </text>
        {/* Large 7-Segment Value */}
        <text x="180" y="178" className="dtb-led-op" fontSize="38" textAnchor="end">
          {safeOp.toFixed(1)}
        </text>
        {/* Secondary Sub-Display */}
        <text x="228" y="166" className="dtb-led-op" fontSize="16" textAnchor="end">
          {safeOp.toFixed(1)}
        </text>

        {/* Status LED Indicators Bar */}
        <g id="statusLeds" transform="translate(26, 186)">
          {[
            { label: 'AT', on: false },
            { label: 'OUT1', on: isRunning && safeOp > 0, color: '#ef4444' },
            { label: 'OUT2', on: false },
            { label: 'ALM1', on: safePv > 85, color: '#ef4444' },
            { label: 'ALM2', on: false },
            { label: 'ALM3', on: false },
            { label: '°F', on: false },
            { label: '°C', on: true, color: '#22c55e' },
          ].map((item, idx) => (
            <g key={item.label} transform={`translate(${idx * 26}, 0)`}>
              <circle
                cx="8"
                cy="4"
                r="3"
                fill={item.on ? item.color || '#22c55e' : '#1e293b'}
                stroke="#0f172a"
                strokeWidth="0.8"
                filter={item.on ? 'url(#glowRed)' : undefined}
              />
              <text x="8" y="14" fill="#9ca3af" fontSize="7.5" fontFamily="sans-serif" textAnchor="middle">
                {item.label}
              </text>
            </g>
          ))}
        </g>

        {/* Label Below Controller */}
        <text x="130" y="285" className="scada-label" fontSize="15">
          Level Controller
        </text>
      </g>
    </svg>
  );
};
