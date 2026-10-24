import React from 'react';
import type { BlockDiagramModel } from './SimACE413Header';
import './SimACE413Diagram.css';

interface SimACE413DiagramProps {
  model: BlockDiagramModel;
  gainK: number;
  tau1: number;
  tau2?: number;
  theta: number;
  kc: number;
  ti: number;
  td: number;
}

export const SimACE413Diagram: React.FC<SimACE413DiagramProps> = ({
  model,
  gainK,
  tau1,
  tau2 = 10,
  theta,
  kc,
  ti,
  td,
}) => {
  return (
    <div className="sim413-diagram-card">
      <div className="diagram-header">
        <span className="diagram-title">System Block Diagram Architecture</span>
        <span className="diagram-tag">Laplace s-domain Representation</span>
      </div>

      <div className="diagram-svg-box">
        <svg className="sim413-svg" viewBox="0 0 620 220" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Background Card */}
          <rect x="0" y="0" width="620" height="220" fill="#0f172a" rx="6" />

          {/* ── TOPOLOGY 1: FOPDT Single Loop ── */}
          {model === 'fopdt' && (
            <g transform="translate(20, 20)">
              {/* Input R(s) */}
              <text x="15" y="65" fill="#f8fafc" fontSize="11" fontWeight="bold">R(s)</text>
              <line x1="45" y1="60" x2="80" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />

              {/* Summing Junction 1 */}
              <circle cx="95" cy="60" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="95" y="64" fill="#38bdf8" fontSize="13" textAnchor="middle" fontWeight="bold">&Sigma;</text>
              <text x="82" y="55" fill="#f8fafc" fontSize="9">+</text>
              <text x="95" y="86" fill="#f8fafc" fontSize="9" textAnchor="middle">-</text>

              {/* Error signal to Gc */}
              <line x1="109" y1="60" x2="145" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="125" y="53" fill="#94a3b8" fontSize="9">E(s)</text>

              {/* Controller Block Gc(s) */}
              <rect x="150" y="38" width="105" height="44" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="4" />
              <text x="202" y="57" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">Controller Gc(s)</text>
              <text x="202" y="72" fill="#94a3b8" fontSize="8" textAnchor="middle">
                Kc={kc.toFixed(2)}, Ti={ti.toFixed(1)}s, Td={td.toFixed(1)}s
              </text>

              {/* Control Signal U(s) */}
              <line x1="255" y1="60" x2="295" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="275" y="53" fill="#94a3b8" fontSize="9">U(s)</text>

              {/* Plant Block Gp(s) */}
              <rect x="300" y="38" width="135" height="44" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <text x="367" y="56" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Plant Gp(s)</text>
              <text x="367" y="72" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                {gainK.toFixed(2)} &middot; e<sup>-{theta.toFixed(1)}s</sup> / ({tau1.toFixed(1)}s + 1)
              </text>

              {/* Output Y(s) */}
              <line x1="435" y1="60" x2="520" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="480" cy="60" r="3" fill="#38bdf8" />
              <text x="525" y="64" fill="#f8fafc" fontSize="11" fontWeight="bold">Y(s)</text>

              {/* Feedback Branch */}
              <path d="M 480 60 L 480 140 L 390 140" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
              <rect x="310" y="120" width="75" height="38" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" rx="4" />
              <text x="347" y="144" fill="#f59e0b" fontSize="10" textAnchor="middle" fontWeight="bold">H(s) = 1.0</text>
              <path d="M 310 140 L 95 140 L 95 78" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
            </g>
          )}

          {/* ── TOPOLOGY 2: Two Tank Non-Interacting ── */}
          {model === 'two-non-interacting' && (
            <g transform="translate(15, 20)">
              <text x="15" y="65" fill="#f8fafc" fontSize="11" fontWeight="bold">R(s)</text>
              <line x1="45" y1="60" x2="75" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="88" cy="60" r="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="88" y="64" fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">&Sigma;</text>

              <line x1="100" y1="60" x2="135" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="135" y="38" width="90" height="44" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="3" />
              <text x="180" y="63" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">Controller Gc</text>

              {/* Tank 1 */}
              <line x1="225" y1="60" x2="260" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="260" y="38" width="105" height="44" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="3" />
              <text x="312" y="56" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">Tank 1 G1(s)</text>
              <text x="312" y="71" fill="#94a3b8" fontSize="8" textAnchor="middle">1 / ({tau1.toFixed(1)}s + 1)</text>

              {/* Tank 2 */}
              <line x1="365" y1="60" x2="400" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="400" y="38" width="105" height="44" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="3" />
              <text x="452" y="56" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">Tank 2 G2(s)</text>
              <text x="452" y="71" fill="#94a3b8" fontSize="8" textAnchor="middle">1 / ({tau2.toFixed(1)}s + 1)</text>

              <line x1="505" y1="60" x2="570" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="575" y="64" fill="#f8fafc" fontSize="11" fontWeight="bold">Y(s)</text>
              <path d="M 535 60 L 535 140 L 88 140 L 88 74" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
            </g>
          )}

          {/* ── TOPOLOGY 3: Two Tank Interacting ── */}
          {model === 'two-interacting' && (
            <g transform="translate(15, 20)">
              <text x="15" y="65" fill="#f8fafc" fontSize="11" fontWeight="bold">R(s)</text>
              <line x1="45" y1="60" x2="75" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="88" cy="60" r="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="88" y="64" fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">&Sigma;</text>

              <line x1="100" y1="60" x2="135" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="135" y="38" width="90" height="44" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="3" />
              <text x="180" y="63" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">Controller Gc</text>

              {/* Interacting Plant Box */}
              <line x1="225" y1="60" x2="265" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="265" y="30" width="230" height="60" fill="#1e293b" stroke="#a855f7" strokeWidth="2" rx="4" />
              <text x="380" y="52" fill="#c4b5fd" fontSize="10" textAnchor="middle" fontWeight="bold">
                Interacting Two-Tank Matrix [G(s)]
              </text>
              <text x="380" y="72" fill="#cbd5e1" fontSize="9" textAnchor="middle">
                K / [ (R1 C1 R2 C2)s² + (R1 C1 + R2 C2 + R1 C2)s + 1 ]
              </text>

              <line x1="495" y1="60" x2="570" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="575" y="64" fill="#f8fafc" fontSize="11" fontWeight="bold">Y(s)</text>
              <path d="M 535 60 L 535 140 L 88 140 L 88 74" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
            </g>
          )}

          {/* ── TOPOLOGY 4: Cascade Control ── */}
          {model === 'cascade' && (
            <g transform="translate(10, 15)">
              <text x="10" y="65" fill="#f8fafc" fontSize="10" fontWeight="bold">SP1</text>
              <line x1="35" y1="60" x2="65" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <circle cx="75" cy="60" r="10" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />

              {/* Primary Gc1 */}
              <line x1="85" y1="60" x2="110" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <rect x="110" y="42" width="80" height="36" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" rx="3" />
              <text x="150" y="64" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">Master Gc1</text>

              {/* Inner Summing Node */}
              <line x1="190" y1="60" x2="225" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <circle cx="235" cy="60" r="10" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />

              {/* Secondary Gc2 */}
              <line x1="245" y1="60" x2="270" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <rect x="270" y="42" width="80" height="36" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" rx="3" />
              <text x="310" y="64" fill="#eab308" fontSize="9" textAnchor="middle" fontWeight="bold">Slave Gc2</text>

              {/* Secondary Plant Gp2 */}
              <line x1="350" y1="60" x2="375" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <rect x="375" y="42" width="75" height="36" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
              <text x="412" y="64" fill="#38bdf8" fontSize="8" textAnchor="middle">Flow Plant</text>

              {/* Inner Loop Feedback */}
              <circle cx="465" cy="60" r="2.5" fill="#38bdf8" />
              <path d="M 465 60 L 465 110 L 235 110 L 235 72" stroke="#eab308" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
              <text x="350" y="105" fill="#eab308" fontSize="8">Secondary Feedback PV2</text>

              {/* Primary Plant Gp1 */}
              <line x1="450" y1="60" x2="485" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <rect x="485" y="42" width="75" height="36" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" rx="3" />
              <text x="522" y="64" fill="#10b981" fontSize="8" textAnchor="middle">Level Plant</text>

              {/* Outer Loop Feedback */}
              <line x1="560" y1="60" x2="590" y2="60" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M 580 60 L 580 150 L 75 150 L 75 72" stroke="#10b981" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
              <text x="330" y="145" fill="#10b981" fontSize="8">Primary Feedback PV1</text>
            </g>
          )}

          {/* ── TOPOLOGY 5: Feedforward + Feedback ── */}
          {model === 'feedforward' && (
            <g transform="translate(15, 20)">
              {/* Disturbance input D(s) */}
              <text x="210" y="15" fill="#f59e0b" fontSize="10" fontWeight="bold">Disturbance D(s)</text>
              <line x1="250" y1="18" x2="250" y2="40" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Feedforward Compensator */}
              <rect x="210" y="45" width="80" height="32" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" rx="3" />
              <text x="250" y="65" fill="#a855f7" fontSize="9" textAnchor="middle" fontWeight="bold">Gff(s)</text>

              {/* Input R(s) */}
              <text x="15" y="125" fill="#f8fafc" fontSize="11" fontWeight="bold">R(s)</text>
              <line x1="45" y1="120" x2="75" y2="120" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="88" cy="120" r="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="88" y="124" fill="#38bdf8" fontSize="12" textAnchor="middle">&Sigma;</text>

              <line x1="100" y1="120" x2="135" y2="120" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="135" y="102" width="85" height="36" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="3" />
              <text x="177" y="124" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">Feedback Gc</text>

              {/* Summing Junction for Feedforward + Feedback */}
              <line x1="220" y1="120" x2="260" y2="120" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="272" cy="120" r="11" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="272" y="124" fill="#38bdf8" fontSize="12" textAnchor="middle">+</text>
              <line x1="250" y1="77" x2="272" y2="108" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Plant */}
              <line x1="284" y1="120" x2="330" y2="120" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="330" y="98" width="120" height="44" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <text x="390" y="124" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Process Gp(s)</text>

              <line x1="450" y1="120" x2="520" y2="120" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="525" y="124" fill="#f8fafc" fontSize="11" fontWeight="bold">Y(s)</text>
              <path d="M 485 120 L 485 175 L 88 175 L 88 134" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
            </g>
          )}

          {/* ── TOPOLOGY 6 & 7: Three Tank Interacting / Smith Predictor ── */}
          {(model === 'three-interacting' || model === 'smith') && (
            <g transform="translate(15, 20)">
              <text x="15" y="65" fill="#f8fafc" fontSize="11" fontWeight="bold">R(s)</text>
              <line x1="45" y1="60" x2="80" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="95" cy="60" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="95" y="64" fill="#38bdf8" fontSize="13" textAnchor="middle" fontWeight="bold">&Sigma;</text>

              <line x1="109" y1="60" x2="145" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="145" y="38" width="100" height="44" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="4" />
              <text x="195" y="64" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">Controller Gc(s)</text>

              <line x1="245" y1="60" x2="290" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="290" y="38" width="145" height="44" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <text x="362" y="56" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                {model === 'smith' ? 'Plant with Delay Gp' : 'Three-Tank Network'}
              </text>
              <text x="362" y="72" fill="#94a3b8" fontSize="8" textAnchor="middle">
                {model === 'smith' ? 'G_m0(s) · e^-θs' : '3rd Order Interacting Transfer Function'}
              </text>

              <line x1="435" y1="60" x2="520" y2="60" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="525" y="64" fill="#f8fafc" fontSize="11" fontWeight="bold">Y(s)</text>

              {model === 'smith' ? (
                <>
                  {/* Minor Loop Smith Predictor */}
                  <path d="M 265 60 L 265 115 L 305 115" stroke="#14b8a6" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <rect x="305" y="98" width="115" height="34" fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" rx="3" />
                  <text x="362" y="119" fill="#14b8a6" fontSize="9" textAnchor="middle">Gm0 - Gm0·e^-θms</text>
                  <path d="M 420 115 L 450 115 L 450 145 L 95 145 L 95 78" stroke="#14b8a6" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
                </>
              ) : (
                <path d="M 480 60 L 480 140 L 95 140 L 95 78" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
