import React from 'react';

export interface GuidePageItem {
  id: string;
  chapterNumber: string;
  chapterTitle: string;
  sectionNumber: string;
  title: string;
  pageNumber: number;
  render: () => React.ReactNode;
}

export const GUIDE_PAGES: GuidePageItem[] = [
  // ── Quick Reference Page ─────────────────────────────────────
  {
    id: 'quick-ref',
    chapterNumber: 'Reference',
    chapterTitle: 'Quick Reference Guide',
    sectionNumber: 'Quick Ref',
    title: '⚡ Quick Reference Guide & Cheat Sheet',
    pageNumber: 1,
    render: () => (
      <div className="page-body quick-ref-page">
        <div className="doc-callout info">
          <strong>⚡ Quick Reference Cheat Sheet:</strong> Essential process &amp; control flows, Modbus addresses, wiring specs, and experiment formulas for rapid lab setup.
        </div>

        {/* ── Process and Control Flow Architecture ─────────────── */}
        <section className="page-section flow-architecture-section">
          <h2 className="section-title">🔄 Process &amp; Control Flow Architecture</h2>
          <p className="section-intro">
            Schematic flow loops for fluid circulation and closed-loop feedback instrumentation in the ACE 101 Trainer:
          </p>

          <div className="quickref-flow-container">
            {/* Process Flow Card */}
            <div className="quickref-flow-card process-flow">
              <div className="flow-card-badge">🌊 Process Flow</div>
              <div className="flow-card-line">
                <span className="flow-tag node-start">Supply Tank</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag">Pump</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag">Control Valve</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag">Rotameter</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag node-target">Process Tank</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag">Drain Valve</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag node-start">Supply Tank</span>
              </div>
              <div className="flow-raw-line">
                <strong>Process Flow:</strong> <code>Supply Tank &rarr; Pump &rarr; Control Valve &rarr; Rotameter &rarr; Process Tank &rarr; Drain Valve &rarr; Supply Tank</code>
              </div>
            </div>

            {/* Control Flow Card */}
            <div className="quickref-flow-card control-flow">
              <div className="flow-card-badge">⚡ Control Flow</div>
              <div className="flow-card-line">
                <span className="flow-tag node-sensor">Level Transmitter</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag node-controller">Level Controller</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag node-actuator">I/P Converter</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-tag node-final">Control Valve</span>
              </div>
              <div className="flow-raw-line">
                <strong>Control Flow:</strong> <code>Level Transmitter &rarr; Level Controller &rarr; I/P Converter &rarr; Control Valve</code>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section">
          <h2 className="section-title">📋 DELTA DTB9696 Modbus Register Map (ACE 101)</h2>
          <p className="section-intro">
            Official register address mapping per Section 6.2 (Page 57) of the ACE 101 Technical Manual:
          </p>
          <div className="table-responsive">
            <table className="doc-table modbus-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Decimal Register</th>
                  <th>Hex Address</th>
                  <th>Access</th>
                  <th>Data Range</th>
                  <th>Description / Function</th>
                </tr>
              </thead>
              <tbody>
                <tr className="highlight-row">
                  <td><strong>PV (Process Value)</strong></td>
                  <td><code>4096</code> (44097)</td>
                  <td><code>1000H</code></td>
                  <td>Read Only</td>
                  <td>0.0 – 100.0 %</td>
                  <td>Water level in process tank from WIKA transmitter</td>
                </tr>
                <tr className="highlight-row">
                  <td><strong>SP (Set Point)</strong></td>
                  <td><code>4097</code> (44098)</td>
                  <td><code>1001H</code></td>
                  <td>Read / Write</td>
                  <td>0.0 – 100.0 %</td>
                  <td>Target reference level percentage</td>
                </tr>
                <tr>
                  <td><strong>A/M (Auto / Manual)</strong></td>
                  <td><code>4101</code> (44102)</td>
                  <td><code>1005H</code></td>
                  <td>Read / Write</td>
                  <td>0 = Auto, 2 = Manual</td>
                  <td>Controller operating state mode switch</td>
                </tr>
                <tr>
                  <td><strong>Action (Direct / Reverse)</strong></td>
                  <td><code>4102</code> (44103)</td>
                  <td><code>1006H</code></td>
                  <td>Read / Write</td>
                  <td>0 = Reverse, 1 = Direct</td>
                  <td>Direction of control response (Default: Direct for level)</td>
                </tr>
                <tr>
                  <td><strong>PB (Proportional Band)</strong></td>
                  <td><code>4105</code> (44106)</td>
                  <td><code>1009H</code></td>
                  <td>Read / Write</td>
                  <td>0.1 – 999.9 %</td>
                  <td>Gain parameter: Gain Kp = 100 / PB</td>
                </tr>
                <tr>
                  <td><strong>Ti (Integral Time)</strong></td>
                  <td><code>4106</code> (44107)</td>
                  <td><code>100AH</code></td>
                  <td>Read / Write</td>
                  <td>0 – 9999 s</td>
                  <td>Reset time in seconds (0 = Integral Action OFF)</td>
                </tr>
                <tr>
                  <td><strong>Td (Derivative Time)</strong></td>
                  <td><code>4107</code> (44108)</td>
                  <td><code>100BH</code></td>
                  <td>Read / Write</td>
                  <td>0 – 9999 s</td>
                  <td>Rate action time in seconds (0 = Derivative OFF)</td>
                </tr>
                <tr>
                  <td><strong>Bias</strong></td>
                  <td><code>4108</code> (44109)</td>
                  <td><code>100CH</code></td>
                  <td>Read / Write</td>
                  <td>0.0 – 100.0 %</td>
                  <td>Manual reset / feedforward output offset</td>
                </tr>
                <tr className="highlight-row">
                  <td><strong>MV / OP (Controller Output)</strong></td>
                  <td><code>4114</code> (44115)</td>
                  <td><code>1012H</code></td>
                  <td>Read / Write</td>
                  <td>0.0 – 100.0 %</td>
                  <td>Valve command percentage (4–20 mA to I/P converter)</td>
                </tr>
                <tr>
                  <td><strong>Auto Tuning (AT)</strong></td>
                  <td><code>2067</code> (42068)</td>
                  <td><code>0813H</code></td>
                  <td>Read / Write</td>
                  <td>0 = Stop, 1 = Start</td>
                  <td>Triggers controller hardware self-tuning cycle</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-section">
          <h2 className="section-title">📐 Key Tuning Equations (Ziegler-Nichols)</h2>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Open Loop (Process Reaction Method)</th>
                  <th>Closed Loop (Ultimate Gain Method)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>P Mode</strong></td>
                  <td><code>Kp = 1 / (R · L)</code>, Ti = ∞, Td = 0</td>
                  <td><code>Kp = 0.5 · Ku</code>, Ti = ∞, Td = 0</td>
                </tr>
                <tr>
                  <td><strong>PI Mode</strong></td>
                  <td><code>Kp = 0.9 / (R · L)</code>, <code>Ti = L / 0.3</code></td>
                  <td><code>Kp = 0.45 · Ku</code>, <code>Ti = Tu / 1.2</code></td>
                </tr>
                <tr>
                  <td><strong>PID Mode</strong></td>
                  <td><code>Kp = 1.2 / (R · L)</code>, <code>Ti = 2 · L</code>, <code>Td = 0.5 · L</code></td>
                  <td><code>Kp = 0.6 · Ku</code>, <code>Ti = 0.5 · Tu</code>, <code>Td = 0.125 · Tu</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-section">
          <h2 className="section-title">🔌 Hardware &amp; Terminal Wiring Quick Reference</h2>
          <div className="component-details-flex">
            <div className="component-text">
              <ul className="doc-list">
                <li><strong>WIKA Pressure Transmitter:</strong> 2-wire loop-powered (24 VDC). Positive terminal to +24V, Negative return to Controller Input (Pins 13 &amp; 14). Output: 4–20 mA corresponding to 0–250 mmwc liquid column.</li>
                <li><strong>Delta DTB9696CR Terminals:</strong> Pins 1 &amp; 2: 100–240 VAC Power Supply; Pins 7 &amp; 8: 4–20 mA Current Output to I/P Converter; Pins 13 &amp; 14: Analog Input; Pins 11 &amp; 12: RS-485 Communication (D+ / D-).</li>
                <li><strong>ControlAir Type 500 I/P Converter:</strong> Input 4–20 mA DC; Output 3–15 psi (0.2–1.0 bar); Air Supply: 20–30 psi clean, dry, oil-free air.</li>
                <li><strong>Pneucon Pneumatic Control Valve:</strong> 1/2&quot; Globe valve, Air-to-Close (Fail Open) / Air-to-Open (Fail Close), 3–15 psi pneumatic diaphragm actuator.</li>
              </ul>
            </div>
            <div className="component-image-box">
              <figure className="guide-figure">
                <img src="/docs/guide_assets/fig_p51_Image380.webp" alt="Delta DTB9696 Terminal Wiring Diagram" className="figure-img" />
                <figcaption>Figure: Delta DTB9696 Terminal Connection Diagram</figcaption>
              </figure>
            </div>
          </div>
        </section>
      </div>
    ),
  },

  // ── Overview Page ───────────────────────────────────────────
  {
    id: 'sec-overview',
    chapterNumber: 'Intro',
    chapterTitle: 'ACE 101 Overview',
    sectionNumber: 'Intro',
    title: 'ACE 101 Level Process Trainer Overview',
    pageNumber: 2,
    render: () => (
      <div className="page-body">
        <div className="doc-callout info">
          <strong>Level Process Trainer (ACE 101):</strong> Manufactured by Advanced Control Equipments. Designed for hands-on experimentation in industrial process dynamics, closed-loop PID regulation, and system identification.
        </div>

        <section className="page-section">
          <h3 className="subsection-title">System Overview &amp; Principles</h3>
          <p className="doc-paragraph">
            The Level Process Trainer (ACE 101) is a comprehensive laboratory workstation designed to facilitate the study of liquid level dynamics in open and closed loops. It demonstrates the fundamental behavior of fluid containment, hydrostatic head sensing, pneumatic valve actuation, and digital PID feedback regulation.
          </p>
          <p className="doc-paragraph">
            The apparatus comprises a transparent acrylic process column equipped with a graduated scale, a continuous-duty centrifugal pump, a closed-loop water recirculation tank (sump), an industrial piezoelectric level transmitter (WIKA A-10), an electro-pneumatic converter (ControlAir Type 500), and an equal-percentage pneumatic control valve (Pneucon). Real-time computation and loop closure are handled through a digital process controller (Delta DTB9696CR) interfaced with host PC software via RS-485 Modbus RTU communication.
          </p>
          <div className="info-grid">
            <div className="info-card">
              <h4>🎯 Core Objectives</h4>
              <ul className="doc-list">
                <li>Characterize level sensor calibration across 0–250 mmwc head.</li>
                <li>Understand On/Off, P, PI, PD, and full PID control modes.</li>
                <li>Perform Open-Loop (Process Reaction Curve) and Closed-Loop (Ultimate Gain) tuning.</li>
                <li>Estimate First-Order Plus Dead-Time (FOPDT) empirical transfer functions.</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>⚙️ Key Specifications</h4>
              <ul className="doc-list">
                <li><strong>Process Tank:</strong> Transparent acrylic, 0–250 mm working range.</li>
                <li><strong>Pump:</strong> Centrifugal 0.25 HP, 230 VAC 50 Hz.</li>
                <li><strong>Control Valve:</strong> Pneucon 1/2&quot; pneumatic diaphragm, 3–15 psi.</li>
                <li><strong>Controller:</strong> Delta DTB9696CR with RS-485 Modbus RTU.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    ),
  },

  // ── 1.1 Description ─────────────────────────────────────────
  {
    id: 'sec-1-1',
    chapterNumber: '1',
    chapterTitle: '1. Product Details',
    sectionNumber: '1.1',
    title: '1.1 System Description',
    pageNumber: 3,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The Level Process Trainer (ACE 101) is a compact experimental setup designed to help users understand the principles of level control in process systems. It consists of a process tank, water reservoir, centrifugal pump, level transmitter, pneumatic control valve, I/P converter, rotameter, and a digital indicating controller (Delta DTB9696CR).
          </p>
          <p className="doc-paragraph">
            Water is pumped from the reservoir to the process tank through the pneumatic control valve and rotameter. The water level in the process tank is sensed by a piezoelectric pressure transmitter which outputs a 4–20 mA current signal corresponding to the liquid head. The signal is fed to the digital controller which compares it with the desired set point and generates a 4–20 mA control output. This current is converted into a 3–15 psi pneumatic signal by the I/P converter to actuate the control valve, thereby regulating the inflow to maintain the level at the set point.
          </p>
          <p className="doc-paragraph">
            The trainer provides an ideal platform for studying open loop and closed loop responses, tuning PID parameters, evaluating stability, and deriving empirical first-order-plus-dead-time (FOPDT) models.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p4_Image135.webp" alt="Figure 1.1: Schematic Flow Diagram of Level Process Trainer" className="figure-img" />
            <figcaption>Figure 1.1: Schematic Flow Diagram of Level Process Trainer (ACE 101)</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 1.2 Specification Details ───────────────────────────────
  {
    id: 'sec-1-2',
    chapterNumber: '1',
    chapterTitle: '1. Product Details',
    sectionNumber: '1.2',
    title: '1.2 Specification Details',
    pageNumber: 4,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The Level Process Trainer (ACE 101) incorporates industrial-grade components designed to rigorous standards for laboratory and educational environments. The detailed technical specifications are tabulated below:
          </p>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Technical Specification / Parameter</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Process Tank</strong></td>
                  <td>Transparent Acrylic cylindrical column, Height: 350 mm, Inner Diameter: 150 mm, Calibrated linear height scale: 0 – 250 mmwc, with overflow weir and manual drain valve.</td>
                </tr>
                <tr>
                  <td><strong>Supply / Sump Tank</strong></td>
                  <td>Stainless Steel (SS304) construction, Capacity: 20 Liters, with suction strainer, drain valve, and removable top cover.</td>
                </tr>
                <tr>
                  <td><strong>Water Circulation Pump</strong></td>
                  <td>Monoblock centrifugal pump, 0.25 HP, 230 V AC, 50 Hz single-phase, maximum discharge head 12 meters.</td>
                </tr>
                <tr>
                  <td><strong>Level Transmitter</strong></td>
                  <td>WIKA piezoresistive pressure transmitter (Model SL-1 / A-10), Range: 0 – 50 mbar (0 – 250 mmwc head), Output: 4 – 20 mA (calibrated 4–12 mA), 2-wire loop powered (24 VDC).</td>
                </tr>
                <tr>
                  <td><strong>Digital Process Controller</strong></td>
                  <td>Delta DTB9696CR, Dual 4-digit 7-segment LED display, Universal analog input, 4–20 mA control output, RS-485 Modbus RTU communication port, 100–240 VAC power.</td>
                </tr>
                <tr>
                  <td><strong>I/P Converter</strong></td>
                  <td>ControlAir Type 500 electro-pneumatic transducer, Input: 4 – 20 mA DC, Output: 3 – 15 psig (0.2 – 1.0 bar), Supply pressure: 20 – 30 psig clean dry air.</td>
                </tr>
                <tr>
                  <td><strong>Pneumatic Control Valve</strong></td>
                  <td>Pneucon Model PVCT-119, Valve size: 15 mm (1/2&quot;), Type: Linear, Air-to-Close (Fail Open) / Air-to-Open (Fail Close), Globe 2-way body CCS with SS trim, Cv = 0.63.</td>
                </tr>
                <tr>
                  <td><strong>Rotameter</strong></td>
                  <td>Eureka industrial rotameter, Range: 10 to 100 LPH (Water), Borosilicate glass metering tube with SS316 float, accuracy ±2% of Full Scale.</td>
                </tr>
                <tr>
                  <td><strong>Air Filter Regulator (AFR)</strong></td>
                  <td>Standard industrial regulator with 25-micron filter element, Output range: 0 – 2.5 bar (0 – 35 psi) with dual-scale pressure gauge.</td>
                </tr>
                <tr>
                  <td><strong>Overall Dimensions</strong></td>
                  <td>1200 mm (Length) × 600 mm (Width) × 1400 mm (Height); sturdy Mild Steel tubular frame with powder-coated anti-corrosion finish and caster wheels.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },

  // ── 1.3 P&I Diagram ─────────────────────────────────────────
  {
    id: 'sec-1-3',
    chapterNumber: '1',
    chapterTitle: '1. Product Details',
    sectionNumber: '1.3',
    title: '1.3 P&I Diagram & Flow Arrangement',
    pageNumber: 5,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The Piping and Instrumentation Diagram (P&amp;ID) illustrates the interconnection of process equipment and the instrumentation used to control the process. In this setup, the process fluid (water) is circulated in a closed loop from the sump tank to the transparent acrylic process tank and drained back.
          </p>
          <p className="doc-paragraph">
            The water is drawn from the sump tank by the centrifugal pump and forced through the pneumatic control valve and rotameter into the bottom inlet of the process tank. The level of water accumulates in the tank, creating hydrostatic head at the base. The WIKA pressure transmitter senses this liquid column and sends a 4–20 mA current signal to the Delta DTB9696 controller. The controller compares the signal against the operator setpoint, executes the programmed control algorithm (On/Off, P, PI, PD, or PID), and delivers a 4–20 mA output to the ControlAir I/P converter. The I/P converter converts the electrical current into a proportional 3–15 psi pneumatic signal that modulates the pneumatic control valve stroke, thereby maintaining stable water level.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p5_Image138.webp" alt="Figure 1.2: Piping & Instrumentation Diagram of Level Process Trainer" className="figure-img" />
            <figcaption>Figure 1.2: Piping &amp; Instrumentation Diagram (P&amp;ID) of Level Process Trainer (ACE 101)</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 1.4 Component Details ───────────────────────────────────
  {
    id: 'sec-1-4',
    chapterNumber: '1',
    chapterTitle: '1. Product Details',
    sectionNumber: '1.4',
    title: '1.4 Hardware & Component Overview',
    pageNumber: 6,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The major hardware components of the ACE 101 trainer are mounted on an ergonomically designed frame for easy accessibility, inspection, and maintenance. The layout allows students and engineers to observe the relationship between the physical process and instrumentation signals.
          </p>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Component Name</th>
                  <th>Key Function / Role in Loop</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1</td><td><strong>Process Tank</strong></td><td>Holds the liquid column whose level is the controlled Process Variable (PV).</td></tr>
                <tr><td>2</td><td><strong>Sump Tank</strong></td><td>Stores the 20-liter water inventory for closed-circuit recirculation.</td></tr>
                <tr><td>3</td><td><strong>Water Pump</strong></td><td>Provides motive pressure head to circulate water through piping and control valve.</td></tr>
                <tr><td>4</td><td><strong>Level Sensor (Transmitter)</strong></td><td>Measures hydrostatic pressure head and converts it to a 4–20 mA electrical signal.</td></tr>
                <tr><td>5</td><td><strong>Pneumatic Control Valve</strong></td><td>Final control element modulating fluid inflow to the process tank.</td></tr>
                <tr><td>6</td><td><strong>I/P Converter</strong></td><td>Transduces the 4–20 mA controller output into 3–15 psi pneumatic actuation pressure.</td></tr>
                <tr><td>7</td><td><strong>Rotameter</strong></td><td>Provides visual real-time flow indication of water entering the process tank (10–100 LPH).</td></tr>
                <tr><td>8</td><td><strong>Air Filter Regulator</strong></td><td>Conditions and regulates lab compressed air supply to a steady 20 psi.</td></tr>
                <tr><td>9</td><td><strong>Digital Indicating Controller</strong></td><td>Compares PV to Setpoint and executes PID regulation algorithm.</td></tr>
                <tr><td>10</td><td><strong>USB to RS-485 Converter</strong></td><td>Bridges hardware Modbus RTU serial bus to host PC software.</td></tr>
              </tbody>
            </table>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p6_Image147.webp" alt="Figure 1.3: Component Identification & Layout" className="figure-img" />
            <figcaption>Figure 1.3: Hardware Component Identification and Layout (ACE 101)</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 1.5 Requirements ────────────────────────────────────────
  {
    id: 'sec-1-5',
    chapterNumber: '1',
    chapterTitle: '1. Product Details',
    sectionNumber: '1.5',
    title: '1.5 Electrical & Utility Requirements',
    pageNumber: 7,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Before commissioning and operating the Level Process Trainer (ACE 101), ensure that the laboratory meets the following utility and environmental requirements:
          </p>
          <ul className="doc-list">
            <li><strong>Electrical Power Supply:</strong> 230 V AC (±10%), 50 Hz, single phase, 5 Ampere supply with earth connection. Ensure low earth-to-neutral voltage (&lt; 3V) to prevent signal noise on analog 4–20 mA lines.</li>
            <li><strong>Water Supply:</strong> Approximately 20 Liters of clean, filtered tap water or distilled water for filling the sump tank. Water should be free of suspended solids, algae, or sediment to avoid clogging the pump impeller, rotameter float, or transmitter diaphragm.</li>
            <li><strong>Compressed Air Supply:</strong> Clean, dry, and oil-free compressed air supply providing an inlet pressure of 20 to 30 psi (1.4 to 2.1 bar) to the Air Filter Regulator. A laboratory air compressor or central pneumatic distribution line can be used.</li>
            <li><strong>Host Computer / Laptop:</strong> Personal computer running Windows 7, 8, 10, or 11 with an available USB port for connecting the USB-to-RS485 communication converter. Minimum 4GB RAM and 500MB free disk space.</li>
            <li><strong>Installation Space:</strong> Minimum floor space of 1.5 m × 1.2 m on a level, vibration-free laboratory floor. Provide proper drainage nearby for tank emptying during maintenance.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 1.6 Warranty Details ────────────────────────────────────
  {
    id: 'sec-1-6',
    chapterNumber: '1',
    chapterTitle: '1. Product Details',
    sectionNumber: '1.6',
    title: '1.6 Warranty Details',
    pageNumber: 8,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The equipment is warranted against manufacturing defects for a period of 12 months from the date of supply or commissioning, whichever is earlier.
          </p>
          <div className="doc-callout info">
            <strong>Warranty Terms and Conditions:</strong>
            <ul className="doc-list">
              <li>The warranty covers free repair or replacement of any component proven to be defective due to faulty material or manufacturing workmanship.</li>
              <li>Consumables, rubber gaskets, O-rings, and glassware (such as the rotameter tube) are not covered under warranty against physical breakage or thermal shock.</li>
              <li>The warranty becomes void if the equipment is operated without water in the sump tank (causing dry run damage to the pump seal), subjected to electrical over-voltage/surges, or subjected to unauthorized mechanical or electronic modifications.</li>
              <li>Any claims under warranty must be notified promptly in writing along with serial number, invoice details, and descriptions of the defect.</li>
            </ul>
          </div>
        </section>
      </div>
    ),
  },
  // ── 2.1 Essentials of Process Control ─────────────────────────
  {
    id: 'sec-2-1',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.1',
    title: '2.1 Essentials of Process Control',
    pageNumber: 9,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Process controls is a mixture between the statistics and engineering discipline that deals with the mechanism, architectures, and algorithms for controlling a process. Some examples of controlled processes are:
          </p>
          <ol className="doc-list numbered">
            <li>Controlling the temperature of a water stream by controlling the amount of steam added to the shell of a heat exchanger.</li>
            <li>Operating a jacketed reactor isothermally by controlling the mixture of cold water and steam that flows through the jacket of a jacketed reactor.</li>
            <li>Maintaining a set ratio of reactants to be added to a reactor by controlling their flow rates.</li>
            <li>Controlling the height of fluid in a tank to ensure that it does not overflow.</li>
          </ol>

          <h3 className="subsection-title">The Objectives of Control:</h3>
          <ul className="doc-list">
            <li>Maintain the process at the operational conditions and set points</li>
            <li>Transition the process from one operational condition to another</li>
          </ul>

          <h3 className="subsection-title">Definitions:</h3>
          <p className="doc-paragraph">
            <strong>Input Variable:</strong> This variable shows the effect of the surroundings on the process. It normally refers to those factors that influence the process. An example of this would be the flow rate of the steam through a heat exchanger that would change the amount of energy put into the process. There are effects of the surrounding that are controllable and some that are not. These are broken down into two types of inputs:
          </p>
          <ul className="doc-list">
            <li><strong>a. Manipulated inputs:</strong> variable in the surroundings can be control by an operator or the control system in place.</li>
            <li><strong>b. Disturbances:</strong> inputs that cannot be controlled by an operator or control system. There exist both measurable and immeasurable disturbances.</li>
          </ul>
          <p className="doc-paragraph">
            <strong>Output variable:</strong> Also known as the control variable. These are the variables that are process outputs that effect the surroundings. An example of this would be the amount of CO2 gas that comes out of a combustion reaction. These variables may or may not be measured.
          </p>
          <p className="doc-paragraph">
            As we consider a controls problem, we are able to look at two major control structures:
          </p>
          <ul className="doc-list">
            <li><strong>Single input-Single Output (SISO):</strong> for one control (output) variable there exist one manipulate (input) variable that is used to affect the process.</li>
            <li><strong>Multiple input-multiple output (MIMO):</strong> There are several control (output) variable that are affected by several manipulated (input) variables used in a given process.</li>
          </ul>

          <h3 className="subsection-title">Terminology:</h3>
          <p className="doc-paragraph">The terms commonly used in process control is listed out and a brief description is given below:</p>
          <ul className="doc-list">
            <li><strong>Bias:</strong> It&#39;s the amount of controller output when error is zero in a proportional control mode.</li>
            <li><strong>Cascade:</strong> A control system with 2 or more controllers, a &quot;Master&quot; and &quot;Slave&quot; loop. The output of the &quot;Master&quot; controller is the setpoint for the &quot;Slave&quot; controller.</li>
            <li><strong>Dead Time:</strong> The amount of time it takes for a process to start changing after a disturbance in the system.</li>
            <li><strong>Derivative Control:</strong> The &quot;D&quot; part of a PID controller. With derivative action the controller output is proportional to the rate of change of the process variable or error.</li>
            <li><strong>Error:</strong> In process controls, error is defined as: Error = setpoint - process variable.</li>
            <li><strong>Integral Control:</strong> The &quot;I&quot; part of a PID controller. With integral action the controller output is proportional to the amount and duration of the error signal.</li>
            <li><strong>PID Controller:</strong> PID controllers are designed to eliminate the need for continuous operator attention. They are used to automatically adjust system variables to hold a process variable at a setpoint. Error is defined above as the difference between setpoint and process variable.</li>
            <li><strong>Proportional Control:</strong> The &quot;P&quot; part of a PID controller. With proportional action the controller output is proportional to the amount of the error signal.</li>
            <li><strong>Setpoint:</strong> The setpoint is where you would like a controlled process variable to be.</li>
          </ul>

          <h3 className="subsection-title">Practical Considerations:</h3>
          <p className="doc-paragraph">The following concepts will often be used in practical process control loop / PID controller design:</p>
          <ul className="doc-list">
            <li><strong>Action:</strong> It determines the controller output will vary from &#39;low to high&#39; or &#39;high to low&#39; for a particular error. It can be explained as, if PV is increasing above setpoint (&#39;high&#39;), controller output (CO) is also increasing (&#39;high&#39;), then it is &#39;Direct&#39; action. Otherwise if PV is &#39;low&#39;, controller output is &#39;high&#39;, it is &#39;Reverse&#39; action. Action of the controller also determines whether the controller output will be 0% or 100% during startup from zero condition.</li>
            <li><strong>Auto / Manual Mode:</strong> In Auto mode, the controller (software / hardware) will execute the control algorithm and gives the output. Whereas, in manual mode, the control algorithm will not be executed and the controller takes user input as controller output. In a practical scenario, manual mode will be used during startup and once the process variable reaches close to the setpoint, the controller will be shifted from Manual to Auto mode.</li>
            <li><strong>Bumpless Transfer:</strong> Bumpless transfer allows the controller to be switched between manual and automatic modes and back again without the control output suddenly &#39;bumping&#39; to a different value. Bumpless transfer is often implemented by making the setpoint track the PV when in manual mode. On changing back to auto, the SP and PV will initially be the same (i.e. error=0) so the output will also stay the same. The disadvantage is that the operator has to re-adjust the setpoint back to where it was. There are other ways of doing it. For example, when in manual mode, any change to the control output is added / subtracted from the integral term. When the controller is put back into auto, it starts off with the integrator maintaining the current control output rather than jumping back to the previous value.</li>
            <li><strong>Anti-Reset Windup:</strong> Also known as integrator windup or reset windup, refers to the situation in a PID feedback controller where a large change in setpoint occurs (say a positive change) and the integral terms accumulates a significant error during the rise (windup), thus overshooting and continuing to increase as this accumulated error is unwound (offset by errors in the other direction). The specific problem is the excess overshooting.
              <p className="doc-paragraph" style={{ marginTop: '8px', marginBottom: '4px' }}>This problem can be addressed by:</p>
              <ul className="doc-list" style={{ marginTop: '4px' }}>
                <li>Initializing the controller integral to a desired value, for instance to the value before the problem</li>
                <li>Increasing the setpoint in a suitable ramp</li>
                <li>Disabling the integral function until the to-be-controlled process variable (PV) has entered the controllable region</li>
                <li>Preventing the integral term from accumulating above or below pre-determined bounds</li>
                <li>Back-calculating the integral term to constrain the process output within feasible bounds.</li>
              </ul>
            </li>
            <li><strong>Servo and Regulatory Responses:</strong> The effect of Process Variable (PV) for a setpoint change is called as servo response whereas the effect for a load disturbance is called as regulatory response.</li>
          </ul>

          <div className="doc-callout info">
            <strong>References:</strong>
            <ul className="doc-list">
              <li>Chemical Process Dynamics and Controls open textbook, University of Michigan.</li>
              <li>http://control.com/thread/1026220163</li>
              <li>https://en.wikipedia.org/wiki/Integral_windup</li>
            </ul>
          </div>
        </section>
      </div>
    ),
  },

  // ── 2.2 Feedback Control ──────────────────────────────────────
  {
    id: 'sec-2-2',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.2',
    title: '2.2 Feedback Control Architecture',
    pageNumber: 10,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Feedback control is an operation where a disturbance enters the process, causing the controlled variable to deviate from its target setpoint. The actual value is measured by a sensor/transmitter, compared with the reference set point to generate an error signal, and this error is fed to the controller. The controller acts to manipulate the process input so as to drive the error to zero.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p10_Image156.webp" alt="Figure 2.1: Basic Feedback Control Loop Architecture" className="figure-img" />
            <figcaption>Figure 2.1: Basic Feedback Control Loop Architecture</figcaption>
          </figure>
          <p className="doc-paragraph">
            The feedback control loop comprises five essential components:
          </p>
          <ol className="doc-list numbered">
            <li><strong>Error Detector:</strong> Computes the deviation <code>e(t) = SP(t) - PV(t)</code>.</li>
            <li><strong>Controller:</strong> Applies a mathematical control algorithm (P, PI, PD, or PID) to calculate the necessary controller output command.</li>
            <li><strong>Final Control Element:</strong> Typically a pneumatic or electric control valve that modulates the flow of the manipulated variable into the system.</li>
            <li><strong>Process:</strong> The dynamic physical system whose condition is to be held at the desired state (e.g., the liquid level in the acrylic process column).</li>
            <li><strong>Sensor / Transmitter:</strong> Detects the actual process condition and transforms it into a standardized transmission signal (4–20 mA current signal).</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p11_Image159.webp" alt="Figure 2.2: Functional Block Diagram of Process Control System" className="figure-img" />
            <figcaption>Figure 2.2: Functional Block Diagram of Process Control System</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 2.3.1 On/Off Control Mode ─────────────────────────────────
  {
    id: 'sec-2-3-onoff',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.3.1',
    title: '2.3.1 On / Off Control Mode',
    pageNumber: 11,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <h3 className="subsection-title">Introduction to Controller Modes</h3>
          <p className="doc-paragraph">
            A controller generates a control signal to the final control element, based on a measured deviation of the controlled variable from the setpoint. The choice of operating mode for any given process-control system is a complicated decision. It involves not only process characteristics but cost analysis, product rate, and other industrial factors. At the outset, the process-control technologist should have a good understanding of the operational mechanism of each mode and its advantages and disadvantages.
          </p>
          <h3 className="subsection-title">Two-Position Mode:</h3>
          <p className="doc-paragraph">
            The most elementary controller mode is the ON/OFF, or two-position, mode. This is an example of a discontinuous mode. It is the simplest and the cheapest, and often suffices when its disadvantages are tolerable. Although an analytic equation cannot be written, we can, in general, write as given below:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p12_Image167.webp" alt="Equation 2.1: Analytic Relation for Two-Position Mode" className="figure-img" />
            <figcaption>Equation 2.1: Analytic Relation for Two-Position Mode</figcaption>
          </figure>
          <p className="doc-paragraph">
            This relation shows that when the measured value is less than the setpoint, full controller output results. When it is more than the setpoint, the controller output is zero. A space heater is a common example. If the temperature drops below a setpoint, the heater is turned ON. If the temperature rises above the setpoint, it turns OFF.
          </p>
          <h3 className="subsection-title">Neutral Zone &amp; Differential Gap:</h3>
          <p className="doc-paragraph">
            In virtually any practical implementation of the two-position controller, there is an overlap as ep increases through zero or decreases through zero. In this span, no change in controller output occurs. This is best shown in Figure below, which plots controller output (%) versus ep for a two-position controller.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p12_Image169.webp" alt="Figure 2.3: Two-Position Controller Output vs Error Characteristic" className="figure-img" />
            <figcaption>Figure 2.3: Two-Position Controller Output vs Error Characteristic</figcaption>
          </figure>
          <p className="doc-paragraph">
            We see that until an increasing error changes by Δep above zero, the controller output will not change state. In decreasing, it must fall Δep below zero before the controller changes to the 0% rating. The range 2Δep, which is referred to as the neutral zone or differential gap, is often purposely designed above a certain minimum quantity to prevent excessive cycling. The existence of such a neutral zone is an example of desirable hysteresis in a system.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p13_Image172.webp" alt="Figure 2.4: Neutral Zone and Differential Gap Hysteresis" className="figure-img" />
            <figcaption>Figure 2.4: Neutral Zone and Differential Gap Hysteresis</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 2.3.2 Proportional Mode (P Mode) ──────────────────────────
  {
    id: 'sec-2-3-p',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.3.2',
    title: '2.3.2 Proportional Mode (P Mode)',
    pageNumber: 12,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            In this mode, over some range of errors about the setpoint, each value of error has a unique value of controller output in one-to-one correspondence. The range of error to cover the 0% to 100% controller output is called the proportional band, because the one-to-one correspondence exists only for errors in this range. This mode can be expressed by:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p13_Image174.webp" alt="Equation 2.2: Proportional Controller Equation" className="figure-img" />
            <figcaption>Equation 2.2: Proportional Controller Equation</figcaption>
          </figure>
          <p className="doc-paragraph">
            where, P0 = controller output with no error (%)<br />
            Kp = proportional gain between error and controller output (% per %)
          </p>
          <h3 className="subsection-title">Proportional Band:</h3>
          <p className="doc-paragraph">
            The proportional band is dependent on the gain. A high gain means large response to an error, but also a narrow error band within which the output is not saturated. In general, the proportional band is defined by the equation:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p13_Image176.webp" alt="Equation 2.3: Proportional Band Definition" className="figure-img" />
            <figcaption>Equation 2.3: Proportional Band Definition: PB = 100 / Kp</figcaption>
          </figure>
          <p className="doc-paragraph">
            A plot of the proportional mode output versus error of this control mode is shown in Figure below. In this case, P0 has been set to 50% and two different gains have been used.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p14_Image181.webp" alt="Figure 2.5: Proportional Mode Output vs Error for Different Gains" className="figure-img" />
            <figcaption>Figure 2.5: Proportional Mode Output vs Error for Different Gains</figcaption>
          </figure>
          <h3 className="subsection-title">Offset:</h3>
          <p className="doc-paragraph">
            An important characteristic of the proportional control mode is that it produces a permanent residual error in the operating point of the controlled variable when a change in load occurs. This error is referred to as offset. It can be minimized by a larger constant, Kp, which also reduces the proportional band. To see how offset occurs, consider a system under nominal load with the controller at 50% and the error zero, as shown in Figure below:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p14_Image183.webp" alt="Figure 2.6: Occurrence of Offset under Load Change" className="figure-img" />
            <figcaption>Figure 2.6: Occurrence of Offset under Load Change</figcaption>
          </figure>
          <h3 className="subsection-title">Summary:</h3>
          <ul className="doc-list">
            <li>If the error is zero, the output is a constant equal to P0.</li>
            <li>If there is error, for every 1% of error, a correction of Kp percent is added to or subtracted from P0, depending on the sign of the error.</li>
            <li>There is a band of error about zero of magnitude PB within which the output is not saturated at 0% or 100%.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 2.3.3 Proportional-Integral (PI Mode) ─────────────────────
  {
    id: 'sec-2-3-pi',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.3.3',
    title: '2.3.3 Proportional-Integral Mode (PI Mode)',
    pageNumber: 13,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Integral action is provided by summing the error over time, multiplying that sum by a gain, and adding the result to the present controller output. This mode is represented by an integral equation:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p15_Image186.webp" alt="Equation 2.4: Integral Control Mode Equation" className="figure-img" />
            <figcaption>Equation 2.4: Integral Control Mode Equation</figcaption>
          </figure>
          <p className="doc-paragraph">
            where p(0) is the controller output when the integral action starts. The gain KI expresses how much controller output in percent is needed for every percent-time accumulation of error.
          </p>
          <h3 className="subsection-title">It can be summarized as:</h3>
          <ul className="doc-list">
            <li>If the error is zero, the output stays fixed at a value equal to what it was when the error went to zero.</li>
            <li>If the error is not zero, the output will begin to increase or decrease at a rate of KI percent/second for every 1% of error.</li>
            <li>The integral gain, KI, is often represented by the inverse, which is called the integral time, or the reset action, TI = 1 / KI.</li>
          </ul>
          <h3 className="subsection-title">Proportional-Integral Control (PI):</h3>
          <p className="doc-paragraph">
            This is a control mode that results from a combination of the proportional mode and the integral mode. The analytic expression for this control process is found from a series combination of proportional and integral modes as given below:
          </p>
          <div className="doc-formula" style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '6px', margin: '16px 0' }}>
            <code>p(t) = Kp · e(t) + Kp · (1 / TI) · ∫ e(t) dt + PI(0)</code>
          </div>
          <p className="doc-paragraph">
            where, PI(0) = integral term value at t = 0 (initial value). The integral term continuously ramps the output until steady-state offset is driven to zero.
          </p>
        </section>
      </div>
    ),
  },

  // ── 2.3.4 Proportional-Derivative (PD Mode) ───────────────────
  {
    id: 'sec-2-3-pd',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.3.4',
    title: '2.3.4 Proportional-Derivative Mode (PD Mode)',
    pageNumber: 14,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Derivative controller action responds to the rate at which the error is changing—that is, the derivative of the error. Appropriately, the equation for this mode is given by the expression:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p15_Image188.webp" alt="Equation 2.5: Derivative Control Mode Equation" className="figure-img" />
            <figcaption>Equation 2.5: Derivative Control Mode Equation</figcaption>
          </figure>
          <p className="doc-paragraph">
            where the gain, KD, tells us by how much percent to change the controller output for every percent-per-second rate of change of error. Derivative action is not used alone because it provides no output when the error is constant. Derivative controller action is also called rate action and anticipatory control.
          </p>
          <h3 className="subsection-title">The derivative mode can be summarized as:</h3>
          <ul className="doc-list">
            <li>If the error is zero, the mode provides no output.</li>
            <li>If the error is constant in time, the mode provides no output.</li>
            <li>If the error is changing in time, the mode contributes an output of percent for every 1%-per-second rate of change of error.</li>
            <li>For direct action, a positive rate of change of error produces a positive derivative mode output.</li>
          </ul>
          <h3 className="subsection-title">Proportional-Derivative Control Mode (PD):</h3>
          <p className="doc-paragraph">
            The analytic expression for this mode is found from a combination of proportional and derivative mode as given below:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p16_Image191.webp" alt="Equation 2.6: Proportional-Derivative (PD) Equation" className="figure-img" />
            <figcaption>Equation 2.6: Proportional-Derivative (PD) Analytic Expression</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 2.3.5 Three-Mode Controller (PID Mode) ───────────────────
  {
    id: 'sec-2-3-pid',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.3.5',
    title: '2.3.5 Three-Mode Controller (PID Mode)',
    pageNumber: 15,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            One of the most powerful but complex controller mode operations combines the proportional, integral, and derivative modes. This system can be used for virtually any process condition. The analytic expression is:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p16_Image193.webp" alt="Equation 2.7: Three-Mode Controller (PID) Analytic Expression" className="figure-img" />
            <figcaption>Equation 2.7: Three-Mode Controller (PID) Analytic Expression</figcaption>
          </figure>
          <p className="doc-paragraph">
            The three terms operate in synergy:
          </p>
          <ul className="doc-list">
            <li><strong>Proportional Action (P):</strong> Provides immediate corrective force proportional to the magnitude of the present error.</li>
            <li><strong>Integral Action (I):</strong> Eliminates residual steady-state error by accumulating past error over time.</li>
            <li><strong>Derivative Action (D):</strong> Dampens oscillations and counteracts sudden load disturbances by predicting future error based on rate of change.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 2.4 Test Inputs and Responses ────────────────────────────
  {
    id: 'sec-2-4',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.4',
    title: '2.4 Test Inputs and Responses',
    pageNumber: 16,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <h3 className="subsection-title">Introduction</h3>
          <p className="doc-paragraph">
            To systematically characterize the transient response of an output to a change in the input, the input change is usually standardized to a step change, a pulse change or an impulse change. These standard input changes are depicted in Figure below. A step change in the input, the simplest input change pattern, is normally used to characterize the process dynamics.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p17_Image201.webp" alt="Figure 2.7: Standard Test Inputs: Step, Pulse, and Impulse" className="figure-img" />
            <figcaption>Figure 2.7: Standard Test Inputs: Step, Pulse, and Impulse</figcaption>
          </figure>
          <h3 className="subsection-title">Basic Response Types:</h3>
          <p className="doc-paragraph">
            The dynamics of every process vary. Even so, the variety of transient responses can be characterized as an appropriate combination of one or more basic response types as described below.
          </p>
          <h4 className="subsubsection-title">First Order Lag:</h4>
          <p className="doc-paragraph">
            The first order lag is the simplest transient response where the output immediately responds to a step change in the input as given in Figure below. The ratio of the change in the output to the change in the input is referred to as the process gain, Kp. The time it takes for the output to reach 63.2% of its final value corresponds to the first order time constant τp. The output reaches ~95% of its final value in 3 time constants and reaches ~98% of its final value in 5 time constants. The time taken to reach 5τp is called as settling time.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p17_Image203.webp" alt="Figure 2.8: First Order Lag Transient Response to Step Input" className="figure-img" />
            <figcaption>Figure 2.8: First Order Lag Transient Response to Step Input</figcaption>
          </figure>
          <h4 className="subsubsection-title">Second Order Response:</h4>
          <p className="doc-paragraph">
            Sometimes, a step change in the input causes the output to oscillate before settling at the final steady state. The simplest such response corresponds to a second order underdamped system. The damping coefficient, ξ, can be used to characterize all second order responses – overdamped (ξ &gt; 1), critically damped (ξ = 1) and underdamped (ξ &lt; 1). The second order response is shown in Figure below:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p18_Image206.webp" alt="Figure 2.9: Second Order Underdamped Transient Response" className="figure-img" />
            <figcaption>Figure 2.9: Second Order Underdamped Transient Response</figcaption>
          </figure>
          <p className="doc-paragraph">
            To gain an appreciation of the impact of damping coefficient on the transient response, Table below reports the ratio of the second overshoot to the first overshoot for different values of ξ. A quarter decay ratio is observed for a damping coefficient of 0.218. Sustained oscillations (decay ratio = 1) are observed for a damping coefficient of 0. As ξ increases to 1, the overshoot in the output disappears.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p18_Image208.webp" alt="Table 2.1: Damping Coefficient vs Ratio of Overshoots" className="figure-img" />
            <figcaption>Table 2.1: Damping Coefficient vs Ratio of Second to First Overshoot</figcaption>
          </figure>
          <h3 className="subsection-title">Other Common Response Types:</h3>
          <p className="doc-paragraph">
            Other types of responses include the pure integrator, the inverse response and the pure dead-time. The transient response to a unit step change can be seen in Figure below and are self-explanatory:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p18_Image210.webp" alt="Figure 2.10: Pure Integrator, Inverse Response, and Pure Dead-Time Responses" className="figure-img" />
            <figcaption>Figure 2.10: Pure Integrator, Inverse Response, and Pure Dead-Time Responses</figcaption>
          </figure>
          <p className="doc-paragraph">
            The most common example of a pure integrator is the response of the tank level to change in the inlet / outlet feed rate. Unless the inlet and outlet flows are perfectly equal, the tank level is either rising or falling in direct proportion to the mismatch in the flows. The level in a tank is thus non self-regulating with respect to the connected flows. A controller must be used to stabilize all such non self-regulating process variables.
          </p>
          <p className="doc-paragraph">
            Dead time is very common in chemical processing systems and is due to transportation delay.
          </p>
          <p className="doc-paragraph">
            A very common example of the inverse response is the response of the liquid level in a boiler to a change in the heating duty. As the heating duty is increased, the vapour volume entrapped in the liquid increases causing the liquid interface level to rise initially. Over longer duration, the level of course reduces since more liquid is being vaporized. Dead time and inverse response can create control difficulties.
          </p>
          <h3 className="subsection-title">Unstable Systems:</h3>
          <p className="doc-paragraph">
            Some systems may be inherently unstable. Unstable transient responses are shown in Figure below. The unstable response may be non-oscillatory or oscillatory as in the Figure. Reactor temperature runaway is an example of an unstable process. A control system must be used to stabilize an inherently unstable system.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p19_Image213.webp" alt="Figure 2.11: Unstable Transient Responses" className="figure-img" />
            <figcaption>Figure 2.11: Unstable Transient Responses (Non-oscillatory &amp; Oscillatory)</figcaption>
          </figure>
          <h3 className="subsection-title">Combination of Basic Responses:</h3>
          <p className="doc-paragraph">
            Any transient response can be reasonably represented as a combination of the above basic response types. One such combination is the first order lag plus dead time (FOPDT) that has been found to represent the transient response of many chemical processing systems very well. The response is illustrated in Figure below:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p19_Image215.webp" alt="Figure 2.12: First Order Plus Dead Time (FOPDT) Response" className="figure-img" />
            <figcaption>Figure 2.12: First Order Plus Dead Time (FOPDT) Response</figcaption>
          </figure>
          <p className="doc-paragraph">
            Another example of such a combination is the inverse response which can be represented by the parallel combination of two first order lags. One of the lags has a small gain and a small time constant (ie a fast response) while the other lag has a gain of larger magnitude and opposite sign with a much larger time constant (i.e. a slow response in the opposite direction). Figure below illustrates this concept:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p20_Image218.webp" alt="Figure 2.13: Inverse Response from Parallel First-Order Lags" className="figure-img" />
            <figcaption>Figure 2.13: Inverse Response from Parallel Combination of First-Order Lags</figcaption>
          </figure>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p20_Image220.webp" alt="Figure 2.14: Block Diagram of Two Parallel First-Order Processes" className="figure-img" />
            <figcaption>Figure 2.14: Block Diagram of Two Parallel First-Order Processes</figcaption>
          </figure>
          <div className="doc-callout info">
            <strong>References:</strong> http://nptel.ac.in/courses/103104049/2
          </div>
        </section>
      </div>
    ),
  },

  // ── 2.5.1 Open Loop Tuning (Process Reaction Method) ──────────
  {
    id: 'sec-2-5-1',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.5.1',
    title: '2.5.1 Open Loop Tuning (Process Reaction Method)',
    pageNumber: 17,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The three-mode controller (PID) is the most common feedback controller used in industrial control. The method of determination of the optimum mode gains, depending on the nature and complexity of the process is known as loop tuning.
          </p>
          <p className="doc-paragraph">
            The three parameters should be selected to meet a set of defined goals. These goals typically require a plant response with minimum steady state error, insensitivity to load disturbances and an acceptable transient response to set point changes and disturbances.
          </p>
          <p className="doc-paragraph">
            In practice the choice of proportional band, integral time and derivative time is a compromise between the set point tracking and disturbances. If a mathematical model of the process is known, selecting the controller parameters is relatively simple. But in many industrial applications, a reliable mathematical model is not available or it is difficult to determine. So empirical rules are developed for PID tuning which do not require mathematical model. A widely used set of rules is proposed by Ziegler-Nichols by open loop method and close loop method in 1942.
          </p>
          <h3 className="subsection-title">2.5.1 Open loop tuning (Process reaction method):</h3>
          <p className="doc-paragraph">
            In open loop method the process is assumed to be model of first order. The step response i.e. process reaction curve, allows to obtain the approximate values of P, I and D parameters. With the feedback loop open, a step response is applied to manipulated variable and the values of P, I and D are estimated.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p21_Image223.webp" alt="Figure 2.15: Process Reaction Curve" className="figure-img" />
            <figcaption>Figure 2.15: Process Reaction Curve (S-Shaped Response)</figcaption>
          </figure>
          <p className="doc-paragraph">
            Where:<br />
            <strong>Slope R:</strong> Slope of line drawn tangent to the point of inflection.<br />
            <strong>Dead time L:</strong> Time between the step change and the point where tangent line crosses the initial value of the controlled variable (in min.)<br />
            <strong>P:</strong> Step change applied in %
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p21_Image225.webp" alt="Figure 2.16: Graphical Determination of Slope R and Dead Time L" className="figure-img" />
            <figcaption>Figure 2.16: Graphical Determination of Slope R and Dead Time L</figcaption>
          </figure>
          <p className="doc-paragraph">
            Using these parameters, the empirical equations are used to predict the controller settings for a decay ratio of 1/4. For P, PI and PID controller the parameters are calculated as follows:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p22_Image228.webp" alt="Table 2.2: Ziegler-Nichols Open Loop Tuning Parameters" className="figure-img" />
            <figcaption>Table 2.2: Ziegler-Nichols Open Loop Tuning Parameters Table</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 2.5.2 Closed Loop Tuning (Ultimate Gain Method) ───────────
  {
    id: 'sec-2-5-2',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.5.2',
    title: '2.5.2 Closed Loop Tuning (Ultimate Gain Method)',
    pageNumber: 18,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            This method is also called as ultimate gain method. The term ultimate was attached to this method because its use requires the determination of the ultimate proportional band and ultimate period. The ultimate proportional band, PBu is the minimum allowable value of proportional band (for a controller with only proportional mode) for which the system continuously oscillates at constant amplitude. The ultimate period, Tu is the period of response with the proportional band set to its ultimate value. To determine the ultimate proportional band and ultimate period the proportional band of the controller (with all integral and derivative action turned off) is gradually reduced until the process cycles continuously.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p22_Image230.webp" alt="Figure 2.17: Continuous Cycling Oscillations" className="figure-img" />
            <figcaption>Figure 2.17: Continuous Cycling Oscillations for Ultimate Gain Method</figcaption>
          </figure>
          <p className="doc-paragraph">
            The process is placed in the closed loop with a proportional controller. The Proportional band is decreased until the process goes to continuous oscillations. The corresponding value of proportional band is called as ultimate proportional band PBu and the period of oscillation is called the ultimate period Tu. The PID controller parameters are selected from the following table:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p22_Image232.webp" alt="Table 2.3: Ziegler-Nichols Closed Loop Tuning Parameters" className="figure-img" />
            <figcaption>Table 2.3: Ziegler-Nichols Closed Loop Tuning Parameters Table</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 2.6 Stability Analysis & Bode Plots ───────────────────────
  {
    id: 'sec-2-6',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.6',
    title: '2.6 Stability Analysis & Bode Plots',
    pageNumber: 19,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Laplace transform techniques are used to express mathematical models in terms of transfer functions in order to calculate transient response. An alternative way to interpret the transfer function model, referred to as the complex transfer function or the frequency response. It shows how the output response characteristics depend upon the frequency of the input signal. This is the origin of the term, frequency response.
          </p>
          <h3 className="subsection-title">Stability analysis by using bode plots:</h3>
          <p className="doc-paragraph">Frequency response may be plotted in three ways:</p>
          <ul className="doc-list">
            <li>The rectangular plot with amplitude ratio verses frequency and phase lag verses frequency.</li>
            <li>A polar plot with magnitude and phase shown in vector form with frequency as a parameter.</li>
            <li>A phase margin plot with magnitude shown verses a function of phase with frequency as a parameter.</li>
          </ul>
          <p className="doc-paragraph">
            If the system is linear, the output signal for sine wave input must be a sine wave having the same frequency as the input. Assume that the input to the first order system is suddenly switched from a constant input to a sine wave input. The initial slope of the sine wave input signal may be approximated by a ramp input or even exponential input.
          </p>
          <p className="doc-paragraph">
            If the input frequency is very low, period of the sine wave will be very long. Stated in another way, period is very much larger than the system time constant. Under this condition the output will have sufficient time to approach the condition, which is nearly in equilibrium with the input signal. Thus, at low frequencies both magnitude and phase angle of the output signal will be close to magnitude and phase angle of the input signal. However, as the frequency increases period decreases and the system do not have sufficient time to achieve the equilibrium status between input and output. Under these conditions output magnitude will decrease, and output phase angle will fall behind or lag the input phase angle. Thus, it is evident that any solution must show a decrease in ratio of output to input magnitude as frequency increases.
          </p>
          <h3 className="subsection-title">Magnitude and phase angle calculation:</h3>
          <p className="doc-paragraph">
            Let:<br />
            M = Magnitude ratio<br />
            A1 = Input amplitude (%)<br />
            A2 = Output amplitude (%)<br />
            Ø = Phase angle (degrees)<br />
            X = lag (seconds)<br />
            T = Period (seconds)<br />
            f = frequency (cycles per seconds) = 1/T.<br />
            Then:<br />
            <code>M = A2 / A1</code><br />
            <code>ø = (x / T) × 360</code>
          </p>
          <h3 className="subsection-title">BODE diagram:</h3>
          <p className="doc-paragraph">
            In Bode diagram the magnitude ratio verses frequency is plotted on log-log coordinates and the phase angle verses frequency on semi-log coordinates.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p24_Image236.webp" alt="Figure 2.18: Bode Diagram" className="figure-img" />
            <figcaption>Figure 2.18: Bode Diagram: Log Magnitude Ratio &amp; Phase Angle vs Frequency</figcaption>
          </figure>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p24_Image238.webp" alt="Figure 2.19: Gain Margin and Phase Margin" className="figure-img" />
            <figcaption>Figure 2.19: Gain Margin and Phase Margin on Bode Plot</figcaption>
          </figure>
          <h3 className="subsection-title">Stability criteria:</h3>
          <ul className="doc-list">
            <li>A system is stable if the phase lag is less than 180 Deg. at the frequency for which the gain is unity (one).</li>
            <li>A system is stable if the gain is less than one (unity) at the frequency for which the phase lag is 180 Deg.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 2.7 Mathematical Model ───────────────────────────────────
  {
    id: 'sec-2-7',
    chapterNumber: '2',
    chapterTitle: '2. Process Control Principles',
    sectionNumber: '2.7',
    title: '2.7 Mathematical Model',
    pageNumber: 20,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <h3 className="subsection-title">First Principle Model:</h3>
          <p className="doc-paragraph">
            When flow occurs from a tank discharging under its own head or pressure, the flow is found by the following equation:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p25_Image241.webp" alt="Equation 2.8: Gravity Discharge Orifice Flow Equation" className="figure-img" />
            <figcaption>Equation 2.8: Gravity Discharge Orifice Flow Equation</figcaption>
          </figure>
          <p className="doc-paragraph">
            Where q0 is the flow rate (ft3/s), K is a flow coefficient, A is the area of the discharge orifice (ft2), g is gravitation constant (ft/s2), and h is pressure head of liquid (ft).
          </p>
          <p className="doc-paragraph">
            We can define hydraulic resistance (R) to flow as follows:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p25_Image243.webp" alt="Equation 2.9: Hydraulic Resistance Definition" className="figure-img" />
            <figcaption>Equation 2.9: Hydraulic Resistance Definition</figcaption>
          </figure>
          <p className="doc-paragraph">
            The transient mass balance equation can be given as:<br />
            <em>Mass flow-in – Mass flow-out = Rate of accumulation of mass in the tank</em>
          </p>
          <p className="doc-paragraph">
            In terms of variables used in this analysis, the mass balance equation becomes:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p25_Image245.webp" alt="Equation 2.10: Unsteady-State Mass Balance Equation" className="figure-img" />
            <figcaption>Equation 2.10: Unsteady-State Mass Balance Equation</figcaption>
          </figure>
          <p className="doc-paragraph">
            Rearranging and eliminating q0, yields:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p25_Image247.webp" alt="Equation 2.11: Linearized Differential Equation" className="figure-img" />
            <figcaption>Equation 2.11: Linearized Differential Equation for Liquid Level</figcaption>
          </figure>
          <p className="doc-paragraph">
            Taking Laplace transform of the above equation:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p25_Image249.webp" alt="Equation 2.12: Transfer Function of Single Tank Level System" className="figure-img" />
            <figcaption>Equation 2.12: Transfer Function of Single Tank Level System</figcaption>
          </figure>
          <h3 className="subsection-title">Empirical Model:</h3>
          <p className="doc-paragraph">
            In empirical model building, models are determined by making small changes in the input variable(s) about a nominal operating condition. The resulting dynamic response is used to determine the model. This general procedure is essentially an experimental linearization of the process that is valid for some region about the nominal conditions.
          </p>
          <h3 className="subsection-title">The Process Reaction Curve Method:</h3>
          <p className="doc-paragraph">
            The process reaction curve method involves the following four actions:
          </p>
          <ul className="doc-list">
            <li>Allow the process to reach steady state.</li>
            <li>Introduce a single step change in the input variable.</li>
            <li>Collect input and output response data until the process again reaches steady state.</li>
            <li>Perform the graphical process reaction curve calculations.</li>
          </ul>
          <p className="doc-paragraph">
            The graphical calculations determine the parameters for a first-order-with-dead-time model: the process reaction curve is restricted to this model. The form of the model is as follows, with X(s) denoting the input and Y(s) denoting the output, both expressed in deviation variables:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p26_Image259.webp" alt="Equation 2.13: FOPDT Model Form in Deviation Variables" className="figure-img" />
            <figcaption>Equation 2.13: FOPDT Model Form in Deviation Variables</figcaption>
          </figure>
          <p className="doc-paragraph">
            This technique, adapted from Ziegler and Nichols (1942), uses the graphical calculations shown in Figure:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p26_Image261.webp" alt="Figure 2.20: Reaction Curve Parameter Estimation (Method I)" className="figure-img" />
            <figcaption>Figure 2.20: Reaction Curve Parameter Estimation (Method I)</figcaption>
          </figure>
          <p className="doc-paragraph">
            Where:<br />
            S = Maximum Slope<br />
            Δ = magnitude of the steady-state change in the output<br />
            δ = magnitude of the input change
          </p>
          <p className="doc-paragraph">
            The model parameters can be calculated as:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p26_Image263.webp" alt="Equation 2.14: Calculation of FOPDT Model Parameters" className="figure-img" />
            <figcaption>Equation 2.14: Calculation of FOPDT Model Parameters (Method I)</figcaption>
          </figure>
          <h3 className="subsection-title">Two Point Method:</h3>
          <p className="doc-paragraph">
            This method uses the graphical calculations shown in Figure. The intermediate values determined from the graph are the magnitude of the input change, δ; the magnitude of the steady-state change in the output, Δ; and the times at which the output reaches 28 and 63 percent of its final value.
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p27_Image273.webp" alt="Figure 2.21: Two-Point Method Graphic" className="figure-img" />
            <figcaption>Figure 2.21: Two-Point Method Graphic (Method II)</figcaption>
          </figure>
          <p className="doc-paragraph">
            The values from the plot can be related to the model parameters using the general expression in equation below. Any two values of time can be selected to determine the unknown parameters, θ and τ. The typical times are selected where the transient response is changing rapidly so that the model parameters can be accurately determined in spite of measurement noise (Smith, 1972). The expressions are:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p27_Image275.webp" alt="Equation 2.15: General Expressions for Time Constants" className="figure-img" />
            <figcaption>Equation 2.15: General Expressions for Time Constants</figcaption>
          </figure>
          <p className="doc-paragraph">
            The values of time at which the output reaches 28.3 and 63.2 percent of its final value are used to calculate the model parameters:
          </p>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p27_Image277.webp" alt="Equation 2.16: Two-Point Model Calculation Formulas" className="figure-img" />
            <figcaption>Equation 2.16: Two-Point Model Calculation Formulas</figcaption>
          </figure>
          <p className="doc-paragraph">
            Ideally, both techniques should give representative models; however, Method I require the engineer to find a slope (i.e., a derivative) of a measured signal. Because of the difficulty in evaluating the slope, especially when the signal has high-frequency noise, Method I typically have larger errors in the parameter estimates; thus, Method II is preferred.
          </p>
          <div className="doc-callout info">
            <strong>References:</strong>
            <ol className="doc-list numbered">
              <li>Katsuhiko Ogata, “Modern Control Engineering”, 5th Edition.</li>
              <li>Thomas E Marlin, “Process Control: Designing Processes and Control Systems for Dynamic Performance”, 2nd Edition.</li>
            </ol>
          </div>
        </section>
      </div>
    ),
  },
  // ── 3.1 Device Connection ────────────────────────────────────
  {
    id: 'sec-3-1',
    chapterNumber: '3',
    chapterTitle: '3. Software Interface & Features',
    sectionNumber: '3.1',
    title: '3.1 Hardware & COM Port Connection',
    pageNumber: 21,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Follow the step-by-step procedure below to establish communication between the host PC and the Level Process Trainer:
          </p>
          <ol className="doc-list numbered">
            <li>Open &#39;Manage&#39; by right clicking &#39;My Computer&#39; or &#39;This PC&#39; by opening Windows Explorer or from Desktop.</li>
            <li>Select <strong>Device Manager &gt;&gt; Ports (COM &amp; LPT)</strong>. Locate your device port No. (e.g., COM4 as shown below).</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p28_Image281.webp" alt="Figure 3.1: Windows Device Manager COM Port Identification" className="figure-img" />
            <figcaption>Figure 3.1: Windows Device Manager COM Port Identification (Ports COM &amp; LPT)</figcaption>
          </figure>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p28_Image282.webp" alt="Figure 3.2: Software Connection Dialog Window" className="figure-img" />
            <figcaption>Figure 3.2: Software Connection Dialog Window</figcaption>
          </figure>
          <ol className="doc-list numbered" start={3}>
            <li>If no device is visible, ensure your communication cable is connected properly, check for polarity (RS-485 D+ and D- pins), or reinstall the USB-RS485 driver software. Contact <code>contact@advancedcontrol.in</code> for further technical assistance.</li>
          </ol>
        </section>
      </div>
    ),
  },

  // ── 3.2 Features ──────────────────────────────────────────────
  {
    id: 'sec-3-2',
    chapterNumber: '3',
    chapterTitle: '3. Software Interface & Features',
    sectionNumber: '3.2',
    title: '3.2 Dashboard Navigation & Features',
    pageNumber: 22,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The software is designed to be user-friendly and enhanced for a wide variety of options with single click. In running mode, the following options can be explored and used. The features of the software are listed below:
          </p>
          <ul className="doc-list">
            <li>No loss of data from the beginning to the end</li>
            <li>All the data are stored internally using the graph and can be extracted at any time</li>
            <li>4k memory allocation which allows the user to run the equipment hours together without any interruption</li>
            <li>Graph axis can be altered as per requirement to get a complete view of the experiment performed</li>
            <li>Portion of data can also be logged and exported with current time</li>
            <li>Excel, text and image format support</li>
          </ul>

          <h3 className="subsection-title">1. Graph axis control:</h3>
          <ol className="doc-list alpha">
            <li>Right click on the graph and disable AutoScale X as shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p29_Image286.webp" alt="Figure 3.3: Graph Context Menu - AutoScale X Disable" className="figure-img" />
            <figcaption>Figure 3.3: Graph Context Menu - AutoScale X Disable</figcaption>
          </figure>
          <ol className="doc-list alpha" start={2}>
            <li>Double click the left bottom axis value and change it to a new value. Then double click the right bottom axis value and change it to 0.</li>
            <li>The axis will be automatically readjusted to the new value as shown below and the entire plot can be viewed.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p29_Image287.webp" alt="Figure 3.4: Axis Range Re-Adjustment for Full Run Visualization" className="figure-img" />
            <figcaption>Figure 3.4: Axis Range Re-Adjustment for Full Run Visualization</figcaption>
          </figure>

          <h3 className="subsection-title">2. Export Graph:</h3>
          <ol className="doc-list alpha">
            <li>The graph can be exported to a simplified image by right clicking on the graph as shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p30_Image289.webp" alt="Figure 3.5: Export Graph Menu Options" className="figure-img" />
            <figcaption>Figure 3.5: Export Graph Menu Options</figcaption>
          </figure>
          <ol className="doc-list alpha" start={2}>
            <li>In the above case the graph background will be changed to white and scale will be converted to auto scale.</li>
            <li>The graph image as it is can be exported to an image file by clicking on the &#39;Export Graph&#39; button on the menu bar.</li>
            <li>Graph data can be exported to either excel or clipboard by clicking appropriate option as shown above.</li>
          </ol>

          <h3 className="subsection-title">3. Log data:</h3>
          <ul className="doc-list">
            <li>The data can be logged from any point of time to any other time value using &#39;Log ON&#39; button. Use the same button to stop log. An indicator will be turned on to indicate the log process is ON.</li>
          </ul>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p30_Image290.webp" alt="Figure 3.6: Log ON Indicator Button" className="figure-img" />
            <figcaption>Figure 3.6: Log ON Indicator Button</figcaption>
          </figure>
          <ol className="doc-list alpha">
            <li>The values will be displayed in the log table. Use &#39;Clear Log&#39; to clear the data from Log table.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p30_Image291.webp" alt="Figure 3.7: Log Data Table View" className="figure-img" />
            <figcaption>Figure 3.7: Log Data Table View</figcaption>
          </figure>
          <ol className="doc-list alpha" start={2}>
            <li>The data can be exported by right click on the Log table &gt;&gt; Export &gt;&gt; Export Data To Excel or Export Data to Clipboard.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p31_Image293.webp" alt="Figure 3.8: Data Export to Excel / Clipboard Context Menu" className="figure-img" />
            <figcaption>Figure 3.8: Data Export to Excel / Clipboard Context Menu</figcaption>
          </figure>
          <ol className="doc-list alpha" start={3}>
            <li>&#39;Save Log Data&#39; will be used to export the data directly to excel.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p31_Image294.webp" alt="Figure 3.9: Save Log Data Direct Export" className="figure-img" />
            <figcaption>Figure 3.9: Save Log Data Direct Export</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 3.3 Remote Lab, Firebase Cloud Sync & MQTT Telemetry ───────
  {
    id: 'sec-3-3',
    chapterNumber: '3',
    chapterTitle: '3. Software Interface & Features',
    sectionNumber: '3.3',
    title: '3.3 Remote Lab, Firebase Cloud Sync & MQTT Telemetry',
    pageNumber: 23,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            ACE Prosoft V2 introduces a state-of-the-art Remote Lab and Industrial IoT gateway architecture. Designed for modern blended engineering education, distance laboratory experiments, and smart manufacturing research, this system allows remote students and external control systems to interact with the physical Level Process Trainer (ACE 101) in real time over local networks, cloud databases, secure internet tunnels, and MQTT message brokers.
          </p>
          <p className="doc-paragraph">
            The gateway can be configured and managed directly by clicking the <strong>Remote Lab</strong> button located on the top menu bar of Prosoft V2.
          </p>

          <h3 className="subsection-title">1. Local Network (LAN) Remote Lab:</h3>
          <p className="doc-paragraph">
            The trainer software contains an embedded high-performance HTTP and WebSocket server operating on TCP port 3001. When enabled, the software automatically detects the host computer&#39;s IP address on the local campus or laboratory Wi-Fi network (e.g., <code>http://192.168.1.105:3001</code>) and renders an instant QR code.
          </p>
          <ul className="doc-list">
            <li><strong>Instant Mobile Access:</strong> Students can simply scan the on-screen QR code with any smartphone, tablet, or laptop browser to load a dedicated responsive Remote Client dashboard without installing any software or app.</li>
            <li><strong>Session Passkey Security:</strong> Access is guarded by a configurable 4-digit session passkey. Students must enter the active passkey to establish a session.</li>
            <li><strong>Host Session Management:</strong> The host instructor&#39;s interface provides real-time visibility into all active student sessions, showing client device type, IP address, connection time, and round-trip ping latency. The instructor can grant temporary control permissions or revoke any student session instantly.</li>
          </ul>

          <h3 className="subsection-title">2. Firebase Realtime Database Cloud Synchronization:</h3>
          <p className="doc-paragraph">
            For campus-wide, inter-collegiate, or global distance learning, Prosoft V2 provides native integration with Google Firebase Realtime Database. By connecting to a Firebase project via standard Web API configuration, the trainer continuously synchronizes all active experiment parameters to the cloud:
          </p>
          <ul className="doc-list">
            <li><strong>Zero Firewall Configuration:</strong> Firebase operates entirely over outbound HTTPS/WebSockets, eliminating the need for public static IP addresses, port forwarding, or router DMZ configurations on strict institutional firewalls.</li>
            <li><strong>Real-Time Live Telemetry:</strong> Process Variable (PV %), Set Point (SP %), Controller Output (MV/OP %), controller operating mode (Auto/Manual), and PID tuning parameters (PB, Ti, Td) are pushed to the cloud at 1 Hz intervals.</li>
            <li><strong>Broadcast Lecture Mode:</strong> Instructors can conduct a live experiment on the physical setup in the laboratory while dozens of remote students follow the live graphical response curve and parameter changes synchronously on their personal devices.</li>
          </ul>

          <h3 className="subsection-title">3. Internet Remote Tunnel (Cloudflare Zero-Trust):</h3>
          <p className="doc-paragraph">
            For secure direct web access over the public internet, Prosoft V2 integrates a one-click Cloudflare Tunnel engine (<code>cloudflared.exe</code>).
          </p>
          <ul className="doc-list">
            <li>Clicking <strong>Start Tunnel</strong> establishes an encrypted outbound tunnel to the nearest Cloudflare edge node, generating a public HTTPS URL (e.g., <code>https://xxxx.trycloudflare.com</code>).</li>
            <li>The link is automatically converted into a QR code for seamless distribution to remote students.</li>
            <li>Traffic is fully protected by end-to-end TLS encryption and student passkey authentication, preventing unauthorized access.</li>
          </ul>

          <h3 className="subsection-title">4. Industrial IoT MQTT Broker Integration:</h3>
          <p className="doc-paragraph">
            To bridge educational laboratory equipment with Industry 4.0 paradigms, Prosoft V2 incorporates a full-featured MQTT (Message Queuing Telemetry Transport) client. MQTT is the lightweight publish/subscribe standard used extensively in industrial automation, SCADA systems, and cloud analytics platforms.
          </p>
          <ul className="doc-list">
            <li><strong>Broker Support:</strong> Compatible with public cloud brokers (e.g., HiveMQ, EMQX Cloud), on-premise industrial message brokers (Eclipse Mosquitto, HiveMQ Enterprise), and cloud IoT gateways (AWS IoT Core, Microsoft Azure IoT Hub).</li>
            <li><strong>Configurable Settings:</strong> The user can specify Broker Host, Port (8883 for TLS or 1883 for standard TCP), Client ID, Quality of Service (QoS 0, 1, or 2), and Custom Topic path (default: <code>ace101/process/telemetry</code>).</li>
            <li><strong>Live JSON Telemetry Stream:</strong> Prosoft V2 publishes clean, structured JSON payloads reflecting the instantaneous state of the liquid level system:
              <div className="doc-formula" style={{ textAlign: 'left', padding: '12px', background: '#0f172a', color: '#38bdf8', borderRadius: '6px', margin: '12px 0', fontFamily: 'monospace', fontSize: '12px' }}>
                {`{
  "client": "ACE101_Trainer_Host_9696",
  "timestamp": 1713370000000,
  "mode": "PID",
  "sp": 50.0,
  "pv": 49.8,
  "op": 35.2,
  "pb": 100.0,
  "it": 50,
  "dt": 2,
  "unit": "%"
}`}
              </div>
            </li>
            <li><strong>External SCADA &amp; Dashboard Integration:</strong> The MQTT telemetry stream can be subscribed to by external tools such as Node-RED flow editors, Grafana monitoring dashboards, Python data science pipelines, and MATLAB/Simulink IoT toolboxes for advanced data logging and predictive analytics.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.1 Study of Level Transmitter Characteristics ───────────
  {
    id: 'sec-4-1',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.1',
    title: '4.1 Level Transmitter Calibration',
    pageNumber: 24,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <h3 className="subsection-title">4.1 Study of Level Transmitter Characteristics</h3>
          <p className="doc-paragraph">
            <strong>Aim:</strong> To obtain the calibration curve and input-output characteristics of the level (pressure) transmitter.
          </p>
          <p className="doc-paragraph">
            <strong>Apparatus:</strong> Level Process Trainer (ACE 101), host computer with software interface, and measuring scale.
          </p>
          <p className="doc-paragraph">
            <strong>Principle:</strong> The level transmitter senses the hydrostatic pressure at the bottom of the water column in the acrylic tank (P = ρ·g·h). The transducer element converts this pressure into a standard proportional 4–20 mA current output corresponding to 0–250 mmwc liquid column height.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Ensure sump tank has sufficient water and all manual bypass valves are closed.</li>
            <li>Switch ON main electrical supply and computer. Launch ACE Prosoft V2 and establish serial communication on the assigned COM port.</li>
            <li>In manual control mode, adjust valve opening to fill water into the process tank in steps of 25 mm (e.g., 0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250 mm).</li>
            <li>At each step, record the physical liquid level from the tank graduated scale, the transmitter output current in mA, and the software-indicated level percentage.</li>
            <li>Plot the calibration graph: Actual Height (mm) on X-axis versus Transmitter Output Current (mA) and Process Value (%) on Y-axis. Calculate sensitivity, linearity, and zero/span errors.</li>
          </ol>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Sl. No.</th>
                  <th>Liquid Level in Scale (mm)</th>
                  <th>Actual Current (mA)</th>
                  <th>Software Reading (%)</th>
                  <th>Remarks / Error</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>0</td><td>4.00</td><td>0.0</td><td>Zero calibration point</td></tr>
                <tr><td>2</td><td>25</td><td>4.80</td><td>10.0</td><td>Linear span check</td></tr>
                <tr><td>3</td><td>50</td><td>5.60</td><td>20.0</td><td>Linear span check</td></tr>
                <tr><td>4</td><td>75</td><td>6.40</td><td>30.0</td><td>Linear span check</td></tr>
                <tr><td>5</td><td>100</td><td>7.20</td><td>40.0</td><td>Mid-low span check</td></tr>
                <tr><td>6</td><td>125</td><td>8.00</td><td>50.0</td><td>Mid span check</td></tr>
                <tr><td>7</td><td>150</td><td>8.80</td><td>60.0</td><td>Mid-high span check</td></tr>
                <tr><td>8</td><td>175</td><td>9.60</td><td>70.0</td><td>Linear span check</td></tr>
                <tr><td>9</td><td>200</td><td>10.40</td><td>80.0</td><td>Linear span check</td></tr>
                <tr><td>10</td><td>225</td><td>11.20</td><td>90.0</td><td>Linear span check</td></tr>
                <tr><td>11</td><td>250</td><td>12.00</td><td>100.0</td><td>Full span calibration point</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },

  // ── 4.2 General Procedure (Prosoft V2 Navigation) ────────────
  {
    id: 'sec-4-2',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2',
    title: '4.2 General Procedure (Prosoft V2 Navigation)',
    pageNumber: 25,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The Level Process Trainer (ACE 101) is regulated using modern ACE Prosoft V2 software. Prosoft V2 is engineered with an intuitive navigation workflow that guides the student through hardware connection, experiment selection, live schematic visualization, parameter tuning, trend monitoring, and data logging.
          </p>

          <h3 className="subsection-title">Step-by-Step Navigation Workflow in Prosoft V2:</h3>
          <ol className="doc-list numbered">
            <li><strong>Hardware Preparation:</strong>
              <ul className="doc-list" style={{ marginTop: '6px' }}>
                <li>Verify that the sump tank is filled with at least 15 to 20 Liters of clean water.</li>
                <li>Connect laboratory compressed air supply to the Air Filter Regulator (AFR) and adjust supply pressure to <strong>20 – 30 psi</strong>.</li>
                <li>Power ON the ACE 101 trainer main electrical console. Ensure the Delta DTB9696 controller LED illuminates.</li>
                <li>Connect the USB-to-RS485 converter cable to a USB port on the computer.</li>
              </ul>
            </li>
            <li><strong>Launch Software &amp; Select Product:</strong>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                Launch <strong>ACE Prosoft V2</strong> from the desktop shortcut. On the Home Page product catalog, click on the <strong>ACE 101 — Level Process Trainer</strong> card to enter the dedicated Level Trainer workstation.
              </p>
            </li>
            <li><strong>Establish Communication (Top Menu Bar):</strong>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                On the top navigation bar, click the <strong>Communication</strong> dropdown menu. The software automatically scans all active COM ports on your PC. Click on the detected port (e.g., <code>COM4</code>). Prosoft V2 performs an automated handshake with the Delta DTB controller via register 4102. Upon verification, a confirmation popup appears: <em>&quot;Connection Established! You can now select an experiment.&quot;</em> The Communication menu then locks to prevent accidental port disruption.
              </p>
            </li>
            <li><strong>Select Experiment (Top Menu Bar):</strong>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                With communication established, the <strong>Experiment</strong> dropdown menu becomes active. Click it to choose your assigned experiment:
              </p>
              <ul className="doc-list">
                <li><code>Open Loop</code></li>
                <li><code>On / Off Control</code></li>
                <li><code>P Mode</code></li>
                <li><code>PI Mode</code></li>
                <li><code>PD Mode</code></li>
                <li><code>PID Mode</code></li>
                <li><code>Closed Loop</code></li>
              </ul>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                An Experiment Guidelines dialog will display the objective, recommended parameter settings, and precautions. Click <strong>OK</strong> to proceed.
              </p>
            </li>
            <li><strong>Start Real-Time Run (Toolbar):</strong>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                On the action ribbon toolbar, click the <strong>`▶ Run`</strong> button (which is enabled only after COM connection and experiment selection). Prosoft V2 starts high-speed 1-second Modbus polling and active simulation.
              </p>
            </li>
            <li><strong>Interactive Process Schematic &amp; Real-Time Displays:</strong>
              <ul className="doc-list" style={{ marginTop: '6px' }}>
                <li><strong>Animated SVG Process Schematic (Left):</strong> Observe the transparent acrylic process column filling with water, the graduated scale reading, the pneumatic control valve stem modulating, the centrifugal pump rotating, and rotameter float moving with inflow.</li>
                <li><strong>Interactive Parameter Drawer (Right):</strong> Use the vertical LabVIEW-style sliders or direct numerical input boxes to modify Set Point (SP 0–100%), Manual Output (OP 0–100%), Proportional Band (PB 0.1–999.9%), Integral Time (Ti 0–9999 s), and Derivative Time (Td 0–9999 s).</li>
                <li><strong>Multi-Trace Oscilloscope Trend Graph (Bottom):</strong> Real-time plot displaying Set Point (Green), Process Variable (Red), and Controller Output / Valve Position (Blue). Hover with mouse to inspect exact coordinate readings.</li>
              </ul>
            </li>
            <li><strong>Mode Switching (Auto / Manual):</strong>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                Click the <strong>`⚙ Auto / Manual`</strong> button on the toolbar to toggle operating mode. In <em>Auto</em> mode, the Delta PID algorithm regulates the valve. In <em>Manual</em> mode, you directly command valve opening percentage using the OP slider.
              </p>
            </li>
            <li><strong>Data Logging &amp; Export:</strong>
              <ul className="doc-list" style={{ marginTop: '6px' }}>
                <li>Click <strong>`🔴 Log ON`</strong> on the toolbar to begin logging timestamped readings (Time, SP, PV, OP, PB, Ti, Td) to the internal table.</li>
                <li>Click <strong>`💾 Save Log`</strong> to immediately export the recorded dataset as a standard CSV spreadsheet file (<code>ACE101_Log_*.csv</code>) for laboratory report analysis.</li>
                <li>Click <strong>`📊 Export Graph`</strong> to capture a publication-ready composite image of the waveform canvas complete with title, parameters, timestamp, and legend in high-resolution PNG format.</li>
                <li>Click <strong>`⏸️ Hold / Resume`</strong> to freeze trend rendering for observation without stopping data acquisition.</li>
              </ul>
            </li>
            <li><strong>Stopping Experiment:</strong>
              <p className="doc-paragraph" style={{ marginTop: '6px' }}>
                When the experiment is finished, click the <strong>`■ Stop`</strong> button on the toolbar. A confirmation dialog will prompt: <em>&quot;Are you sure you want to stop the experiment?&quot;</em>. Clicking <strong>Yes, Stop</strong> safely halts data acquisition, resets the simulated tank level to 0.0%, clears waveforms, and restores safe controller standby.
              </p>
            </li>
          </ol>
        </section>
      </div>
    ),
  },

  // ── 4.2.1 Open Loop ──────────────────────────────────────────
  {
    id: 'sec-4-2-1',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.1',
    title: '4.2.1 Open Loop Experiment',
    pageNumber: 26,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To study the open-loop response of the level process system by applying manual step changes to the controller output (valve position).
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Refer to Section 4.2 for general Prosoft V2 navigation.</li>
            <li>Establish communication via the <strong>Communication</strong> menu and select <strong>Open Loop</strong> from the <strong>Experiment</strong> menu.</li>
            <li>Ensure the toolbar mode is set to <strong>Manual</strong>. Click <strong>`▶ Run`</strong> on the toolbar.</li>
            <li>In the right-side parameter drawer, adjust the <strong>OP (Manual Output)</strong> slider in steps of 10% (e.g., 0%, 10%, 20%, ..., 100%).</li>
            <li>Allow the liquid level to reach steady state for each step, and record the corresponding Process Value (PV %) from the digital display or trend plot.</li>
            <li>Repeat the procedure while decreasing the output to observe valve and hydraulic hysteresis.</li>
            <li>Click <strong>`■ Stop`</strong> on the toolbar when observations are complete.</li>
          </ol>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Tabulate the observations as follows:</li>
          </ul>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Controller Output (%)</th>
                  <th>Process Value (PV %)</th>
                  <th>Inflow Rate (Rotameter LPH)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>0 %</td><td>0.0 %</td><td>0 LPH</td></tr>
                <tr><td>10 %</td><td></td><td></td></tr>
                <tr><td>20 %</td><td></td><td></td></tr>
                <tr><td>...</td><td></td><td></td></tr>
                <tr><td>100 %</td><td></td><td></td></tr>
              </tbody>
            </table>
          </div>
          <ul className="doc-list">
            <li>From the above data, note the output required for maintaining the level at desired set points.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.2 On/Off Control ──────────────────────────────────────
  {
    id: 'sec-4-2-2',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.2',
    title: '4.2.2 On / Off Control Experiment',
    pageNumber: 27,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To study the performance of two-position (On/Off) level control and evaluate the effect of hysteresis (differential gap).
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>On / Off Control</strong> from the <strong>Experiment</strong> menu.</li>
            <li>In the parameter drawer, set the Hysteresis value to 5% (Range 1–10%).</li>
            <li>Set the desired Set Point (SP) to 50% using the vertical SP slider. Click <strong>`▶ Run`</strong>.</li>
            <li>Observe the cycling behavior on the real-time Trend Graph and animated schematic as the valve switches between 0% and 100%.</li>
          </ol>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Observe that if process value exceeds the set point and increases above the value of (0.5 × Hysteresis), control valve is fully closed and if process value decreases below the set point by (0.5 × Hysteresis), the control valve opens fully i.e. controller operates like On/Off switch.</li>
            <li>Measure the amplitude of PV oscillation and the cycling period. Compare how increasing hysteresis reduces valve switching frequency but widens peak-to-peak level ripple.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.3 P Mode ──────────────────────────────────────────────
  {
    id: 'sec-4-2-3',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.3',
    title: '4.2.3 P Mode Control Experiment',
    pageNumber: 28,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To study the response of the liquid level process using Proportional control mode and observe steady-state offset.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>P Mode</strong> from the <strong>Experiment</strong> menu.</li>
            <li>Set Set Point (SP) to 50%. Allow the process to stabilize.</li>
            <li>Switch to <strong>Manual</strong> mode using the toolbar button. Adjust Output (OP) until PV matches SP (50%), and apply this output value as bias to the controller.</li>
            <li>Switch back to <strong>Auto</strong> mode. Adjust Proportional Band (PB) to 100%.</li>
            <li>Apply a step change to the set point (say from 50% to 60%) using the SP slider and observe the response.</li>
            <li>Decrease proportional band to half of the previous value (e.g., 50%, then 25%). With each decrease, obtain a new step response around the same operating point.</li>
            <li>Using a trial-and-error approach, determine the value of proportional band that yields a fast response with at most one overshoot and one undershoot.</li>
          </ol>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Observe steady state error decreases as proportional band decreases.</li>
            <li>Observe the effect of very low proportional band values (system works in oscillatory mode).</li>
            <li>Observe the response of the system to load change. Load change can be given by slightly opening the drain valve for a shorter duration and retain the same position.</li>
            <li>Apply a setpoint change (say 50% to 60%) with the proportional band obtained using trial and error approach. Plot the responses.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.4 PI Mode ─────────────────────────────────────────────
  {
    id: 'sec-4-2-4',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.4',
    title: '4.2.4 PI Mode Control Experiment',
    pageNumber: 29,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To study the response of Proportional-Integral (PI) control mode and observe the complete elimination of steady-state offset.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>PI Mode</strong> from the <strong>Experiment</strong> menu.</li>
            <li>Keep the set point at 50%. Allow the process to reach steady state.</li>
            <li>Set the proportional band (PB) estimated from the P-only experiment and set initial Integral Time (Ti) = 50 seconds.</li>
            <li>Apply a step change to set point (say 50% to 70%) and observe the response on the Trend Graph.</li>
            <li>Return set point to 50% and allow the system to restabilize.</li>
            <li>Decrease the integral time by half (e.g., 25 s, then 12 s) and apply the step change again.</li>
            <li>Repeat until an optimal response is obtained with fast recovery, zero offset, and minimal overshoot.</li>
          </ol>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Observe the effect of reducing integral time on the response of the process. Also note that the process may show very less or null offset as effect of integral action but with a sluggish response.</li>
            <li>Apply a setpoint change (say 50% to 70%) with the integral value obtained using trial and error approach. Observe the responses and the time taken to reach steady state.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.5 PD Mode ─────────────────────────────────────────────
  {
    id: 'sec-4-2-5',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.5',
    title: '4.2.5 PD Mode Control Experiment',
    pageNumber: 30,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To study the response of Proportional-Derivative (PD) control mode and evaluate anticipatory action.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>PD Mode</strong> from the <strong>Experiment</strong> menu.</li>
            <li>Keep the set point at 50%. Allow the process to stabilize.</li>
            <li>Set the proportional band (PB) from the P-only experiment and set Derivative Time (Td) = 1 second.</li>
            <li>Allow the process to reach steady state.</li>
            <li>Apply a step change to set point (say 50% to 60%) and observe the corrective rate action.</li>
            <li>Increase derivative time gradually (1 to 2, then 2 to 3 seconds) and observe the damping effect.</li>
          </ol>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Observe the effect of increasing derivative time. Also note that the process may show offset as effect of integral action is cut off.</li>
            <li>Observe how derivative action provides rapid damping against sudden disturbances but amplifies high-frequency noise if Td is set too high.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.6 PID Mode ────────────────────────────────────────────
  {
    id: 'sec-4-2-6',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.6',
    title: '4.2.6 PID Mode Control Experiment',
    pageNumber: 31,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To implement full three-mode PID control and optimize parameters for zero offset, minimal overshoot, and fast settling time.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>PID Mode</strong> from the <strong>Experiment</strong> menu.</li>
            <li>Set set point to 50% and allow the system to stabilize.</li>
            <li>Input the optimized PB, Ti, and Td values determined from previous individual mode experiments.</li>
            <li>Ensure controller is in <strong>Auto</strong> mode and click <strong>`▶ Run`</strong>.</li>
            <li>Apply a step change to set point (say 50% to 60%) and observe the transient response on the oscilloscope canvas.</li>
            <li>Fine-tune PB, Ti, and Td to achieve a balanced quarter-decay response with quick settling and zero steady-state error.</li>
          </ol>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Compare the steady state response of the PID controller with P, PI and PD controller obtained in the previous experiments.</li>
            <li>Apply a setpoint change (say 50% to 60%).</li>
            <li>Adjust the P, I and D values using trial and error approach to obtain a better response.</li>
            <li>Achieve a step response with at least one overshoot and one undershoot. Plot the response.</li>
            <li>Compare the response with previous experiment responses.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.7 Open Loop Tuning ────────────────────────────────────
  {
    id: 'sec-4-2-7',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.7',
    title: '4.2.7 Open Loop Tuning Experiment',
    pageNumber: 32,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To obtain the Process Reaction Curve experimentally and compute Ziegler-Nichols open-loop tuning settings.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>Open Loop</strong> from the <strong>Experiment</strong> menu.</li>
            <li>In <strong>Manual</strong> mode, set the controller output to 80% and wait for the system to reach steady state.</li>
            <li>Click <strong>`🔴 Log ON`</strong> on the toolbar to initiate high-speed data logging.</li>
            <li>Apply a step reduction in output from 80% to 60%. Wait until a new steady state is attained.</li>
            <li>Click <strong>`🔴 Log OFF`</strong> and export the reaction curve data using <strong>`💾 Save Log`</strong>.</li>
            <li>Draw the tangent line at the point of inflection to determine Maximum Slope (R) and Dead Time (L).</li>
          </ol>
          <h3 className="subsection-title">PID Tuning:</h3>
          <ul className="doc-list">
            <li>Calculate P I D settings for different modes using Open Loop Tuning explained earlier.</li>
            <li>Select PID Experiment. Set the PID values obtained from the calculations.</li>
            <li>Apply the step change &amp; observe the response of the system.</li>
            <li>Allow the system to reach steady state and plot the response.</li>
          </ul>
          <h3 className="subsection-title">Observations:</h3>
          <ul className="doc-list">
            <li>Observe the step response of the model using any standard tool like MATLAB and compare the response with experimental response.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 4.2.8 Closed Loop Tuning ──────────────────────────────────
  {
    id: 'sec-4-2-8',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.2.8',
    title: '4.2.8 Closed Loop Tuning Experiment',
    pageNumber: 33,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            <strong>Aim:</strong> To determine the Ultimate Gain (Ku) and Ultimate Period (Tu) by continuous cycling and compute Ziegler-Nichols closed-loop tuning settings.
          </p>
          <h3 className="subsection-title">Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Establish communication and select <strong>Closed Loop</strong> from the <strong>Experiment</strong> menu.</li>
            <li>In Manual mode, adjust valve output until PV stabilizes at 50%.</li>
            <li>Switch to Auto mode with initial Proportional Band (PB) set to 100% and integral/derivative actions disabled (Ti=0, Td=0).</li>
            <li>Apply a small setpoint step change and observe the transient response.</li>
            <li>Halve the proportional band (e.g., 50%, 25%, etc.) and repeat the step change until the system produces sustained, undamped oscillations of constant amplitude.</li>
            <li>Record the ultimate proportional band (PBu) and measure the oscillation period (Tu in seconds).</li>
            <li>Compute the controller settings using the Ziegler-Nichols closed-loop tuning table.</li>
            <li>Select the PID Mode experiment, enter the calculated values, and verify closed-loop stability.</li>
          </ol>
        </section>
      </div>
    ),
  },

  // ── 4.3 Empirical Model Estimation ────────────────────────────
  {
    id: 'sec-4-3',
    chapterNumber: '4',
    chapterTitle: '4. Experiments & Procedures',
    sectionNumber: '4.3',
    title: '4.3 Empirical Model Estimation (FOPDT)',
    pageNumber: 34,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            This tool aids to understand the procedure of model estimation using empirical (experimental) methods. A First Order Plus Dead Time (FOPDT) model can be estimated using Process Reaction Method using this tool. Refer Process Reaction Method from theory. This tool also provides facility to store the data in graph format and restore from stored file.
          </p>
          <h3 className="subsection-title">General Procedure:</h3>
          <ol className="doc-list numbered">
            <li>Double click &quot;Ace.exe&quot; icon in desktop.</li>
            <li>Select: Empirical Model Estimation tab.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p45_Image349.webp" alt="Figure 4.8: Empirical Model Estimation Tab Selection" className="figure-img" />
            <figcaption>Figure 4.8: Empirical Model Estimation Tab Selection</figcaption>
          </figure>
          <ol className="doc-list numbered" start={3}>
            <li>Wait for the GUI to open. The description of the page is shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p45_Image350.webp" alt="Figure 4.9: Model Estimation GUI Layout" className="figure-img" />
            <figcaption>Figure 4.9: Model Estimation GUI Layout</figcaption>
          </figure>
          <ol className="doc-list numbered" start={4}>
            <li>The experiment can be performed by following the instructions on the screen as listed below:
              <ul className="doc-list" style={{ marginTop: '8px' }}>
                <li>Select &#39;Device ID&#39; (Flow Process with Delta DTB9696B controller the default value is 2).</li>
                <li>Select COM Port from the Menu Bar.</li>
                <li><strong>*Note:</strong>
                  <ul className="doc-list">
                    <li>Enabled COM ports will be automatically identified and displayed here. If &#39;No Device&#39; is displayed, check your communication cable. Also ensure your RS485 to USB converter is installed properly.</li>
                    <li>Go through the procedure to ensure device connection.</li>
                    <li>Once communication is established you will get a message as &#39;Communication Established. Press RUN to continue&#39;.</li>
                  </ul>
                </li>
                <li>Click RUN. Process Graph tab will be enabled. Graph tab will be enabled. Description of the tab is given below:</li>
              </ul>
            </li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p46_Image353.webp" alt="Figure 4.10: Process Graph Tab Description and Run Mode" className="figure-img" />
            <figcaption>Figure 4.10: Process Graph Tab Description and Run Mode</figcaption>
          </figure>
          <ul className="doc-list">
            <li>Enter the initial controller output (say 20%) and press OK button. Wait for steady state. (Once if OK button is pressed, &#39;Process Plot&#39; tab will be enabled. You can also scroll to &#39;Process Schematic&#39;. Observe the response on the process plot.)</li>
            <li>Press &#39;STOP&#39; if you want to restart at any time.</li>
            <li>Once steady state is achieved, enter new controller output (say 50%) and press OK button. Wait for new steady state.</li>
            <li>Press STOP button when PV attain steady state.</li>
            <li>Once STOP button is pressed, cursors will be enabled in the process plot.</li>
            <li>Move Cursor 0 and Cursor 1 tangential to the linear region of PV to get Maximum Slope.</li>
            <li>Position Cursor 2 and Cursor 3 to get Time Delay. Use zoom option, if required.</li>
            <li>Position Cursor 4 and Cursor 5 to get Delta PV.</li>
            <li>The FOPDT model and ZN open loop tuned PID values will be displayed automatically.</li>
          </ul>
          <ol className="doc-list numbered" start={5}>
            <li>A red dotted line represents the response of the model. Adjust cursors 0,1 and 4,5 to get a model close to the actual response.</li>
            <li>A typical graph is shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p47_Image355.webp" alt="Figure 4.11: Real-Time Process Reaction Curve with Cursors" className="figure-img" />
            <figcaption>Figure 4.11: Real-Time Process Reaction Curve with Cursors</figcaption>
          </figure>
          <p className="doc-paragraph">The following features can be used while doing the experiment:</p>
          <ol className="doc-list numbered">
            <li>Zoom option can be used to select the exact time delay (Fig a and b) as shown below:</li>
          </ol>
          <div className="figure-row">
            <figure className="guide-figure">
              <img src="/docs/guide_assets/fig_p47_Image356.webp" alt="Fig (a): Zoomed Initial Delay" className="figure-img" />
              <figcaption>Fig. (a): Zoom In</figcaption>
            </figure>
            <figure className="guide-figure">
              <img src="/docs/guide_assets/fig_p47_Image357.webp" alt="Fig (b): Exact Delay Selection" className="figure-img" />
              <figcaption>Fig. (b): Exact Delay</figcaption>
            </figure>
            <figure className="guide-figure">
              <img src="/docs/guide_assets/fig_p47_Image358.webp" alt="Fig (c): Cursor Alignment" className="figure-img" />
              <figcaption>Fig. (c): Cursor Move</figcaption>
            </figure>
          </div>
          <ol className="doc-list numbered" start={2}>
            <li>Select Cursor tool to adjust cursors as shown in fig (c). Zoom so wide and move cursors to get the exact time delay.</li>
            <li>Adjust the time axis by double clicking the corner values as shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p47_Image359.webp" alt="Figure 4.12: Time Axis Adjustment" className="figure-img" />
            <figcaption>Figure 4.12: Time Axis Adjustment</figcaption>
          </figure>
          <ol className="doc-list numbered" start={4}>
            <li>Use &#39;Reset Cursor&#39; if cursors are moved beyond the range.</li>
            <li>Use &#39;Save Graph&#39; button to save the graph data. The graph will be saved in .gd format.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p47_Image360.webp" alt="Figure 4.13: Save Graph in GD Format" className="figure-img" />
            <figcaption>Figure 4.13: Save Graph in GD Format</figcaption>
          </figure>
          <ol className="doc-list numbered" start={6}>
            <li>Stored graph will be reloaded once the experiment is selected in the &#39;Schematic&#39; tab.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p48_Image364.webp" alt="Figure 4.14: Reload Stored GD Graph" className="figure-img" />
            <figcaption>Figure 4.14: Reload Stored GD Graph</figcaption>
          </figure>
          <ol className="doc-list numbered" start={7}>
            <li>While cursor is moved, the FOPDT model will automatically be calculated and displayed as shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p48_Image365.webp" alt="Figure 4.15: Calculated FOPDT Model Display" className="figure-img" />
            <figcaption>Figure 4.15: Calculated FOPDT Model Display</figcaption>
          </figure>
          <ol className="doc-list numbered" start={8}>
            <li>Similarly, the Ziegler-Nichols tuned P, PI, PD and PID values and also the corresponding transfer function will also be displayed as shown below:</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p48_Image366.webp" alt="Figure 4.16: Tuned Controller Parameters Display" className="figure-img" />
            <figcaption>Figure 4.16: Tuned Controller Parameters Display</figcaption>
          </figure>
          <ol className="doc-list numbered" start={9}>
            <li>Select the appropriate mode and observe the text box.</li>
            <li>Log On and Clear log will be used to store the data while performing the experiment.</li>
            <li>Once experiment is done, go to &#39;Process Schematic&#39; and press back.</li>
            <li>A popup message will confirm the exit and other experiment can be selected and performed.</li>
            <li><strong>Note:</strong> One set of data stored in .gd format is sufficient to understand the other methods.</li>
            <li>Load graph and perform other experiments.</li>
          </ol>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p48_Image367.webp" alt="Figure 4.17: Comprehensive Empirical Estimation Window" className="figure-img" />
            <figcaption>Figure 4.17: Comprehensive Empirical Estimation Window</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 5.1 WIKA Pressure Transmitter ───────────────────────────
  {
    id: 'sec-5-1',
    chapterNumber: '5',
    chapterTitle: '5. Component Specifications',
    sectionNumber: '5.1',
    title: '5.1 WIKA – Pressure Transmitter',
    pageNumber: 35,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The description of the component used in this trainer are listed below:
          </p>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Manufacturer Specification</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Product</strong></td><td>Level (Pressure) Transmitter</td></tr>
                <tr><td><strong>Manufacturer</strong></td><td>WIKA Alexander Wiegand SE &amp; Co. KG</td></tr>
                <tr><td><strong>Model</strong></td><td>SL-1-A-MAG-ND-ZA4Z-ZZZ / A-10</td></tr>
                <tr><td><strong>Range</strong></td><td>0 – 50 mbar (0 – 500 mmwc / calibrated 0 – 250 mm Head)</td></tr>
                <tr><td><strong>Input</strong></td><td>0 to 250 mmwc liquid hydrostatic pressure</td></tr>
                <tr><td><strong>Output</strong></td><td>4 – 20 mA DC (calibrated 4 – 12 mA for 0 – 250 mm Head)</td></tr>
                <tr><td><strong>Power Supply</strong></td><td>24 V DC (8 – 30 VDC permissible range)</td></tr>
                <tr><td><strong>Transmission</strong></td><td>2-wire current loop</td></tr>
                <tr><td><strong>Datasheet URL</strong></td><td><a href="https://cache.industry.siemens.com/dl/files/046/109765046/att_1041177/v1/sitransp_ds3_fi01_en.pdf" target="_blank" rel="noreferrer">WIKA / SITRANS Datasheet Reference</a></td></tr>
              </tbody>
            </table>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p49_Image374.webp" alt="Figure 5.1: WIKA Pressure Transmitter" className="figure-img" />
            <figcaption>Figure 5.1: WIKA Industrial Pressure Transmitter</figcaption>
          </figure>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p50_Image378.webp" alt="Figure 5.2: WIKA Transmitter Dimensional and Mounting Drawing" className="figure-img" />
            <figcaption>Figure 5.2: WIKA Transmitter Dimensional and Mounting Drawing</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 5.2 Delta DTB9696 Controller ─────────────────────────────
  {
    id: 'sec-5-2',
    chapterNumber: '5',
    chapterTitle: '5. Component Specifications',
    sectionNumber: '5.2',
    title: '5.2 Delta – Digital Temperature Indicating Controller (DTB9696CR)',
    pageNumber: 36,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Parameter / Feature</th>
                  <th>Manufacturer Specification Details</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Product</strong></td><td>Digital Temperature / Process Controller</td></tr>
                <tr><td><strong>Product Code</strong></td><td>DTB9696CR</td></tr>
                <tr><td><strong>Manufacturer</strong></td><td>Delta Electronics, Inc.</td></tr>
                <tr><td><strong>Input Voltage</strong></td><td>100 to 240 VAC, 50/60 Hz</td></tr>
                <tr><td><strong>Operation Voltage Range</strong></td><td>85% to 110% of rated voltage</td></tr>
                <tr><td><strong>Power Consumption</strong></td><td>5 VA max.</td></tr>
                <tr><td><strong>Memory Protection</strong></td><td>EEPROM 4K bit non-volatile memory (number of writes: 100,000)</td></tr>
                <tr><td><strong>Display Method</strong></td><td>2 line × 4 character 7-segment LED display. Process value (PV): Red color, Set point (SV): Green color</td></tr>
                <tr><td><strong>Sensor Type (Thermocouple)</strong></td><td>K, J, T, E, N, R, S, B, L, U, TXK</td></tr>
                <tr><td><strong>Sensor Type (RTD)</strong></td><td>3-wire Platinum RTD: Pt100, JPt100</td></tr>
                <tr><td><strong>Sensor Type (Analog Input)</strong></td><td>0 ~ 5V, 0 ~ 10V, 0 ~ 20 mA, 4 ~ 20 mA, 0 ~ 50 mV</td></tr>
                <tr><td><strong>Control Mode</strong></td><td>PID, ON/OFF, Manual or PID program control (Ramp/Soak control)</td></tr>
                <tr><td><strong>Control Output (Relay)</strong></td><td>Relay output: SPDT (Max. load 250VAC, 5A resistive load)</td></tr>
                <tr><td><strong>Control Output (Current)</strong></td><td>DC 4 ~ 20 mA output (Load resistance: Max. 600Ω)</td></tr>
                <tr><td><strong>Display Accuracy</strong></td><td>0 or 1 digit to the right of the decimal point (selectable)</td></tr>
                <tr><td><strong>Sampling Rate</strong></td><td>Analog input: 150 msec per scan; Thermocouple or RTD: 400 msec per scan</td></tr>
                <tr><td><strong>RS-485 Communication</strong></td><td>MODBUS ASCII / RTU communication protocol (Baud: 2400 to 38400 bps)</td></tr>
                <tr><td><strong>Vibration &amp; Shock Resistance</strong></td><td>10 to 55 Hz, 10 m/s2 for 10 min; Shock: Max. 300 m/s2, 3 times in each 3 axes</td></tr>
                <tr><td><strong>Ambient Operating Range</strong></td><td>0°C to +50°C; Storage: -20°C to +65°C; Relative Humidity: 35% to 80% (non-condensing); Altitude: 2000m or less</td></tr>
              </tbody>
            </table>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p51_Image380.webp" alt="Figure 5.3: Delta DTB9696 Terminal Connection Diagram" className="figure-img" />
            <figcaption>Figure 5.3: Delta DTB9696 Rear Panel Terminal Connection Diagram</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 5.3 ControlAir Type 500 I/P Converter ─────────────────────
  {
    id: 'sec-5-3',
    chapterNumber: '5',
    chapterTitle: '5. Component Specifications',
    sectionNumber: '5.3',
    title: '5.3 Control Air – I/P Converter',
    pageNumber: 37,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>ControlAir Type 500 Technical Specification</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Input</strong></td><td>4 – 20 mA DC (also supports 0–10 Vdc, 0–5 Vdc, 1–9 Vdc)</td></tr>
                <tr><td><strong>Output Range</strong></td><td>3 – 15 psig (0.20 – 1.0 bar); available options: 1–17 psig, 2–60 psig, 3–120 psig, 3–27 psig, 6–30 psig</td></tr>
                <tr><td><strong>Max. Supply Pressure</strong></td><td>150 psig (10 bar) (Operating supply: 20–30 psi)</td></tr>
                <tr><td><strong>Supply Pressure Sensitivity</strong></td><td>&lt; ±0.1% of span per psig (&lt; ±0.15% of span per 0.1 bar)</td></tr>
                <tr><td><strong>Flow Rate</strong></td><td>20 scfm (566 Nl/min) at 100 psig supply</td></tr>
                <tr><td><strong>Maximum Air Consumption</strong></td><td>0.07 scfm (1.98 Nl/min)</td></tr>
                <tr><td><strong>Repeatability</strong></td><td>&lt; 0.5% of span</td></tr>
                <tr><td><strong>Hysteresis</strong></td><td>&lt; 1.0% of span (&lt; 0.5% typical)</td></tr>
                <tr><td><strong>Response Time</strong></td><td>Dependent on pressure range – typically less than 0.25 sec for 3–15 psig units</td></tr>
                <tr><td><strong>Media</strong></td><td>Oil-free, clean dry air filtered to 40 micron</td></tr>
                <tr><td><strong>Electrical Connection</strong></td><td>Conduit 1/2&quot; NPT, DIN 43650 terminal plug</td></tr>
                <tr><td><strong>Enclosure</strong></td><td>NEMA 1, NEMA 4X (IP65) powder coated cast aluminum</td></tr>
                <tr><td><strong>Ambient Temperature Limits</strong></td><td>-20° to +140°F (-30° to +60°C)</td></tr>
                <tr><td><strong>Port Sizes</strong></td><td>1/4&quot; NPT (Pneumatic In/Out), 1/2&quot; NPT (Electrical)</td></tr>
                <tr><td><strong>Weight</strong></td><td>2.1 lbs (0.94 kg)</td></tr>
                <tr><td><strong>URL</strong></td><td><a href="https://www.controlair.com/product/type-500-electro-pneumatic-i-p-transducer-i-p-e-p/" target="_blank" rel="noreferrer">ControlAir Type 500 Transducer Product Page</a></td></tr>
              </tbody>
            </table>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p52_Image382.webp" alt="Figure 5.4: ControlAir Type 500 I/P Converter" className="figure-img" />
            <figcaption>Figure 5.4: ControlAir Type 500 Electro-Pneumatic Transducer</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 5.4 Pneucon Control Valve ─────────────────────────────────
  {
    id: 'sec-5-4',
    chapterNumber: '5',
    chapterTitle: '5. Component Specifications',
    sectionNumber: '5.4',
    title: '5.4 Pneucon – Control Valve',
    pageNumber: 38,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Pneucon Specification Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Product</strong></td><td>Pneumatic Control Valve</td></tr>
                <tr><td><strong>Manufacturer</strong></td><td>Pneucon Valves</td></tr>
                <tr><td><strong>Model</strong></td><td>PVCT-119</td></tr>
                <tr><td><strong>Input</strong></td><td>3 – 15 psig pneumatic signal</td></tr>
                <tr><td><strong>Valve Size</strong></td><td>15 mm (1/2&quot;)</td></tr>
                <tr><td><strong>Type</strong></td><td>Linear, Air-to-Close (Fail Open) / Air-to-Open (Fail Close), Globe 2-way</td></tr>
                <tr><td><strong>End Connection</strong></td><td>Screwed Female BSP / NPT</td></tr>
                <tr><td><strong>Material</strong></td><td>Body: Cast Carbon Steel (CCS); Trim: Stainless Steel (SS316)</td></tr>
                <tr><td><strong>Actuator Type</strong></td><td>Multi-spring pneumatic diaphragm actuator, Travel 14.3 mm, Effective area 12 Square inch</td></tr>
                <tr><td><strong>Spring Range</strong></td><td>0.2 – 1.0 bar (3 – 15 psi)</td></tr>
                <tr><td><strong>Flow Coefficient (Cv)</strong></td><td>0.63</td></tr>
                <tr><td><strong>Air Connection</strong></td><td>1/4&quot; NPT</td></tr>
                <tr><td><strong>URL</strong></td><td><a href="https://www.pneuconvalves.com/low-flow-globe-2-way-control-valve-series-119/" target="_blank" rel="noreferrer">Pneucon Series 119 Control Valve Details</a></td></tr>
              </tbody>
            </table>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p53_Image385.webp" alt="Figure 5.5: Pneucon Pneumatic Control Valve" className="figure-img" />
            <figcaption>Figure 5.5: Pneucon Pneumatic Control Valve and Actuator Assembly</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 5.5 Eureka Rotameter ──────────────────────────────────────
  {
    id: 'sec-5-5',
    chapterNumber: '5',
    chapterTitle: '5. Component Specifications',
    sectionNumber: '5.5',
    title: '5.5 Eureka – Rotameter',
    pageNumber: 39,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Eureka Rotameter Specification Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Accuracy</strong></td><td>±2% of Full Scale</td></tr>
                <tr><td><strong>Repeatability</strong></td><td>10:1 Turndown Ratio</td></tr>
                <tr><td><strong>Liquid Flow Range</strong></td><td>10 to 100 LPH (Water)</td></tr>
                <tr><td><strong>Gas Flow Range</strong></td><td>1 to 5000 NLPH (Air)</td></tr>
                <tr><td><strong>Body Materials</strong></td><td>MS powder coated / SS304 / SS316 / PP / PVC</td></tr>
                <tr><td><strong>Metering Tube</strong></td><td>High-precision calibrated Borosilicate Glass</td></tr>
                <tr><td><strong>Float Material</strong></td><td>SS316, PTFE, or Ceramic</td></tr>
                <tr><td><strong>Gaskets / O-Rings</strong></td><td>Neoprene, Viton, PTFE, or Silicon</td></tr>
                <tr><td><strong>End Connections</strong></td><td>1/4&quot; or 1/2&quot; BSP / NPT (Rear or Vertical)</td></tr>
                <tr><td><strong>Max Temperature</strong></td><td>Up to 150°C (depending on material)</td></tr>
                <tr><td><strong>Max Pressure</strong></td><td>Up to 10 Bar (standard)</td></tr>
                <tr><td><strong>URL</strong></td><td><a href="https://5.imimg.com/data5/SELLER/Doc/2022/12/XG/HG/CQ/1955678/rotameter.pdf" target="_blank" rel="noreferrer">Eureka Rotameter Technical Catalog</a></td></tr>
              </tbody>
            </table>
          </div>
          <div className="figure-row">
            <figure className="guide-figure">
              <img src="/docs/guide_assets/fig_p55_Image388.webp" alt="Figure 5.6: Eureka Industrial Variable Area Flowmeter" className="figure-img" />
              <figcaption>Figure 5.6: Eureka Industrial Glass Tube Rotameter</figcaption>
            </figure>
            <figure className="guide-figure">
              <img src="/docs/guide_assets/fig_p55_Image390.webp" alt="Figure 5.7: Rotameter Construction Details" className="figure-img" />
              <figcaption>Figure 5.7: Rotameter Internal Construction &amp; Float Details</figcaption>
            </figure>
          </div>
        </section>
      </div>
    ),
  },

  // ── 6.1 Default Regulation Settings ───────────────────────────
  {
    id: 'sec-6-1',
    chapterNumber: '6',
    chapterTitle: '6. Controller Settings & Modbus Address',
    sectionNumber: '6.1',
    title: '6.1 Default Regulation Settings',
    pageNumber: 40,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The Delta DTB9696 controller is pre-configured at the factory with optimal default regulation parameters for the ACE 101 Level Process Trainer.
          </p>
          <div className="doc-callout warning">
            <strong>*Note:</strong> Values highlighted in RED in the technical manual are critical factory calibration settings and are not to be altered during standard laboratory experiments.
          </div>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Parameter Name</th>
                  <th>Parameter Code</th>
                  <th>Default Setting Value</th>
                  <th>Description / Function</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Regulation</strong></td><td>Auto-tuning</td><td>AT</td><td>OFF</td><td>PID auto-tuning disable / enable</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Proportional Band</td><td>P</td><td>100.0 %</td><td>Proportional gain PB (Kp = 100 / PB)</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Integral Time</td><td>I</td><td>0 s</td><td>Integral reset time Ti (0 = OFF)</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Derivative Time</td><td>D</td><td>0 s</td><td>Derivative rate time Td (0 = OFF)</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Integral Offset / Bias</td><td>iOF</td><td>0.0 %</td><td>Manual reset bias offset</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Control Mode</td><td>CTRL</td><td>PID</td><td>Control algorithm mode: PID, ON/OFF, MANUAL</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Control Action</td><td>S-HC</td><td>COOL / D</td><td>Direct action (D) for level regulation</td></tr>
                <tr><td><strong>Regulation</strong></td><td>Output Period</td><td>HTPD</td><td>2.0 s</td><td>Output cycle period for 4–20 mA loop</td></tr>
                <tr><td><strong>Operation</strong></td><td>Upper Setpoint Limit</td><td>SPH</td><td>100.0 %</td><td>Maximum allowable set point value</td></tr>
                <tr><td><strong>Operation</strong></td><td>Lower Setpoint Limit</td><td>SPL</td><td>0.0 %</td><td>Minimum allowable set point value</td></tr>
                <tr><td><strong>Initial Setting</strong></td><td>Input Type</td><td>INPT</td><td>4_20</td><td>Current input 4–20 mA corresponding to level transmitter</td></tr>
                <tr><td><strong>Initial Setting</strong></td><td>Decimal Point</td><td>DP</td><td>1</td><td>Single decimal digit resolution (0.1 %)</td></tr>
                <tr><td><strong>Initial Setting</strong></td><td>Unit</td><td>UNIT</td><td>C</td><td>Engineering display unit</td></tr>
              </tbody>
            </table>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p56_Image468.webp" alt="Figure 6.1: Delta DTB Factory Default Settings Table" className="figure-img" />
            <figcaption>Figure 6.1: Delta DTB Factory Default Settings and Parameter Structure</figcaption>
          </figure>
        </section>
      </div>
    ),
  },

  // ── 6.2 Modbus Addresses ──────────────────────────────────────
  {
    id: 'sec-6-2',
    chapterNumber: '6',
    chapterTitle: '6. Controller Settings & Modbus Address',
    sectionNumber: '6.2',
    title: '6.2 Modbus Address Map (Registers 4096-4114)',
    pageNumber: 41,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            The Delta DTB9696 controller communicates with external software via RS-485 serial bus using the MODBUS RTU protocol (Baud rate: 9600, 8 Data bits, No parity, 1 Stop bit). The exact internal memory addresses and corresponding MODBUS holding registers are tabulated below:
          </p>
          <div className="table-responsive">
            <table className="doc-table modbus-table">
              <thead>
                <tr>
                  <th>Sl. No.</th>
                  <th>Description</th>
                  <th>Memory Address (Hex)</th>
                  <th>MODBUS Register (Dec)</th>
                  <th>Access</th>
                  <th>Range / Scale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="highlight-row">
                  <td>1</td>
                  <td><strong>Process Variable (PV)</strong></td>
                  <td><code>1000H</code></td>
                  <td><code>44097</code> (4096)</td>
                  <td>Read Only</td>
                  <td>0.0 – 100.0 %</td>
                </tr>
                <tr className="highlight-row">
                  <td>2</td>
                  <td><strong>Set Point (SP)</strong></td>
                  <td><code>1001H</code></td>
                  <td><code>44098</code> (4097)</td>
                  <td>Read / Write</td>
                  <td>0.0 – 100.0 %</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td><strong>Auto / Manual</strong></td>
                  <td><code>1005H</code></td>
                  <td><code>44102</code> (4101)</td>
                  <td>Read / Write</td>
                  <td>0 = Auto, 2 = Manual</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td><strong>Action</strong></td>
                  <td><code>1006H</code></td>
                  <td><code>44103</code> (4102)</td>
                  <td>Read / Write</td>
                  <td>0 = Reverse, 1 = Direct</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td><strong>Proportional Band (PB)</strong></td>
                  <td><code>1009H</code></td>
                  <td><code>44106</code> (4105)</td>
                  <td>Read / Write</td>
                  <td>0.1 – 999.9 %</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td><strong>Integral Time (Ti)</strong></td>
                  <td><code>100AH</code></td>
                  <td><code>44107</code> (4106)</td>
                  <td>Read / Write</td>
                  <td>0 – 9999 s</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td><strong>Derivative Time (Td)</strong></td>
                  <td><code>100BH</code></td>
                  <td><code>44108</code> (4107)</td>
                  <td>Read / Write</td>
                  <td>0 – 9999 s</td>
                </tr>
                <tr>
                  <td>8</td>
                  <td><strong>Bias</strong></td>
                  <td><code>100CH</code></td>
                  <td><code>44109</code> (4108)</td>
                  <td>Read / Write</td>
                  <td>0.0 – 100.0 %</td>
                </tr>
                <tr className="highlight-row">
                  <td>9</td>
                  <td><strong>Controller Output (OP / MV)</strong></td>
                  <td><code>1012H</code></td>
                  <td><code>44115</code> (4114)</td>
                  <td>Read / Write</td>
                  <td>0.0 – 100.0 %</td>
                </tr>
                <tr>
                  <td>10</td>
                  <td><strong>Auto Tuning (AT)</strong></td>
                  <td><code>0813H</code></td>
                  <td><code>42068</code> (2067)</td>
                  <td>Read / Write</td>
                  <td>0 = Stop, 1 = Start</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },

  // ── 7.1 Introduction & Vision ─────────────────────────────────
  {
    id: 'sec-7-1',
    chapterNumber: '7',
    chapterTitle: '7. Technical Support & Manufacturer',
    sectionNumber: '7.1',
    title: '7.1 Introduction & 7.2 Vision and Values',
    pageNumber: 42,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <h3 className="subsection-title">7.1 Introduction</h3>
          <p className="doc-paragraph">
            With a strong focus on applied learning, <strong>Advanced Control Equipments (ACE)</strong> develops miniaturized industrial working models for laboratory environments. We design and manufacture laboratory modules that provide hands-on training across disciplines including mechanical, electrical, electronics, mechatronics, instrumentation, and chemical engineering.
          </p>
          <p className="doc-paragraph">
            With over two decades of experience, ACE is committed to delivering industry-standard equipment at affordable prices. Our product range includes process control systems, instrumentation systems, mechatronics setups, PLC and microcontroller-based systems, home automation solutions, and more.
          </p>
          <p className="doc-paragraph">
            Using our powerful in-house software, we support both real-time control and model-based simulation and control. Our user-friendly simulation / hardware interface tools help aspiring engineers understand key concepts such as mathematical modelling, controller design and analysis, PID tuning, and model-based control strategies. We also enable users to implement custom control algorithms, in addition to built-in standard algorithms.
          </p>

          <h3 className="subsection-title">7.2 Vision and Values</h3>
          <p className="doc-paragraph">
            Our vision is to empower engineering students and researchers with cutting-edge, industry-relevant educational equipment and software tools that bridge the gap between academic theory and practical industrial application.
          </p>
          <ul className="doc-list">
            <li><strong>Innovation:</strong> Constantly upgrading hardware architectures and software capabilities to incorporate Industry 4.0, IoT, and advanced control paradigms.</li>
            <li><strong>Quality &amp; Precision:</strong> Utilizing certified industrial instrumentation (WIKA, Delta, ControlAir, Pneucon, Eureka) to guarantee reliable, repeatable experimental results.</li>
            <li><strong>Customer Commitment:</strong> Providing continuous academic support, comprehensive manuals, and responsive after-sales service to colleges, universities, and research institutions nationwide.</li>
          </ul>
        </section>
      </div>
    ),
  },

  // ── 7.3 Product Range ─────────────────────────────────────────
  {
    id: 'sec-7-3',
    chapterNumber: '7',
    chapterTitle: '7. Technical Support & Manufacturer',
    sectionNumber: '7.3',
    title: '7.3 Product Range Across All Series',
    pageNumber: 43,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            Advanced Control Equipments manufactures an extensive portfolio of trainers across 9 product series catering to instrumentation, control, and process engineering laboratories:
          </p>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Series</th>
                  <th>Product Model</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td rowSpan={11}><strong>ACE 100 Series</strong><br />Basic Process Trainers</td><td>ACE 101</td><td>Level Process Trainer</td></tr>
                <tr><td>ACE 102</td><td>Flow Process Trainer</td></tr>
                <tr><td>ACE 103</td><td>Pressure Process Trainer</td></tr>
                <tr><td>ACE 104</td><td>Temperature Process Trainer</td></tr>
                <tr><td>ACE 105</td><td>Multi Process Trainer (Level, Flow, Pressure &amp; Temp)</td></tr>
                <tr><td>ACE 106</td><td>Cascade Process Trainer (Level + Flow)</td></tr>
                <tr><td>ACE 107</td><td>Cascade Process Trainer (Temperature + Flow)</td></tr>
                <tr><td>ACE 108</td><td>Multi Variable Process Trainer (Level, Flow, Ratio)</td></tr>
                <tr><td>ACE 109</td><td>Coupled Tank Interacting Level Process Trainer</td></tr>
                <tr><td>ACE 110</td><td>Four Tank Level Process Trainer</td></tr>
                <tr><td>ACE 111</td><td>Five Tank Level Process Trainer</td></tr>

                <tr><td rowSpan={14}><strong>ACE 200 Series</strong><br />Advanced Process Trainers</td><td>ACE 201</td><td>Interdependent Variable MIMO Process Trainer</td></tr>
                <tr><td>ACE 202</td><td>SCADA, DDC and HMI Trainer</td></tr>
                <tr><td>ACE 203</td><td>Advanced Control Strategies Trainer</td></tr>
                <tr><td>ACE 204</td><td>MIMO Process Control Trainer</td></tr>
                <tr><td>ACE 205</td><td>Industrial Communication Protocol Trainer</td></tr>
                <tr><td>ACE 206</td><td>Interacting Quadruple System Trainer</td></tr>
                <tr><td>ACE 207</td><td>Hybrid Tank System</td></tr>
                <tr><td>ACE 208</td><td>Universal Process Trainer</td></tr>
                <tr><td>ACE 209</td><td>Universal Process Measurement &amp; Control Trainer</td></tr>
                <tr><td>ACE 211</td><td>Distillation Column Trainer</td></tr>
                <tr><td>ACE 212</td><td>Continuous Stirred Tank Reactor Trainer (CSTR)</td></tr>
                <tr><td>ACE 214</td><td>Distributed Control System Trainer (DCS)</td></tr>
                <tr><td>ACE 215</td><td>Liquid-Liquid Extraction Trainer</td></tr>
                <tr><td>ACE 217</td><td>Computerized Bioreactor System</td></tr>

                <tr><td rowSpan={7}><strong>ACE 300 Series</strong><br />Non-Linear Process Trainers</td><td>ACE 301</td><td>pH Process Trainer</td></tr>
                <tr><td>ACE 302</td><td>Conical Tank Level Process Trainer</td></tr>
                <tr><td>ACE 303</td><td>Spherical Tank Level Process Trainer</td></tr>
                <tr><td>ACE 304</td><td>Conical &amp; Spherical Tank Level Process Trainer</td></tr>
                <tr><td>ACE 305</td><td>Conical (Spherical) Two Tank MIMO Process Trainer</td></tr>
                <tr><td>ACE 306</td><td>Linear &amp; Nonlinear Multi Tank Level Process Trainer</td></tr>
                <tr><td>ACE 307</td><td>Linear &amp; Nonlinear Multi Shape Level Process Trainer</td></tr>

                <tr><td rowSpan={12}><strong>ACE 400 Series</strong><br />Process Simulators</td><td>ACE 401</td><td>Two Position &amp; PID Simulator</td></tr>
                <tr><td>ACE 402</td><td>Model based Closed loop simulator with PID</td></tr>
                <tr><td>ACE 403</td><td>Empirical Model Estimator</td></tr>
                <tr><td>ACE 404</td><td>Model Analysis &amp; PID Controller Design</td></tr>
                <tr><td>ACE 405</td><td>PID Tuning Techniques</td></tr>
                <tr><td>ACE 406</td><td>Cascade Control Simulator</td></tr>
                <tr><td>ACE 407</td><td>Feedforward + Feedback Simulator</td></tr>
                <tr><td>ACE 408</td><td>Ratio Control Simulator</td></tr>
                <tr><td>ACE 409</td><td>Non-Interacting Level Tank Control Simulator</td></tr>
                <tr><td>ACE 410</td><td>Fuzzy Control Design &amp; Simulator</td></tr>
                <tr><td>ACE 411</td><td>Non-Interacting Level Simulator with Smith Predictor</td></tr>
                <tr><td>ACE 412</td><td>Internal Model Control (IMC) Simulator</td></tr>

                <tr><td rowSpan={15}><strong>ACE 500 Series</strong><br />Instrumentation Trainers</td><td>ACE 501</td><td>I/P and P/I Converter Trainer</td></tr>
                <tr><td>ACE 502</td><td>Control Valve Characteristics Trainer</td></tr>
                <tr><td>ACE 503</td><td>Temperature Measurement Trainer</td></tr>
                <tr><td>ACE 504</td><td>Flow Measurement Trainer</td></tr>
                <tr><td>ACE 505</td><td>Level Measurement Trainer</td></tr>
                <tr><td>ACE 506</td><td>Pressure Measurement System</td></tr>
                <tr><td>ACE 507</td><td>First Order &amp; Second Order Systems</td></tr>
                <tr><td>ACE 508</td><td>Bourdon Tube Pressure Gauge Tester</td></tr>
                <tr><td>ACE 509</td><td>Interacting and Non-Interacting Trainer</td></tr>
                <tr><td>ACE 510</td><td>Flapper Nozzle System</td></tr>
                <tr><td>ACE 511</td><td>Multifunction Calibrator</td></tr>
                <tr><td>ACE 512</td><td>Speed / Torque Measurement Trainer</td></tr>
                <tr><td>ACE 513</td><td>Humidity Measurement and Control Setup</td></tr>
                <tr><td>ACE 514</td><td>Electronic PID Controller Setup</td></tr>
                <tr><td>ACE 517</td><td>Conductivity Measurement Trainer</td></tr>

                <tr><td rowSpan={5}><strong>ACE 600 Series</strong><br />Mechanical Systems</td><td>ACE 601</td><td>Lagged pipe assembly</td></tr>
                <tr><td>ACE 602</td><td>Heat Exchangers (Computerised / Non-Computerised)</td></tr>
                <tr><td>ACE 603</td><td>Transesterification Reactor</td></tr>
                <tr><td>ACE 604</td><td>Two Tank Heater Setup</td></tr>
                <tr><td>ACE 605</td><td>Dryer Setup</td></tr>

                <tr><td rowSpan={5}><strong>ACE 700 Series</strong><br />IoT Systems</td><td>ACE 701</td><td>Remote Monitoring Station</td></tr>
                <tr><td>ACE 702</td><td>Compact Universal IoT Trainer Kit</td></tr>
                <tr><td>ACE 703</td><td>IoT Trainer Kit with Raspberry Pi &amp; Arduino</td></tr>
                <tr><td>ACE 704</td><td>IoT Trainer Kit with Raspberry Pi &amp; ESP32</td></tr>
                <tr><td>ACE 705</td><td>IoT Trainer Kit with IoT2040 Gateway</td></tr>

                <tr><td rowSpan={15}><strong>ACE 800 Series</strong><br />PLC Based Systems</td><td>ACE 801</td><td>Compact PLC Trainer</td></tr>
                <tr><td>ACE 802</td><td>Bottle Filling Station</td></tr>
                <tr><td>ACE 803</td><td>Mixing Process Station</td></tr>
                <tr><td>ACE 804</td><td>Temperature Process Station</td></tr>
                <tr><td>ACE 805</td><td>Material Sorting Station</td></tr>
                <tr><td>ACE 806</td><td>Motor Control Station</td></tr>
                <tr><td>ACE 807</td><td>Elevator Control Station</td></tr>
                <tr><td>ACE 808</td><td>Pick &amp; Place Robot Station</td></tr>
                <tr><td>ACE 809</td><td>Traffic Light Control Station</td></tr>
                <tr><td>ACE 810</td><td>Flow Process Trainer</td></tr>
                <tr><td>ACE 811</td><td>Level Process Trainer</td></tr>
                <tr><td>ACE 812</td><td>Temperature Process Trainer</td></tr>
                <tr><td>ACE 813</td><td>Pressure Process Trainer</td></tr>
                <tr><td>ACE 814</td><td>Pneumatic Control Trainer Using PLC</td></tr>
                <tr><td>ACE 815</td><td>Annunciation System Using PLC</td></tr>

                <tr><td rowSpan={11}><strong>ACE 2000 Series</strong><br />Data Acquisition Systems</td><td>ACE 2001</td><td>Voltage Module 8AI / 2AO</td></tr>
                <tr><td>ACE 2002</td><td>Current Module 4AI / 2AO</td></tr>
                <tr><td>ACE 2003</td><td>Dual Loop PID Controller (Voltage Module)</td></tr>
                <tr><td>ACE 2004</td><td>Dual Loop PID Controller (Current Module)</td></tr>
                <tr><td>ACE 2005</td><td>Voltage (8AI / 2AO) / Current (4AI / 2AO) Module</td></tr>
                <tr><td>ACE 2006</td><td>Wireless Voltage Module 6AI / 2DI / 2AO</td></tr>
                <tr><td>ACE 2007</td><td>Wireless Current Module 4AI / 2AO</td></tr>
                <tr><td>ACE 2008</td><td>Wireless Dual Loop PID Controller (Voltage)</td></tr>
                <tr><td>ACE 2009</td><td>Wireless Dual Loop PID Controller (Current)</td></tr>
                <tr><td>ACE 2101</td><td>Edge IoT DAQ Module</td></tr>
                <tr><td>ACE 2102</td><td>Industrial Gateway DAQ Module</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },

  // ── 7.4 Customer List & Technical Support ─────────────────────
  {
    id: 'sec-7-4',
    chapterNumber: '7',
    chapterTitle: '7. Technical Support & Manufacturer',
    sectionNumber: '7.4',
    title: '7.4 Customer List & Technical Support',
    pageNumber: 44,
    render: () => (
      <div className="page-body">
        <section className="page-section">
          <p className="doc-paragraph">
            From fundamental concepts to advanced model-based control, Advanced Control Equipments offers a wide range of equipment and tools. With strong expertise in both hardware and software, ACE supports faculty, students, and the research community in areas such as process control, modelling and simulation, instrumentation systems, and chemical engineering.
          </p>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>State</th>
                  <th>Place</th>
                  <th>Institute Name</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>Andhra Pradesh</td><td>Kakinada</td><td>University College of Engineering, JNTU</td></tr>
                <tr><td>2</td><td>Andhra Pradesh</td><td>Srikakulam</td><td>GMR Institute of Technology</td></tr>
                <tr><td>3</td><td>Andhra Pradesh</td><td>Vijayawada</td><td>PVP Siddhartha Institute of Technology</td></tr>
                <tr><td>4</td><td>Andhra Pradesh</td><td>Visakhapatnam</td><td>Andhra University College of Engineering</td></tr>
                <tr><td>5</td><td>Assam</td><td>Guwahati</td><td>Indian Institute of Technology (IIT Guwahati)</td></tr>
                <tr><td>6</td><td>Assam</td><td>Kokrajhar</td><td>Central Institute of Technology</td></tr>
                <tr><td>7</td><td>Goa</td><td>Goa</td><td>Birla Institute of Technology, Goa Campus (BITS Goa)</td></tr>
                <tr><td>8</td><td>Goa</td><td>Goa</td><td>Padre Conceicao College of Engineering</td></tr>
                <tr><td>9</td><td>Goa</td><td>Verna</td><td>Agnel Institute of Technology and Design</td></tr>
                <tr><td>10</td><td>Jammu Kashmir</td><td>Jammu</td><td>Indian Institute of Technology (IIT Jammu)</td></tr>
                <tr><td>11</td><td>Jharkhand</td><td>Ranchi</td><td>Birla Institute of Technology, Mesra (BIT Mesra)</td></tr>
                <tr><td>12</td><td>Karnataka</td><td>Bangalore</td><td>BMS College of Engineering</td></tr>
                <tr><td>13</td><td>Karnataka</td><td>Bangalore</td><td>Dayananda Sagar College of Engineering</td></tr>
                <tr><td>14</td><td>Karnataka</td><td>Bangalore</td><td>R V College of Engineering (RVCE)</td></tr>
                <tr><td>15</td><td>Karnataka</td><td>Belagavi</td><td>KLE Dr. M. S. Sheshgiri College of Engineering</td></tr>
                <tr><td>16</td><td>Karnataka</td><td>Dharwad</td><td>SDM College of Engineering &amp; Technology</td></tr>
                <tr><td>17</td><td>Karnataka</td><td>Mangalore</td><td>Mangalore Institute of Technology and Engineering</td></tr>
                <tr><td>18</td><td>Karnataka</td><td>Manipal</td><td>Manipal Institute of Technology (MIT Manipal)</td></tr>
                <tr><td>19</td><td>Karnataka</td><td>Tumkur</td><td>Siddaganga Institute of Technology</td></tr>
                <tr><td>20</td><td>Kerala</td><td>Calicut</td><td>National Institute of Technology (NIT Calicut)</td></tr>
                <tr><td>21</td><td>Maharashtra</td><td>Ahmednagar</td><td>Dr. Vithalrao Vikhe Patil College of Engineering</td></tr>
                <tr><td>22</td><td>Maharashtra</td><td>Ahmednagar</td><td>Pravara Rural Engineering College</td></tr>
                <tr><td>23</td><td>Maharashtra</td><td>Mumbai</td><td>Sardar Patel Institute of Technology (SPIT)</td></tr>
                <tr><td>24</td><td>Maharashtra</td><td>Nanded</td><td>Sh. Guru Gobind Singhji College of Engg. (SGGS)</td></tr>
                <tr><td>25</td><td>Maharashtra</td><td>Nasik</td><td>NDMVPS&#39;s KBT College of Engineering</td></tr>
                <tr><td>26</td><td>Maharashtra</td><td>Navi Mumbai</td><td>Bharati Vidyapeeth&#39;s College of Engineering</td></tr>
                <tr><td>27</td><td>Maharashtra</td><td>Pune</td><td>Dr. D. Y. Patil Institute of Technology</td></tr>
                <tr><td>28</td><td>Maharashtra</td><td>Pune</td><td>Vishwakarma Institute of Technology (VIT Pune)</td></tr>
                <tr><td>29</td><td>Odisha</td><td>Rourkela</td><td>National Institute of Technology (NIT Rourkela)</td></tr>
                <tr><td>30</td><td>Punjab</td><td>Ropar</td><td>Indian Institute of Technology (IIT Ropar)</td></tr>
                <tr><td>31</td><td>Rajasthan</td><td>Jaipur</td><td>Malaviya National Institute of Technology (MNIT)</td></tr>
                <tr><td>32</td><td>Rajasthan</td><td>Pilani</td><td>Birla Institute of Technology and Science (BITS Pilani)</td></tr>
                <tr><td>33</td><td>Tamil Nadu</td><td>Chennai</td><td>Apex Service and Instruments</td></tr>
                <tr><td>34</td><td>Tamil Nadu</td><td>Coimbatore</td><td>Amrita Vishwa Vidyapeetham</td></tr>
                <tr><td>35</td><td>Tamil Nadu</td><td>Coimbatore</td><td>PSG College of Technology</td></tr>
                <tr><td>36</td><td>Tamil Nadu</td><td>Coimbatore</td><td>PSG Institute of Technology and Applied Research</td></tr>
                <tr><td>37</td><td>Tamil Nadu</td><td>Mayiladuthurai</td><td>AVC College of Engineering</td></tr>
                <tr><td>38</td><td>Tamil Nadu</td><td>Perundurai</td><td>Kongu Engineering College</td></tr>
                <tr><td>39</td><td>Tamil Nadu</td><td>Tiruchirappalli</td><td>National Institute of Technology (NIT Trichy)</td></tr>
                <tr><td>40</td><td>Tamil Nadu</td><td>Tiruchirappalli</td><td>Saranathan College of Engineering</td></tr>
                <tr><td>41</td><td>Tamil Nadu</td><td>Vellore</td><td>Vellore Institute of Technology (VIT Vellore)</td></tr>
                <tr><td>42</td><td>Telangana</td><td>Medak</td><td>Medak College of Engineering and Technology</td></tr>
                <tr><td>43</td><td>Telangana</td><td>Warangal</td><td>National Institute of Technology (NIT Warangal)</td></tr>
                <tr><td>44</td><td>Telangana</td><td>Hyderabad</td><td>BITS Pilani, Hyderabad Campus</td></tr>
              </tbody>
            </table>
          </div>
          <div className="doc-callout info" style={{ marginTop: '24px' }}>
            <strong>Technical Support &amp; Customer Care:</strong>
            <p className="doc-paragraph" style={{ marginTop: '8px' }}>
              Advanced Control Equipments is committed to providing prompt technical support, firmware updates, and maintenance services.
            </p>
            <ul className="doc-list">
              <li><strong>Email Support:</strong> <code>contact@advancedcontrol.in</code> / <code>support@advancedcontrol.in</code></li>
              <li><strong>Website:</strong> <a href="https://www.advancedcontrol.in" target="_blank" rel="noreferrer">www.advancedcontrol.in</a></li>
              <li><strong>Hardware Support:</strong> Dedicated technical support for wiring verification, calibration, and spare parts.</li>
            </ul>
          </div>
          <figure className="guide-figure">
            <img src="/docs/guide_assets/fig_p64_Image547.webp" alt="Figure 7.1: Advanced Control Equipments Facility & Contacts" className="figure-img" />
            <figcaption>Figure 7.1: Advanced Control Equipments - Manufacturing Facility &amp; Head Office</figcaption>
          </figure>
        </section>
      </div>
    ),
  },
];
