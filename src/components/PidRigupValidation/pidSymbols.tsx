import React from 'react';
import type { LibraryComponentDef } from './pidRigupData';

interface ComponentVisualProps {
  def: LibraryComponentDef;
  mode: 'figure' | 'symbol';
  width: number;
  height: number;
}

export const ComponentVisual: React.FC<ComponentVisualProps> = ({ def, mode, width, height }) => {
  if (mode === 'symbol') {
    return renderIsaSymbol(def.typeId, width, height);
  }
  return renderRealisticFigure(def.typeId, width, height);
};

// ══════════════════════════════════════════════════════════════════════
// 1. ISA 5.1 Standard Instrumentation Symbols (Crisp & High-Contrast)
// ══════════════════════════════════════════════════════════════════════
function renderIsaSymbol(typeId: string, w: number, h: number) {
  switch (typeId) {
    case 'process-tank':
      return (
        <svg viewBox="0 0 100 120" width={w} height={h} preserveAspectRatio="none">
          <rect x="15" y="15" width="70" height="90" rx="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="20" y1="45" x2="80" y2="45" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />
          <text x="50" y="70" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">T-101</text>
          <text x="50" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">PROCESS</text>
        </svg>
      );

    case 'sump-tank':
      return (
        <svg viewBox="0 0 120 70" width={w} height={h} preserveAspectRatio="none">
          <rect x="10" y="14" width="100" height="46" rx="4" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="15" y1="36" x2="105" y2="36" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />
          <text x="60" y="44" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">T-102</text>
          <text x="60" y="55" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">SUMP TANK</text>
        </svg>
      );

    case 'heated-tank':
      return (
        <svg viewBox="0 0 100 120" width={w} height={h} preserveAspectRatio="none">
          <rect x="15" y="15" width="70" height="90" rx="6" fill="#fef2f2" stroke="#991b1b" strokeWidth="2.5" />
          <path d="M 28,88 Q 38,76 48,88 T 68,88" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          <text x="50" y="58" textAnchor="middle" fontSize="13" fontWeight="800" fill="#991b1b">T-103</text>
          <text x="50" y="74" textAnchor="middle" fontSize="9" fontWeight="700" fill="#dc2626">HEATER</text>
        </svg>
      );

    case 'centrifugal-pump':
      return (
        <svg viewBox="0 0 80 70" width={w} height={h} preserveAspectRatio="none">
          <circle cx="36" cy="38" r="24" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 36,14 L 64,14 L 64,38 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          <text x="36" y="43" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">P-101</text>
        </svg>
      );

    case 'control-valve':
      return (
        <svg viewBox="0 0 70 90" width={w} height={h} preserveAspectRatio="none">
          <path d="M 18,22 Q 35,6 52,22 Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.2" />
          <line x1="35" y1="22" x2="35" y2="48" stroke="#0f172a" strokeWidth="2.2" />
          <polygon points="12,48 58,74 58,48 12,74" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="35" y="86" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#0f172a">CV-101</text>
        </svg>
      );

    case 'manual-valve':
      return (
        <svg viewBox="0 0 60 50" width={w} height={h} preserveAspectRatio="none">
          <line x1="30" y1="10" x2="30" y2="28" stroke="#0f172a" strokeWidth="2" />
          <line x1="18" y1="10" x2="42" y2="10" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          <polygon points="8,18 52,38 52,18 8,38" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.2" strokeLinejoin="round" />
          <text x="30" y="47" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#64748b">HV-101</text>
        </svg>
      );

    case 'ip-converter':
      return (
        <svg viewBox="0 0 75 75" width={w} height={h} preserveAspectRatio="none">
          <rect x="8" y="8" width="59" height="59" rx="5" fill="#eff6ff" stroke="#2563eb" strokeWidth="2.2" />
          <circle cx="37.5" cy="37.5" r="22" fill="#ffffff" stroke="#2563eb" strokeWidth="1.8" />
          <text x="37.5" y="34" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1e40af">I</text>
          <line x1="26" y1="37.5" x2="49" y2="37.5" stroke="#1e40af" strokeWidth="1.8" />
          <text x="37.5" y="52" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1e40af">P</text>
        </svg>
      );

    case 'air-source':
      return (
        <svg viewBox="0 0 65 65" width={w} height={h} preserveAspectRatio="none">
          <circle cx="32.5" cy="32.5" r="26" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.2" />
          <text x="32.5" y="30" textAnchor="middle" fontSize="13" fontWeight="900" fill="#15803d">AS</text>
          <text x="32.5" y="44" textAnchor="middle" fontSize="8" fontWeight="700" fill="#166534">20 psi</text>
        </svg>
      );

    case 'level-transmitter':
      return (
        <svg viewBox="0 0 65 80" width={w} height={h} preserveAspectRatio="none">
          <circle cx="32.5" cy="35" r="26" fill="#f8fafc" stroke="#0047ba" strokeWidth="2.2" />
          <line x1="6.5" y1="35" x2="58.5" y2="35" stroke="#0047ba" strokeWidth="1.8" />
          <text x="32.5" y="27" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0047ba">LT</text>
          <text x="32.5" y="49" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a8a">101</text>
          <line x1="32.5" y1="61" x2="32.5" y2="76" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'flow-transmitter':
      return (
        <svg viewBox="0 0 60 90" width={w} height={h} preserveAspectRatio="none">
          <polygon points="12,50 48,50 38,82 22,82" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2" />
          <circle cx="30" cy="28" r="22" fill="#f8fafc" stroke="#0047ba" strokeWidth="2.2" />
          <line x1="8" y1="28" x2="52" y2="28" stroke="#0047ba" strokeWidth="1.8" />
          <text x="30" y="22" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0047ba">FT</text>
          <text x="30" y="41" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a8a">101</text>
        </svg>
      );

    case 'pressure-transmitter':
      return (
        <svg viewBox="0 0 65 80" width={w} height={h} preserveAspectRatio="none">
          <circle cx="32.5" cy="35" r="26" fill="#f8fafc" stroke="#0047ba" strokeWidth="2.2" />
          <line x1="6.5" y1="35" x2="58.5" y2="35" stroke="#0047ba" strokeWidth="1.8" />
          <text x="32.5" y="27" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0047ba">PT</text>
          <text x="32.5" y="49" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a8a">101</text>
          <line x1="32.5" y1="61" x2="32.5" y2="76" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'temp-transmitter':
      return (
        <svg viewBox="0 0 65 80" width={w} height={h} preserveAspectRatio="none">
          <circle cx="32.5" cy="35" r="26" fill="#f8fafc" stroke="#0047ba" strokeWidth="2.2" />
          <line x1="6.5" y1="35" x2="58.5" y2="35" stroke="#0047ba" strokeWidth="1.8" />
          <text x="32.5" y="27" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0047ba">TT</text>
          <text x="32.5" y="49" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a8a">101</text>
          <line x1="32.5" y1="61" x2="32.5" y2="76" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'pid-controller':
      return (
        <svg viewBox="0 0 90 90" width={w} height={h} preserveAspectRatio="none">
          <rect x="6" y="6" width="78" height="78" rx="6" fill="#f0f9ff" stroke="#0047ba" strokeWidth="2.5" />
          <circle cx="45" cy="45" r="32" fill="#ffffff" stroke="#0047ba" strokeWidth="1.8" />
          <line x1="13" y1="45" x2="77" y2="45" stroke="#0047ba" strokeWidth="1.8" />
          <text x="45" y="35" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0047ba">LIC</text>
          <text x="45" y="62" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e3a8a">101</text>
        </svg>
      );

    case 'secondary-controller':
      return (
        <svg viewBox="0 0 90 90" width={w} height={h} preserveAspectRatio="none">
          <rect x="6" y="6" width="78" height="78" rx="6" fill="#f8fafc" stroke="#475569" strokeWidth="2.5" />
          <circle cx="45" cy="45" r="32" fill="#ffffff" stroke="#475569" strokeWidth="1.8" />
          <line x1="13" y1="45" x2="77" y2="45" stroke="#475569" strokeWidth="1.8" />
          <text x="45" y="35" textAnchor="middle" fontSize="13" fontWeight="900" fill="#334155">FIC</text>
          <text x="45" y="62" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569">101</text>
        </svg>
      );

    case 'ratio-station':
      return (
        <svg viewBox="0 0 80 80" width={w} height={h} preserveAspectRatio="none">
          <circle cx="40" cy="40" r="34" fill="#faf5ff" stroke="#9333ea" strokeWidth="2.5" />
          <line x1="6" y1="40" x2="74" y2="40" stroke="#9333ea" strokeWidth="2" />
          <text x="40" y="30" textAnchor="middle" fontSize="13" fontWeight="900" fill="#7e22ce">FF</text>
          <text x="40" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9333ea">RATIO</text>
        </svg>
      );

    case 'pipe-horizontal':
      return (
        <svg viewBox="0 0 120 28" width={w} height={h} preserveAspectRatio="none">
          <rect x="5" y="6" width="110" height="16" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
          <line x1="5" y1="2" x2="5" y2="26" stroke="#1e293b" strokeWidth="3" />
          <line x1="115" y1="2" x2="115" y2="26" stroke="#1e293b" strokeWidth="3" />
        </svg>
      );

    case 'pipe-vertical':
      return (
        <svg viewBox="0 0 28 120" width={w} height={h} preserveAspectRatio="none">
          <rect x="6" y="5" width="16" height="110" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
          <line x1="2" y1="5" x2="26" y2="5" stroke="#1e293b" strokeWidth="3" />
          <line x1="2" y1="115" x2="26" y2="115" stroke="#1e293b" strokeWidth="3" />
        </svg>
      );

    case 'pipe-elbow':
      return (
        <svg viewBox="0 0 60 60" width={w} height={h} preserveAspectRatio="none">
          <path d="M 5,20 L 35,20 Q 45,20 45,30 L 45,55 L 25,55 L 25,35 Q 25,30 20,30 L 5,30 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
        </svg>
      );

    case 'pipe-tee':
      return (
        <svg viewBox="0 0 70 50" width={w} height={h} preserveAspectRatio="none">
          <path d="M 5,12 L 65,12 L 65,28 L 45,28 L 45,45 L 25,45 L 25,28 L 5,28 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 80 80" width={w} height={h} preserveAspectRatio="none">
          <rect x="5" y="5" width="70" height="70" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
          <text x="40" y="45" textAnchor="middle" fontSize="10" fill="#475569">{typeId}</text>
        </svg>
      );
  }
}

// ══════════════════════════════════════════════════════════════════════
// 2. Realistic Apparatus Vector Figures (Best SCADA Industrial Art)
// ══════════════════════════════════════════════════════════════════════
function renderRealisticFigure(typeId: string, w: number, h: number) {
  switch (typeId) {
    // ── 1. Acrylic Process Tank with Realistic Water & Graduated Scale ──
    case 'process-tank':
      return (
        <svg viewBox="0 0 100 120" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pt-glass" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="pt-water" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="pt-metal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Stainless Steel Base Plate */}
          <rect x="10" y="106" width="80" height="10" rx="2" fill="url(#pt-metal)" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="18" y="112" width="12" height="6" fill="#475569" stroke="#0f172a" strokeWidth="1" />
          <rect x="70" y="112" width="12" height="6" fill="#475569" stroke="#0f172a" strokeWidth="1" />

          {/* Glass Cylinder Outer Body */}
          <rect x="18" y="12" width="64" height="95" rx="5" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />

          {/* Liquid Level (70% fill) */}
          <rect x="20" y="44" width="60" height="62" rx="3" fill="url(#pt-water)" />
          {/* Surface Meniscus Ellipse */}
          <ellipse cx="50" cy="44" rx="30" ry="4" fill="#7dd3fc" opacity="0.9" />

          {/* Glass Highlight Overlay */}
          <rect x="18" y="12" width="64" height="95" rx="5" fill="url(#pt-glass)" pointerEvents="none" />
          <line x1="26" y1="16" x2="26" y2="102" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />

          {/* Etched Measurement Scale */}
          <line x1="20" y1="25" x2="32" y2="25" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="20" y1="40" x2="28" y2="40" stroke="#1e293b" strokeWidth="1.2" />
          <line x1="20" y1="55" x2="32" y2="55" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="20" y1="70" x2="28" y2="70" stroke="#1e293b" strokeWidth="1.2" />
          <line x1="20" y1="85" x2="32" y2="85" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="20" y1="100" x2="28" y2="100" stroke="#1e293b" strokeWidth="1.2" />

          {/* Top Inflow Nozzle */}
          <rect x="26" y="2" width="10" height="11" fill="url(#pt-metal)" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="23" y="0" width="16" height="4" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="1" />

          {/* Overflow Weir Outlet (Right Side) */}
          <rect x="81" y="32" width="15" height="8" rx="1" fill="url(#pt-metal)" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="94" y="29" width="4" height="14" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="1" />

          {/* Bottom Outlet (Drain Port) */}
          <rect x="44" y="106" width="12" height="12" fill="url(#pt-metal)" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="41" y="116" width="18" height="4" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );

    // ── 2. Stainless Steel Sump Reservoir Tank ──
    case 'sump-tank':
      return (
        <svg viewBox="0 0 120 70" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="sump-steel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="30%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="sump-glass" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Tank Main Body */}
          <rect x="8" y="14" width="104" height="48" rx="6" fill="url(#sump-steel)" stroke="#0f172a" strokeWidth="2.2" />
          {/* Top Rib Reinforcement */}
          <line x1="8" y1="20" x2="112" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="8" y1="56" x2="112" y2="56" stroke="#334155" strokeWidth="1.5" />

          {/* Level Sight Glass Frame */}
          <rect x="22" y="26" width="76" height="24" rx="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="26" y="30" width="68" height="16" rx="2" fill="url(#sump-glass)" />
          <line x1="28" y1="33" x2="92" y2="33" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
          <text x="60" y="42" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff" letterSpacing="0.8">SUMP RESERVOIR</text>

          {/* Return Inlet Nozzle (Top Left) */}
          <rect x="28" y="4" width="12" height="11" fill="#475569" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="25" y="2" width="18" height="4" rx="1" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />

          {/* Pump Suction Nozzle (Top Right) */}
          <rect x="80" y="4" width="12" height="11" fill="#475569" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="77" y="2" width="18" height="4" rx="1" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />

          {/* Rubber Support Mounts */}
          <rect x="14" y="61" width="16" height="7" rx="1.5" fill="#1e293b" />
          <rect x="90" y="61" width="16" height="7" rx="1.5" fill="#1e293b" />
        </svg>
      );

    // ── 3. Heated Process Vessel Tank ──
    case 'heated-tank':
      return (
        <svg viewBox="0 0 100 120" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="ht-shell" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="35%" stopColor="#f87171" />
              <stop offset="70%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <radialGradient id="coil-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* Insulated Vessel Shell */}
          <rect x="16" y="14" width="68" height="92" rx="6" fill="url(#ht-shell)" stroke="#450a0a" strokeWidth="2.5" />
          <line x1="24" y1="18" x2="24" y2="102" stroke="#fca5a5" strokeWidth="2" strokeOpacity="0.8" />

          {/* Heat Coil Window */}
          <rect x="26" y="52" width="48" height="42" rx="4" fill="#1e1b4b" stroke="#f87171" strokeWidth="1.5" />
          <rect x="28" y="54" width="44" height="38" fill="url(#coil-glow)" />

          {/* Glowing Electric Heating Coil */}
          <path
            d="M 32,84 Q 40,70 50,84 T 68,84 M 32,70 Q 40,56 50,70 T 68,70"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Top Inlet */}
          <rect x="28" y="3" width="12" height="12" fill="#64748b" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="25" y="1" width="18" height="4" rx="1" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />

          {/* Bottom Outlet */}
          <rect x="60" y="105" width="12" height="12" fill="#64748b" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="57" y="115" width="18" height="4" rx="1" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />

          {/* Base */}
          <rect x="12" y="104" width="76" height="6" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />
        </svg>
      );

    // ── 4. Industrial Centrifugal Pump & Electric Motor ──
    case 'centrifugal-pump':
      return (
        <svg viewBox="0 0 85 70" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pump-volute" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="motor-casing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="40%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Cast Iron Motor Body */}
          <rect x="42" y="18" width="36" height="36" rx="4" fill="url(#motor-casing)" stroke="#0f172a" strokeWidth="1.8" />
          {/* Motor Cooling Fins */}
          <line x1="48" y1="18" x2="48" y2="54" stroke="#334155" strokeWidth="1.8" />
          <line x1="55" y1="18" x2="55" y2="54" stroke="#334155" strokeWidth="1.8" />
          <line x1="62" y1="18" x2="62" y2="54" stroke="#334155" strokeWidth="1.8" />
          <line x1="69" y1="18" x2="69" y2="54" stroke="#334155" strokeWidth="1.8" />

          {/* Motor Terminal Junction Box */}
          <rect x="52" y="9" width="16" height="10" rx="1.5" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />

          {/* Drive Shaft Housing Coupling */}
          <rect x="34" y="28" width="10" height="16" fill="#64748b" stroke="#0f172a" strokeWidth="1.2" />

          {/* Centrifugal Volute Scroll Casing */}
          <circle cx="24" cy="38" r="20" fill="url(#pump-volute)" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="24" cy="38" r="8" fill="#e0f2fe" stroke="#0f172a" strokeWidth="1.5" />

          {/* Horizontal Suction Flange (Left) */}
          <rect x="2" y="32" width="8" height="12" fill="#0369a1" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="0" y="29" width="4" height="18" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="1.2" />

          {/* Vertical Discharge Flange (Top) */}
          <rect x="18" y="6" width="12" height="14" fill="#0369a1" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="15" y="4" width="18" height="4" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="1.2" />

          {/* Baseplate Mounting Foundation */}
          <rect x="8" y="58" width="72" height="6" rx="1.5" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />
        </svg>
      );

    // ── 5. Pneumatic Diaphragm Globe Control Valve ──
    case 'control-valve':
      return (
        <svg viewBox="0 0 75 95" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="actuator-dome" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="valve-cast" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="45%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>

          {/* Pneumatic Actuator Diaphragm Dome */}
          <path d="M 12,24 Q 37.5,4 63,24 Z" fill="url(#actuator-dome)" stroke="#0f172a" strokeWidth="2.2" />
          <rect x="10" y="24" width="55" height="5" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />

          {/* Air Signal Brass Fitting (Top Center) */}
          <rect x="33.5" y="0" width="8" height="6" fill="#eab308" stroke="#0f172a" strokeWidth="1.2" />

          {/* Yoke Legs & Valve Stem */}
          <line x1="22" y1="29" x2="30" y2="54" stroke="#64748b" strokeWidth="3" />
          <line x1="53" y1="29" x2="45" y2="54" stroke="#64748b" strokeWidth="3" />
          <line x1="37.5" y1="29" x2="37.5" y2="58" stroke="#cbd5e1" strokeWidth="3" />

          {/* Stroke Position Indicator Scale */}
          <rect x="40" y="36" width="10" height="14" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
          <line x1="40" y1="43" x2="47" y2="43" stroke="#dc2626" strokeWidth="2" />

          {/* Globe Valve Bonnet & Body */}
          <rect x="31" y="54" width="13" height="8" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          <path
            d="M 6,60 L 69,60 L 60,84 L 69,84 L 69,60 L 37.5,72 L 6,60 Z"
            fill="url(#valve-cast)"
            stroke="#0f172a"
            strokeWidth="2.2"
          />

          {/* Flanges with Bolt Studs */}
          <rect x="2" y="58" width="6" height="28" rx="1.5" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="5" cy="64" r="1.5" fill="#cbd5e1" />
          <circle cx="5" cy="80" r="1.5" fill="#cbd5e1" />

          <rect x="67" y="58" width="6" height="28" rx="1.5" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="70" cy="64" r="1.5" fill="#cbd5e1" />
          <circle cx="70" cy="80" r="1.5" fill="#cbd5e1" />
        </svg>
      );

    // ── 6. Manual Ball / Gate Valve with Red Handwheel ──
    case 'manual-valve':
      return (
        <svg viewBox="0 0 65 55" width={w} height={h} preserveAspectRatio="none">
          {/* Stem & Gland */}
          <rect x="29" y="14" width="7" height="18" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />

          {/* Bright Red Handwheel */}
          <ellipse cx="32.5" cy="14" rx="20" ry="6" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
          <circle cx="32.5" cy="14" r="4" fill="#1e293b" />

          {/* Valve Body */}
          <polygon points="10,26 55,44 55,26 10,44" fill="#0284c7" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />

          {/* Flanges */}
          <rect x="6" y="24" width="5" height="22" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="54" y="24" width="5" height="22" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />
        </svg>
      );

    // ── 7. Industrial Electro-Pneumatic I/P Converter ──
    case 'ip-converter':
      return (
        <svg viewBox="0 0 80 80" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="ip-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="60%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            <linearGradient id="gauge-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Main Enclosure Box */}
          <rect x="8" y="10" width="64" height="60" rx="6" fill="url(#ip-body)" stroke="#0f172a" strokeWidth="2.2" />
          <rect x="12" y="14" width="56" height="52" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />

          {/* Gauge 1 (Air Supply Gauge: 0-30 psi) */}
          <circle cx="27" cy="30" r="12" fill="url(#gauge-rim)" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="27" cy="30" r="9.5" fill="#ffffff" />
          <line x1="27" y1="30" x2="32" y2="25" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
          <text x="27" y="38" textAnchor="middle" fontSize="5" fontWeight="900" fill="#0f172a">SUPPLY</text>

          {/* Gauge 2 (Output Pressure Gauge: 3-15 psi) */}
          <circle cx="53" cy="30" r="12" fill="url(#gauge-rim)" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="53" cy="30" r="9.5" fill="#ffffff" />
          <line x1="53" y1="30" x2="57" y2="26" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
          <text x="53" y="38" textAnchor="middle" fontSize="5" fontWeight="900" fill="#0f172a">OUTPUT</text>

          {/* Nameplate & 4-20mA Terminals */}
          <rect x="18" y="47" width="44" height="14" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
          <text x="40" y="55" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#60a5fa">I/P TRANSDUCER</text>
          <text x="40" y="60" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#93c5fd">4-20mA  -&gt;  3-15 psi</text>

          {/* Left Inlets (Air Supply & Electrical Cable Gland) */}
          <rect x="0" y="20" width="8" height="6" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
          <rect x="0" y="52" width="8" height="7" fill="#64748b" stroke="#0f172a" strokeWidth="1" />

          {/* Right Outlet (Pneumatic Signal Out) */}
          <rect x="72" y="32" width="8" height="6" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );

    // ── 8. Pneumatic Instrument Air Supply Station (20 psi) ──
    case 'air-source':
      return (
        <svg viewBox="0 0 70 70" width={w} height={h} preserveAspectRatio="none">
          <circle cx="35" cy="35" r="28" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
          <circle cx="35" cy="35" r="22" fill="#ffffff" stroke="#16a34a" strokeWidth="1.5" />
          {/* Pressure Dial Needle pointing to 20 psi */}
          <line x1="35" y1="35" x2="43" y2="24" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          <circle cx="35" cy="35" r="3.5" fill="#0f172a" />
          <text x="35" y="47" textAnchor="middle" fontSize="8" fontWeight="900" fill="#15803d">20 psi</text>
          <text x="35" y="54" textAnchor="middle" fontSize="6" fontWeight="700" fill="#166534">AIR SUPPLY</text>
          <rect x="63" y="32" width="7" height="6" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );

    // ── 9. Smart Differential Pressure / Level Transmitter (Rosemount Style) ──
    case 'level-transmitter':
      return (
        <svg viewBox="0 0 70 85" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="lt-housing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="60%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="lt-metal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Top Electronics Dual Cylindrical Housing */}
          <circle cx="35" cy="28" r="23" fill="url(#lt-housing)" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="35" cy="28" r="17" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

          {/* LCD Digital Backlit Display */}
          <rect x="23" y="21" width="24" height="14" rx="2" fill="#0284c7" />
          <text x="35" y="29" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ffffff">75.2%</text>
          <text x="35" y="34" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#bae6fd">LEVEL PV</text>

          {/* Electrical Conduit Connection (Right) */}
          <rect x="58" y="25" width="8" height="7" fill="#64748b" stroke="#0f172a" strokeWidth="1" />

          {/* Neck Stem */}
          <rect x="31" y="51" width="8" height="10" fill="url(#lt-metal)" stroke="#0f172a" strokeWidth="1.2" />

          {/* Lower Flange Sensor Flange Block (Stainless) */}
          <rect x="18" y="61" width="34" height="18" rx="2" fill="url(#lt-metal)" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="24" cy="70" r="3" fill="#1e293b" />
          <circle cx="46" cy="70" r="3" fill="#1e293b" />
        </svg>
      );

    // ── 10. Flow Transmitter / Variable Area Rotameter ──
    case 'flow-transmitter':
      return (
        <svg viewBox="0 0 65 95" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rot-glass" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#e2e8f0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Top Flange Header */}
          <rect x="14" y="2" width="36" height="10" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          {/* Bottom Flange Header */}
          <rect x="14" y="83" width="36" height="10" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />

          {/* Transparent Glass Tube */}
          <polygon points="20,12 44,12 40,83 24,83" fill="#f0f9ff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="20,12 44,12 40,83 24,83" fill="url(#rot-glass)" />

          {/* Float inside Tube */}
          <polygon points="32,44 26,52 38,52" fill="#dc2626" stroke="#0f172a" strokeWidth="1.2" />

          {/* Graduated Scale Line */}
          <line x1="22" y1="25" x2="28" y2="25" stroke="#0f172a" strokeWidth="1" />
          <line x1="23" y1="40" x2="28" y2="40" stroke="#0f172a" strokeWidth="1" />
          <line x1="24" y1="55" x2="29" y2="55" stroke="#0f172a" strokeWidth="1" />
          <line x1="25" y1="70" x2="30" y2="70" stroke="#0f172a" strokeWidth="1" />

          {/* Digital Transmitter Pickoff Unit (Right) */}
          <rect x="42" y="32" width="20" height="22" rx="3" fill="#1e40af" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="45" y="37" width="14" height="8" rx="1" fill="#0284c7" />
          <text x="52" y="43" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#ffffff">45 L</text>
        </svg>
      );

    // ── 11. Pressure Transmitter ──
    case 'pressure-transmitter':
      return (
        <svg viewBox="0 0 70 85" width={w} height={h} preserveAspectRatio="none">
          <circle cx="35" cy="28" r="23" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="35" cy="28" r="17" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="23" y="21" width="24" height="14" rx="2" fill="#0284c7" />
          <text x="35" y="29" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ffffff">2.4 bar</text>
          <text x="35" y="34" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#bae6fd">PRESSURE</text>

          <rect x="30" y="51" width="10" height="12" fill="#64748b" stroke="#0f172a" strokeWidth="1.2" />
          {/* Threaded Process Connection */}
          <rect x="32" y="63" width="6" height="18" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="31" y1="67" x2="39" y2="67" stroke="#334155" strokeWidth="1.2" />
          <line x1="31" y1="72" x2="39" y2="72" stroke="#334155" strokeWidth="1.2" />
        </svg>
      );

    // ── 12. Temperature Transmitter with Thermowell ──
    case 'temp-transmitter':
      return (
        <svg viewBox="0 0 70 85" width={w} height={h} preserveAspectRatio="none">
          <circle cx="35" cy="28" r="23" fill="#b91c1c" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="35" cy="28" r="17" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="23" y="21" width="24" height="14" rx="2" fill="#991b1b" />
          <text x="35" y="29" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ffffff">64.5°C</text>
          <text x="35" y="34" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#fca5a5">TEMP PV</text>

          <rect x="31" y="51" width="8" height="10" fill="#64748b" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="33" y="61" width="4" height="22" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );

    // ── 13. Digital PID Process Controller (Delta DTB / 1/4 DIN Style) ──
    case 'pid-controller':
      return (
        <svg viewBox="0 0 90 90" width={w} height={h} preserveAspectRatio="none">
          {/* Bezel Faceplate */}
          <rect x="4" y="4" width="82" height="82" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
          <rect x="8" y="8" width="74" height="74" rx="4" fill="#1e293b" />

          {/* Top PV LED Display (Emerald Green) */}
          <rect x="12" y="12" width="66" height="20" rx="3" fill="#022c22" stroke="#065f46" strokeWidth="1" />
          <text x="74" y="27" textAnchor="end" fontSize="14" fontWeight="900" fill="#10b981" fontFamily="Courier, monospace" letterSpacing="1.5">
            75.0
          </text>
          <text x="15" y="26" textAnchor="start" fontSize="6.5" fontWeight="800" fill="#34d399">PV</text>

          {/* Bottom SV LED Display (Orange/Amber) */}
          <rect x="12" y="36" width="66" height="18" rx="3" fill="#451a03" stroke="#9a3412" strokeWidth="1" />
          <text x="74" y="50" textAnchor="end" fontSize="13" fontWeight="900" fill="#f59e0b" fontFamily="Courier, monospace" letterSpacing="1.5">
            75.0
          </text>
          <text x="15" y="49" textAnchor="start" fontSize="6.5" fontWeight="800" fill="#fbbf24">SP</text>

          {/* Keypad Buttons */}
          <rect x="12" y="60" width="14" height="16" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
          <text x="19" y="70" textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffffff">SET</text>

          <rect x="29" y="60" width="14" height="16" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
          <text x="36" y="70" textAnchor="middle" fontSize="7" fontWeight="900" fill="#38bdf8">▲</text>

          <rect x="46" y="60" width="14" height="16" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
          <text x="53" y="70" textAnchor="middle" fontSize="7" fontWeight="900" fill="#38bdf8">▼</text>

          <rect x="63" y="60" width="15" height="16" rx="2" fill="#047857" stroke="#10b981" strokeWidth="1" />
          <text x="70.5" y="70" textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffffff">RUN</text>
        </svg>
      );

    case 'secondary-controller':
      return (
        <svg viewBox="0 0 90 90" width={w} height={h} preserveAspectRatio="none">
          <rect x="4" y="4" width="82" height="82" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
          <rect x="8" y="8" width="74" height="74" rx="4" fill="#1e293b" />

          <rect x="12" y="12" width="66" height="20" rx="3" fill="#022c22" stroke="#065f46" strokeWidth="1" />
          <text x="74" y="27" textAnchor="end" fontSize="14" fontWeight="900" fill="#38bdf8" fontFamily="Courier, monospace">
            45.0
          </text>
          <text x="15" y="26" textAnchor="start" fontSize="6.5" fontWeight="800" fill="#7dd3fc">FLOW</text>

          <rect x="12" y="36" width="66" height="18" rx="3" fill="#451a03" stroke="#9a3412" strokeWidth="1" />
          <text x="74" y="50" textAnchor="end" fontSize="13" fontWeight="900" fill="#f59e0b" fontFamily="Courier, monospace">
            45.0
          </text>

          <rect x="12" y="60" width="14" height="16" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
          <text x="19" y="70" textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffffff">SET</text>
          <rect x="63" y="60" width="15" height="16" rx="2" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
          <text x="70.5" y="70" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#ffffff">SLAVE</text>
        </svg>
      );

    case 'ratio-station':
      return (
        <svg viewBox="0 0 80 80" width={w} height={h} preserveAspectRatio="none">
          <rect x="4" y="4" width="72" height="72" rx="6" fill="#1e1b4b" stroke="#7e22ce" strokeWidth="2.5" />
          <rect x="8" y="8" width="64" height="64" rx="4" fill="#0f172a" />
          <text x="40" y="32" textAnchor="middle" fontSize="12" fontWeight="900" fill="#c084fc">RATIO (FF)</text>
          <rect x="16" y="40" width="48" height="18" rx="3" fill="#3b0764" />
          <text x="40" y="53" textAnchor="middle" fontSize="11" fontWeight="900" fill="#f0abfc">1 : 1.5</text>
        </svg>
      );

    // ── 14. 3D Cylindrical Steel Pipe Pieces ──
    case 'pipe-horizontal':
      return (
        <svg viewBox="0 0 120 28" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pipe-3d-h" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="25%" stopColor="#94a3b8" />
              <stop offset="55%" stopColor="#e2e8f0" />
              <stop offset="85%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <rect x="6" y="4" width="108" height="20" fill="url(#pipe-3d-h)" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="2" y="1" width="7" height="26" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="111" y="1" width="7" height="26" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="12" y1="14" x2="108" y2="14" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.8" />
        </svg>
      );

    case 'pipe-vertical':
      return (
        <svg viewBox="0 0 28 120" width={w} height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pipe-3d-v" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="25%" stopColor="#94a3b8" />
              <stop offset="55%" stopColor="#e2e8f0" />
              <stop offset="85%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <rect x="4" y="6" width="20" height="108" fill="url(#pipe-3d-v)" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="1" y="2" width="26" height="7" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="1" y="111" width="26" height="7" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="14" y1="12" x2="14" y2="108" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.8" />
        </svg>
      );

    case 'pipe-elbow':
      return (
        <svg viewBox="0 0 60 60" width={w} height={h} preserveAspectRatio="none">
          <path d="M 4,16 L 36,16 Q 44,16 44,24 L 44,56 L 28,56 L 28,34 Q 28,28 22,28 L 4,28 Z" fill="#64748b" stroke="#0f172a" strokeWidth="1.8" />
          <rect x="1" y="12" width="6" height="20" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="24" y="53" width="24" height="6" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'pipe-tee':
      return (
        <svg viewBox="0 0 70 50" width={w} height={h} preserveAspectRatio="none">
          <path d="M 5,12 L 65,12 L 65,28 L 44,28 L 44,45 L 26,45 L 26,28 L 5,28 Z" fill="#64748b" stroke="#0f172a" strokeWidth="1.8" />
          <rect x="2" y="9" width="5" height="22" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="63" y="9" width="5" height="22" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="23" y="43" width="24" height="5" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 80 80" width={w} height={h} preserveAspectRatio="none">
          <rect x="5" y="5" width="70" height="70" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
          <text x="40" y="45" textAnchor="middle" fontSize="10" fill="#475569">{typeId}</text>
        </svg>
      );
  }
}
