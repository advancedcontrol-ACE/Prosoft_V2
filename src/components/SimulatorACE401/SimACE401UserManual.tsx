import React, { useState } from 'react';
import './SimACE401UserManual.css';

interface SimACE401UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimACE401UserManual: React.FC<SimACE401UserManualProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<'intro' | 'physics' | 'modes' | 'study' | 'procedure'>('intro');

  if (!isOpen) return null;

  return (
    <div className="sim401-modal-backdrop" onClick={onClose}>
      <div className="sim401-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sim401-modal-header">
          <div className="sim401-modal-title">
            <span className="sim401-manual-badge">MANUAL</span>
            ACE 401: Two Position &amp; PID Process Simulator
          </div>
          <button
            type="button"
            className="sim401-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="sim401-modal-body">
          {/* Navigation Sidebar */}
          <div className="sim401-manual-nav">
            <button
              type="button"
              className={`sim401-nav-btn ${activeSection === 'intro' ? 'active' : ''}`}
              onClick={() => setActiveSection('intro')}
            >
              1. System Overview
            </button>
            <button
              type="button"
              className={`sim401-nav-btn ${activeSection === 'physics' ? 'active' : ''}`}
              onClick={() => setActiveSection('physics')}
            >
              2. First Principles Physics
            </button>
            <button
              type="button"
              className={`sim401-nav-btn ${activeSection === 'modes' ? 'active' : ''}`}
              onClick={() => setActiveSection('modes')}
            >
              3. Control Algorithms
            </button>
            <button
              type="button"
              className={`sim401-nav-btn ${activeSection === 'study' ? 'active' : ''}`}
              onClick={() => setActiveSection('study')}
            >
              4. Study Parameters &amp; Features
            </button>
            <button
              type="button"
              className={`sim401-nav-btn ${activeSection === 'procedure' ? 'active' : ''}`}
              onClick={() => setActiveSection('procedure')}
            >
              5. Experimental Procedures
            </button>
          </div>

          {/* Main Manual Content */}
          <div className="sim401-manual-content">
            {/* 1. Overview */}
            {activeSection === 'intro' && (
              <div className="sim401-section">
                <h2>1. System Overview</h2>
                <p>
                  The <strong>Two Position &amp; PID Simulator (ACE 401)</strong> provides a software-in-the-loop,
                  first-principles mathematical simulation of a Single-Loop Level Process Trainer.
                </p>
                <p>
                  The virtual plant models an industrial liquid-level tank fed by a centrifugal pump and control valve,
                  with gravity discharge through a manual valve into a sump reservoir. The process dynamics faithfully
                  capture fluid mass balance, square-root head loss, valve time lags, and controller execution timing.
                </p>
                <div className="sim401-info-box">
                  <strong>Key Capabilities:</strong>
                  <ul>
                    <li>Two-Position (On/Off) Control with adjustable Hysteresis deadband.</li>
                    <li>Continuous P, PI, PD, and full PID control modes with independent term contribution displays.</li>
                    <li>Configurable plant parameters: Tank diameter, height, steady-state outflow, and valve time lag.</li>
                    <li>Advanced industrial studies: Bumpless transfer, anti-reset windup, direct/reverse action, and disturbance load injection.</li>
                    <li>Real-time trend graph plotting SP %, PV %, and OP % with data logging and CSV/Excel export.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. Physics */}
            {activeSection === 'physics' && (
              <div className="sim401-section">
                <h2>2. First Principles Physical Model</h2>
                <p>
                  The liquid level h(t) inside the process tank is governed by the continuous mass conservation equation:
                </p>
                <div className="sim401-formula-card">
                  A &middot; [dh(t) / dt] = F<sub>in</sub>(t) - F<sub>out</sub>(t)
                </div>
                <p>Where:</p>
                <ul>
                  <li><strong>Tank Cross-Sectional Area (A):</strong> A = (&pi; / 4) &middot; D<sup>2</sup>, where D is the tank diameter in cm.</li>
                  <li><strong>Tank Height (H):</strong> Maximum fluid height in cm, yielding PV (%) = [h / H] &times; 100%.</li>
                  <li><strong>Inflow (F<sub>in</sub>):</strong> Pump flow commanded by Controller Output OP, subject to a 1st-order transfer lag:
                    <div className="sim401-formula-inline">
                      &tau; &middot; [dF<sub>in</sub> / dt] + F<sub>in</sub> = [(OP + Load) / 100] &middot; F<sub>in,max</sub>
                    </div>
                  </li>
                  <li><strong>Outflow (F<sub>out</sub>):</strong> Under standard gravity draining, discharge obeys Torricelli's Law:
                    <div className="sim401-formula-inline">
                      F<sub>out</sub> = F<sub>ss50</sub> &middot; &radic;(h / [0.5 &middot; H]) = F<sub>ss50</sub> &middot; &radic;(PV / 50)
                    </div>
                    If <em>Constant Outflow</em> is enabled, F<sub>out</sub> = F<sub>ss50</sub> independently of level.
                  </li>
                </ul>
              </div>
            )}

            {/* 3. Control Algorithms */}
            {activeSection === 'modes' && (
              <div className="sim401-section">
                <h2>3. Control Algorithms</h2>
                <h3>On / Off Control (Two-Position)</h3>
                <p>
                  The output switches abruptly between 0% and 100% depending on whether the process variable is above or below
                  the setpoint, with a configurable <strong>Hysteresis band</strong> to prevent chattering:
                </p>
                <ul>
                  <li>If PV &lt; SP - (Hys / 2) &rarr; OP = 100%</li>
                  <li>If PV &gt; SP + (Hys / 2) &rarr; OP = 0%</li>
                  <li>Inside the deadband: output remains in its previous state.</li>
                </ul>

                <h3>PID Control Modes</h3>
                <p>
                  Continuous control algorithms compute output according to the error e(t) = SP - PV (for Direct action):
                </p>
                <ul>
                  <li><strong>Proportional Band (PB):</strong> Controller Gain K<sub>p</sub> = 100 / PB. Proportional term: POP = K<sub>p</sub> &middot; e(t).</li>
                  <li><strong>Integral Time (IT):</strong> Eliminates steady-state offset: IOP = (K<sub>p</sub> / IT) &int; e(t) dt.</li>
                  <li><strong>Derivative Time (DT):</strong> Anticipates rapid changes: DOP = K<sub>p</sub> &middot; DT &middot; [de(t) / dt].</li>
                  <li><strong>Controller Output:</strong> OP = Bias + POP + IOP + DOP, saturated between 0% and 100%.</li>
                </ul>
              </div>
            )}

            {/* 4. Study Parameters */}
            {activeSection === 'study' && (
              <div className="sim401-section">
                <h2>4. Study Parameters &amp; Features</h2>
                <ul>
                  <li><strong>Bumpless Transfer:</strong> When switching from Manual to Auto mode, the controller sets the integral term or bias to equalize OP<sub>auto</sub> = OP<sub>manual</sub>, eliminating output bumps.</li>
                  <li><strong>Anti Reset Windup:</strong> If controller output reaches 0% or 100% saturation, integral accumulation is suspended to avoid prolonged recovery overshoot.</li>
                  <li><strong>Constant Outflow:</strong> Switches drain characteristics from nonlinear gravity (&radic;h) to constant discharge, linearizing system dynamics.</li>
                  <li><strong>Constant PV:</strong> Freezes level feedback to permit open-loop step testing and frequency response evaluation.</li>
                  <li><strong>Add Load:</strong> Injects a disturbance flow (e.g. +10% or -10%) to test controller disturbance rejection.</li>
                </ul>
              </div>
            )}

            {/* 5. Procedure */}
            {activeSection === 'procedure' && (
              <div className="sim401-section">
                <h2>5. Experimental Procedures</h2>
                <ol>
                  <li><strong>On/Off Level Control:</strong> Select <em>On / Off Control</em>. Set SP to 50% and Hysteresis to 2%. Click <strong>Run</strong>. Observe periodic limit-cycle oscillations on the graph. Increase Hysteresis to 6% and note the increased oscillation period and amplitude.</li>
                  <li><strong>P-Only Offset Study:</strong> Select <em>P Mode</em>. Set PB = 50%, Bias = 40%. Click <strong>Run</strong>. Notice the tank settles with a noticeable steady-state offset between SP and PV.</li>
                  <li><strong>PI Mode Tuning:</strong> Select <em>PI Mode</em>. Set PB = 20%, IT = 30s. Click <strong>Run</strong>. Observe how the integral action pulls PV exactly up to SP = 50%, completely removing the steady-state error.</li>
                  <li><strong>Disturbance Rejection:</strong> Once in steady state, set Load = 20% and click <strong>Add Load</strong>. Observe how the controller compensates by automatically increasing OP to restore PV to the setpoint.</li>
                  <li><strong>Data Logging:</strong> Turn <strong>Log ON</strong> to record data in the Log Table. Click <strong>Save Log Data</strong> to export logged data for laboratory report generation.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sim401-modal-footer">
          <span className="sim401-footer-note">Advanced Control Equipments &mdash; Process Control Simulator Suite</span>
          <button type="button" className="sim401-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
