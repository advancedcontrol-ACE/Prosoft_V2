import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { EstimationMethod } from './SimACE403Schematic';
import './SimACE403Analysis.css';

export interface DataPoint {
  time: number;
  co: number;
  pv: number;
  modelPv?: number;
}

interface SimACE403AnalysisProps {
  method: EstimationMethod;
  recordedData: DataPoint[];
  stepTime: number;
  initialCo: number;
  finalCo: number;
  initialPv: number;
  finalPv: number;
}

export const SimACE403Analysis: React.FC<SimACE403AnalysisProps> = ({
  method,
  recordedData,
  stepTime,
  initialCo,
  finalCo,
  initialPv,
  finalPv,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pidMode, setPidMode] = useState<'p' | 'pi' | 'pd' | 'pid'>('pid');

  // Cursors state
  // C0, C1: Tangent points (t0, pv0), (t1, pv1)
  // C2, C3: Delay interval (t_step, t_rise)
  // C4, C5: Delta PV levels (pv_base, pv_final)
  const deltaCo = finalCo - initialCo || 1;
  const deltaPvRaw = finalPv - initialPv;

  // Initial cursor defaults
  const [c0Time, setC0Time] = useState<number>(0);
  const [c1Time, setC1Time] = useState<number>(0);
  const [c2Time, setC2Time] = useState<number>(0);
  const [c3Time, setC3Time] = useState<number>(0);
  const [c4Pv, setC4Pv] = useState<number>(0);
  const [c5Pv, setC5Pv] = useState<number>(0);

  // Auto-fit cursors based on data
  const handleAutoFit = () => {
    if (recordedData.length < 5) return;
    const tStart = stepTime;
    const pStart = initialPv;
    const pEnd = finalPv;
    const dP = pEnd - pStart;

    // Find inflection / maximum derivative
    let maxSlope = 0;
    let tMaxSlope = tStart;

    for (let i = 1; i < recordedData.length - 1; i++) {
      if (recordedData[i].time >= tStart) {
        const dt = recordedData[i + 1].time - recordedData[i - 1].time;
        const dp = recordedData[i + 1].pv - recordedData[i - 1].pv;
        const s = dt > 0 ? dp / dt : 0;
        if (s > maxSlope) {
          maxSlope = s;
          tMaxSlope = recordedData[i].time;
        }
      }
    }

    // Tangent cursor 0 & 1 around inflection point
    const halfSpan = 5;
    setC0Time(Math.max(tStart, tMaxSlope - halfSpan));
    setC1Time(tMaxSlope + halfSpan);

    // Delay cursor 2 (stepTime) and cursor 3 (start of response, e.g. 2% rise)
    setC2Time(tStart);
    let t3 = tStart + 2;
    for (let i = 0; i < recordedData.length; i++) {
      if (
        recordedData[i].time >= tStart &&
        Math.abs(recordedData[i].pv - pStart) >= Math.abs(dP) * 0.03
      ) {
        t3 = recordedData[i].time;
        break;
      }
    }
    setC3Time(t3);

    // Delta PV cursors 4 & 5
    setC4Pv(pStart);
    setC5Pv(pEnd);
  };

  useEffect(() => {
    handleAutoFit();
  }, [recordedData.length, initialPv, finalPv, stepTime]);

  // Calculations based on method
  const results = useMemo(() => {
    const dCO = deltaCo;
    const dPV = c5Pv - c4Pv !== 0 ? c5Pv - c4Pv : deltaPvRaw;
    const K = dCO !== 0 ? dPV / dCO : 1;

    let tau = 10;
    let theta = Math.max(0, c3Time - c2Time);
    let slope = 0;

    if (method === 'reaction') {
      // Tangent method
      // Find PV at C0 and C1
      const p0 = initialPv + ((c0Time - stepTime) / 30) * dPV;
      const p1 = initialPv + ((c1Time - stepTime) / 30) * dPV;
      const dt = c1Time - c0Time;
      slope = dt !== 0 ? Math.abs((p1 - p0) / dt) : 1;
      if (slope > 0) {
        tau = Math.abs(dPV) / slope;
      }
    } else if (method === 'classical') {
      // 63.2% Transient response method
      // Find time when PV reaches initialPv + 0.632 * dPV
      const targetPv = c4Pv + 0.632 * dPV;
      let t63 = stepTime + 15;
      for (let i = 0; i < recordedData.length; i++) {
        if (
          recordedData[i].time >= stepTime &&
          recordedData[i].pv >= targetPv
        ) {
          t63 = recordedData[i].time;
          break;
        }
      }
      theta = Math.max(0, c3Time - c2Time);
      tau = Math.max(0.5, t63 - theta - stepTime);
    } else {
      // Two Point method: 28.3% and 63.2%
      const target28 = c4Pv + 0.283 * dPV;
      const target63 = c4Pv + 0.632 * dPV;
      let t1 = stepTime + 5;
      let t2 = stepTime + 15;
      for (let i = 0; i < recordedData.length; i++) {
        if (recordedData[i].time >= stepTime) {
          if (recordedData[i].pv >= target28 && t1 === stepTime + 5) {
            t1 = recordedData[i].time;
          }
          if (recordedData[i].pv >= target63) {
            t2 = recordedData[i].time;
            break;
          }
        }
      }
      tau = 1.5 * Math.max(0.2, t2 - t1);
      const rawDelay = t2 - tau - stepTime;
      theta = Math.max(0, rawDelay);
    }

    // ZN Open Loop Tuning Formula
    // K_p = tau / (K * theta)
    const effectiveTheta = Math.max(0.2, theta);
    const effectiveK = Math.max(0.01, Math.abs(K));
    const effectiveTau = Math.max(0.5, tau);

    const znP_Kc = effectiveTau / (effectiveK * effectiveTheta);
    const znP_Ti = 999999;
    const znP_Td = 0;

    const znPI_Kc = (0.9 * effectiveTau) / (effectiveK * effectiveTheta);
    const znPI_Ti = 3.33 * effectiveTheta;
    const znPI_Td = 0;

    const znPD_Kc = (1.2 * effectiveTau) / (effectiveK * effectiveTheta);
    const znPD_Ti = 999999;
    const znPD_Td = 0.5 * effectiveTheta;

    const znPID_Kc = (1.2 * effectiveTau) / (effectiveK * effectiveTheta);
    const znPID_Ti = 2.0 * effectiveTheta;
    const znPID_Td = 0.5 * effectiveTheta;

    return {
      dCO,
      dPV,
      K,
      tau,
      theta,
      slope,
      zn: {
        p: { kc: znP_Kc, pb: (100 / znP_Kc), ti: znP_Ti, td: znP_Td },
        pi: { kc: znPI_Kc, pb: (100 / znPI_Kc), ti: znPI_Ti, td: znPI_Td },
        pd: { kc: znPD_Kc, pb: (100 / znPD_Kc), ti: znPD_Ti, td: znPD_Td },
        pid: { kc: znPID_Kc, pb: (100 / znPID_Kc), ti: znPID_Ti, td: znPID_Td },
      },
    };
  }, [
    method,
    deltaCo,
    c4Pv,
    c5Pv,
    deltaPvRaw,
    c0Time,
    c1Time,
    c2Time,
    c3Time,
    initialPv,
    stepTime,
    recordedData,
  ]);

  // Render Dual Curve Canvas (PV Actual + FOPDT Model + Cursors)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padL = 50;
    const padR = 25;
    const padT = 30;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Compute axes scales
    const maxT = Math.max(60, recordedData[recordedData.length - 1]?.time || 60);
    const minPV = 0;
    const maxPV = Math.max(50, Math.ceil((finalPv + 10) / 10) * 10);

    const xToPix = (t: number) => padL + (t / maxT) * plotW;
    const yToPix = (p: number) => padT + plotH - ((p - minPV) / (maxPV - minPV)) * plotH;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // X grid
    const xStep = maxT > 120 ? 20 : 10;
    for (let t = 0; t <= maxT; t += xStep) {
      const x = xToPix(t);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${t}s`, x, padT + plotH + 15);
    }

    // Y grid
    for (let p = minPV; p <= maxPV; p += 10) {
      const y = yToPix(p);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${p}`, padL - 8, y + 3);
    }

    // Plot Empirical Actual Data (Cyan solid line)
    if (recordedData.length > 1) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < recordedData.length; i++) {
        const x = xToPix(recordedData[i].time);
        const y = yToPix(recordedData[i].pv);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Plot Estimated FOPDT Model Curve (Red dashed line)
    if (results.tau > 0 && recordedData.length > 5) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();

      const { K, tau, theta } = results;
      const tStep = stepTime;
      const pv0 = initialPv;
      const dPV = K * results.dCO;

      let started = false;
      for (let t = 0; t <= maxT; t += 0.5) {
        let mPv = pv0;
        if (t >= tStep + theta) {
          mPv = pv0 + dPV * (1 - Math.exp(-(t - tStep - theta) / tau));
        }
        const x = xToPix(t);
        const y = yToPix(mPv);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]); // reset
    }

    // Draw Cursors
    // C2, C3: Vertical yellow lines for Delay
    if (c2Time > 0) {
      const x2 = xToPix(c2Time);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x2, padT);
      ctx.lineTo(x2, padT + plotH);
      ctx.stroke();
      ctx.fillText('C2: t_step', x2, padT - 6);
    }

    if (c3Time > 0) {
      const x3 = xToPix(c3Time);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x3, padT);
      ctx.lineTo(x3, padT + plotH);
      ctx.stroke();
      ctx.fillText('C3: t_rise', x3, padT - 6);
    }
    ctx.setLineDash([]);

    // C4, C5: Horizontal green lines for Delta PV
    if (c4Pv >= 0) {
      const y4 = yToPix(c4Pv);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, y4);
      ctx.lineTo(padL + plotW, y4);
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`C4: ${c4Pv.toFixed(1)} cm`, padL + plotW - 60, y4 - 4);
    }

    if (c5Pv > 0) {
      const y5 = yToPix(c5Pv);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, y5);
      ctx.lineTo(padL + plotW, y5);
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`C5: ${c5Pv.toFixed(1)} cm`, padL + plotW - 60, y5 - 4);
    }

    // Legend
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(padL + 10, padT + 10, 16, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Empirical PV Response', padL + 32, padT + 15);

    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(padL + 180, padT + 12);
    ctx.lineTo(padL + 200, padT + 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Estimated FOPDT Model', padL + 206, padT + 15);
  }, [
    recordedData,
    finalPv,
    stepTime,
    results,
    c0Time,
    c1Time,
    c2Time,
    c3Time,
    c4Pv,
    c5Pv,
    initialPv,
  ]);

  const activeZn = results.zn[pidMode];

  return (
    <div className="sim403-analysis-container">
      {/* Upper Half: Interactive Canvas Plot */}
      <div className="sim403-plot-wrapper">
        <canvas
          ref={canvasRef}
          width={840}
          height={320}
          className="sim403-trend-canvas"
        />
        <div className="sim403-cursor-toolbar">
          <button type="button" className="sim403-tool-btn" onClick={handleAutoFit}>
            Auto-Position Cursors
          </button>
          <span className="sim403-cursor-legend">
            <span className="badge-dot yellow"></span> Delay (C2, C3)
            <span className="badge-dot green"></span> &Delta;PV (C4, C5)
          </span>
        </div>
      </div>

      {/* Lower Half: FOPDT Model & Controller Design */}
      <div className="sim403-model-cards-grid">
        {/* Card 1: Estimated Transfer Function */}
        <div className="sim403-analysis-card">
          <h4 className="sim403-card-heading">1. Estimated FOPDT Model</h4>
          <div className="sim403-tf-display">
            <span className="tf-label">G(s) =</span>
            <div className="tf-fraction">
              <span className="tf-num">{results.K.toFixed(3)} &middot; e<sup>-{results.theta.toFixed(2)}s</sup></span>
              <div className="tf-bar"></div>
              <span className="tf-den">{results.tau.toFixed(2)}s + 1</span>
            </div>
          </div>

          <div className="sim403-metrics-grid">
            <div className="sim403-metric-box">
              <span className="metric-title">&Delta;CO (%)</span>
              <span className="metric-value">{results.dCO.toFixed(1)}</span>
            </div>
            <div className="sim403-metric-box">
              <span className="metric-title">&Delta;PV (cm)</span>
              <span className="metric-value">{results.dPV.toFixed(2)}</span>
            </div>
            <div className="sim403-metric-box highlight">
              <span className="metric-title">Gain K</span>
              <span className="metric-value">{results.K.toFixed(3)}</span>
            </div>
            <div className="sim403-metric-box highlight">
              <span className="metric-title">Time Const &tau; (s)</span>
              <span className="metric-value">{results.tau.toFixed(2)}</span>
            </div>
            <div className="sim403-metric-box highlight">
              <span className="metric-title">Delay &theta; (s)</span>
              <span className="metric-value">{results.theta.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Ziegler-Nichols Controller Tuning */}
        <div className="sim403-analysis-card">
          <div className="sim403-card-header-flex">
            <h4 className="sim403-card-heading">2. Ziegler-Nichols Open-Loop PID Design</h4>
            <div className="sim403-mode-tabs">
              {(['p', 'pi', 'pd', 'pid'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`sim403-mode-tab-btn ${pidMode === m ? 'active' : ''}`}
                  onClick={() => setPidMode(m)}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <table className="sim403-zn-table">
            <thead>
              <tr>
                <th>Mode</th>
                <th>Gain (Kc)</th>
                <th>PB (%)</th>
                <th>Ti (s)</th>
                <th>Td (s)</th>
              </tr>
            </thead>
            <tbody>
              <tr className={pidMode === 'p' ? 'selected' : ''}>
                <td>P</td>
                <td>{results.zn.p.kc.toFixed(3)}</td>
                <td>{results.zn.p.pb.toFixed(1)}%</td>
                <td>&infin;</td>
                <td>0.00</td>
              </tr>
              <tr className={pidMode === 'pi' ? 'selected' : ''}>
                <td>PI</td>
                <td>{results.zn.pi.kc.toFixed(3)}</td>
                <td>{results.zn.pi.pb.toFixed(1)}%</td>
                <td>{results.zn.pi.ti.toFixed(2)}s</td>
                <td>0.00</td>
              </tr>
              <tr className={pidMode === 'pd' ? 'selected' : ''}>
                <td>PD</td>
                <td>{results.zn.pd.kc.toFixed(3)}</td>
                <td>{results.zn.pd.pb.toFixed(1)}%</td>
                <td>&infin;</td>
                <td>{results.zn.pd.td.toFixed(2)}s</td>
              </tr>
              <tr className={pidMode === 'pid' ? 'selected' : ''}>
                <td>PID</td>
                <td>{results.zn.pid.kc.toFixed(3)}</td>
                <td>{results.zn.pid.pb.toFixed(1)}%</td>
                <td>{results.zn.pid.ti.toFixed(2)}s</td>
                <td>{results.zn.pid.td.toFixed(2)}s</td>
              </tr>
            </tbody>
          </table>

          {/* Controller Transfer Function Box */}
          <div className="sim403-pid-tf-box">
            <span className="tf-label">Gc(s) =</span>
            {pidMode === 'p' && (
              <span className="tf-formula">{activeZn.kc.toFixed(3)}</span>
            )}
            {pidMode === 'pi' && (
              <span className="tf-formula">
                {activeZn.kc.toFixed(3)} &middot; ( 1 + 1 / ({activeZn.ti.toFixed(2)}s) )
              </span>
            )}
            {pidMode === 'pd' && (
              <span className="tf-formula">
                {activeZn.kc.toFixed(3)} &middot; ( 1 + {activeZn.td.toFixed(2)}s )
              </span>
            )}
            {pidMode === 'pid' && (
              <span className="tf-formula">
                {activeZn.kc.toFixed(3)} &middot; ( 1 + 1 / ({activeZn.ti.toFixed(2)}s) + {activeZn.td.toFixed(2)}s )
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
