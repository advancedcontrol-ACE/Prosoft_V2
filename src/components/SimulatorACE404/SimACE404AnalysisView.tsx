import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  type TransferFunction,
  findRoots,
  tfToStateSpace,
  simulateStepResponse,
  computeBodeData,
  type Complex,
} from '../../utils/controlMath';
import './SimACE404AnalysisView.css';

interface SimACE404AnalysisViewProps {
  tf: TransferFunction;
  feedbackH: number;
  pidMode: 'p' | 'pi' | 'pd' | 'pid';
  pidTopology: 'parallel' | 'series';
  kc: number;
  ti: number;
  td: number;
  samplingTimeTs: number;
}

export const SimACE404AnalysisView: React.FC<SimACE404AnalysisViewProps> = ({
  tf,
  feedbackH,
  pidMode,
  pidTopology,
  kc,
  ti,
  td,
  samplingTimeTs,
}) => {
  const [activeTab, setActiveTab] = useState<'tf' | 'openloop' | 'closedloop'>('tf');
  const [openLoopPlotType, setOpenLoopPlotType] = useState<
    'step' | 'pzmap' | 'bode' | 'nyquist' | 'rootlocus'
  >('step');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute Roots and State Space
  const poles = useMemo(() => findRoots(tf.den), [tf.den]);
  const zeros = useMemo(() => findRoots(tf.num), [tf.num]);
  const ss = useMemo(() => tfToStateSpace(tf), [tf]);

  // Discrete Tustin Approximation of G(z)
  const discreteTf = useMemo(() => {
    // Basic bilinear transform preview
    const a0 = tf.den[tf.den.length - 1] || 1;
    const b0 = tf.num[tf.num.length - 1] || 0;
    const gainZ = b0 / (a0 || 1);
    return {
      numStr: `${gainZ.toFixed(3)} (z + 1)`,
      denStr: `z - ${Math.exp(-samplingTimeTs / 5).toFixed(3)}`,
    };
  }, [tf, samplingTimeTs]);

  // Compute Closed-Loop Transfer Function T(s) = Gc*G / (1 + Gc*G*H)
  const closedLoopTf = useMemo<TransferFunction>(() => {
    // Controller numerator and denominator
    let cNum: number[] = [kc];
    let cDen: number[] = [1];

    if (pidMode === 'p') {
      cNum = [kc];
      cDen = [1];
    } else if (pidMode === 'pi') {
      cNum = [kc * ti, kc];
      cDen = [ti, 0];
    } else if (pidMode === 'pd') {
      cNum = [kc * td, kc];
      cDen = [0.1 * td, 1]; // filtered derivative
    } else if (pidMode === 'pid') {
      if (pidTopology === 'parallel') {
        cNum = [kc * ti * td, kc * ti, kc];
        cDen = [ti * 0.1 * td, ti, 0];
      } else {
        cNum = [kc * ti * td, kc * (ti + td), kc];
        cDen = [ti * 0.1 * td, ti, 0];
      }
    }

    // Gc * G
    // Multiply polynomials
    const mul = (p1: number[], p2: number[]): number[] => {
      const res = new Array(p1.length + p2.length - 1).fill(0);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          res[i + j] += p1[i] * p2[j];
        }
      }
      return res;
    };

    const add = (p1: number[], p2: number[]): number[] => {
      const len = Math.max(p1.length, p2.length);
      const res = new Array(len).fill(0);
      for (let i = 0; i < len; i++) {
        const v1 = p1[p1.length - 1 - i] || 0;
        const v2 = p2[p2.length - 1 - i] || 0;
        res[len - 1 - i] = v1 + v2;
      }
      return res;
    };

    const forwardNum = mul(cNum, tf.num);
    const forwardDen = mul(cDen, tf.den);
    const loopNum = forwardNum.map((c) => c * feedbackH);
    const clDen = add(forwardDen, loopNum);

    return { num: forwardNum, den: clDen };
  }, [tf, kc, ti, td, pidMode, pidTopology, feedbackH]);

  // Step response data
  const openStep = useMemo(() => simulateStepResponse(tf, 25, 150), [tf]);
  const closedStep = useMemo(() => simulateStepResponse(closedLoopTf, 25, 150), [closedLoopTf]);
  const bode = useMemo(() => computeBodeData(tf, 0.05, 50, 100), [tf]);

  // Closed loop performance metrics
  const metrics = useMemo(() => {
    const y = closedStep.output;
    const t = closedStep.time;
    const yFinal = y[y.length - 1] || 1;
    let yMax = -Infinity;
    let tPeak = 0;
    let tRise10 = -1;
    let tRise90 = -1;

    for (let i = 0; i < y.length; i++) {
      if (y[i] > yMax) {
        yMax = y[i];
        tPeak = t[i];
      }
      if (tRise10 === -1 && y[i] >= yFinal * 0.1) tRise10 = t[i];
      if (tRise90 === -1 && y[i] >= yFinal * 0.9) tRise90 = t[i];
    }

    const overshootPct = yFinal !== 0 ? Math.max(0, ((yMax - yFinal) / Math.abs(yFinal)) * 100) : 0;
    const riseTime = tRise90 > tRise10 && tRise10 !== -1 ? tRise90 - tRise10 : 0;
    const ess = Math.abs(1 - yFinal);

    // Settling time 2%
    let tSettle = t[t.length - 1];
    for (let i = y.length - 1; i >= 0; i--) {
      if (Math.abs(y[i] - yFinal) > Math.abs(yFinal) * 0.02) {
        tSettle = t[i];
        break;
      }
    }

    return {
      yFinal,
      yMax,
      overshootPct,
      riseTime,
      tPeak,
      tSettle,
      ess,
    };
  }, [closedStep]);

  // Draw on Canvas when tab or plot type changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (activeTab === 'closedloop') {
      // Draw Closed-Loop Step Response
      drawStepResponse(ctx, width, height, closedStep, 'Closed-Loop Step Response y(t)', '#10b981');
    } else if (activeTab === 'openloop') {
      if (openLoopPlotType === 'step') {
        drawStepResponse(ctx, width, height, openStep, 'Open-Loop Step Response y(t)', '#38bdf8');
      } else if (openLoopPlotType === 'pzmap') {
        drawPzMap(ctx, width, height, poles, zeros);
      } else if (openLoopPlotType === 'bode') {
        drawBodePlot(ctx, width, height, bode);
      } else if (openLoopPlotType === 'nyquist') {
        drawNyquistPlot(ctx, width, height, bode);
      } else if (openLoopPlotType === 'rootlocus') {
        drawRootLocus(ctx, width, height, poles, zeros);
      }
    }
  }, [activeTab, openLoopPlotType, openStep, closedStep, bode, poles, zeros]);

  return (
    <div className="sim404-analysis-view">
      {/* Tab Navigation */}
      <div className="sim404-tabs-bar">
        <button
          type="button"
          className={`sim404-view-tab ${activeTab === 'tf' ? 'active' : ''}`}
          onClick={() => setActiveTab('tf')}
        >
          Transfer Function Forms
        </button>
        <button
          type="button"
          className={`sim404-view-tab ${activeTab === 'openloop' ? 'active' : ''}`}
          onClick={() => setActiveTab('openloop')}
        >
          Open-Loop Response
        </button>
        <button
          type="button"
          className={`sim404-view-tab ${activeTab === 'closedloop' ? 'active' : ''}`}
          onClick={() => setActiveTab('closedloop')}
        >
          Closed-Loop Response & PID Design
        </button>
      </div>

      {/* Content based on Tab */}
      {activeTab === 'tf' && (
        <div className="sim404-tf-forms-container">
          {/* Laplace Form */}
          <div className="sim404-form-card">
            <h4 className="form-card-title">1. Continuous Laplace Transfer Function G(s)</h4>
            <div className="form-math-box">
              <span className="math-label">G(s) =</span>
              <div className="math-fraction">
                <span className="math-num">
                  {tf.num
                    .map((c, i) => {
                      const p = tf.num.length - 1 - i;
                      if (c === 0 && tf.num.length > 1) return null;
                      return `${c >= 0 && i > 0 ? '+ ' : ''}${c}${p > 1 ? `s^${p}` : p === 1 ? 's' : ''} `;
                    })
                    .filter(Boolean)
                    .join(' ') || '0'}
                </span>
                <div className="math-bar"></div>
                <span className="math-den">
                  {tf.den
                    .map((c, i) => {
                      const p = tf.den.length - 1 - i;
                      if (c === 0 && tf.den.length > 1) return null;
                      return `${c >= 0 && i > 0 ? '+ ' : ''}${c}${p > 1 ? `s^${p}` : p === 1 ? 's' : ''} `;
                    })
                    .filter(Boolean)
                    .join(' ') || '1'}
                </span>
              </div>
            </div>
          </div>

          {/* State Space Form */}
          <div className="sim404-form-card">
            <h4 className="form-card-title">2. State-Space Representation (Controllable Canonical)</h4>
            <div className="ss-matrices-flex">
              <div className="ss-matrix-block">
                <span className="ss-mat-label">A =</span>
                <div className="matrix-bracket">
                  {ss.A.map((row, r) => (
                    <div key={r} className="matrix-row">
                      {row.map((val, c) => (
                        <span key={c} className="matrix-cell">
                          {val.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ss-matrix-block">
                <span className="ss-mat-label">B =</span>
                <div className="matrix-bracket">
                  {ss.B.map((val, r) => (
                    <div key={r} className="matrix-row">
                      <span className="matrix-cell">{val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ss-matrix-block">
                <span className="ss-mat-label">C =</span>
                <div className="matrix-bracket">
                  <div className="matrix-row">
                    {ss.C.map((val, c) => (
                      <span key={c} className="matrix-cell">
                        {val.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ss-matrix-block">
                <span className="ss-mat-label">D =</span>
                <span className="matrix-cell-single">{ss.D.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Zero-Pole-Gain Form */}
          <div className="sim404-form-card">
            <h4 className="form-card-title">3. Pole-Zero-Gain (ZPK) Form</h4>
            <div className="zpk-row">
              <div className="zpk-box">
                <span className="zpk-header">Poles (Roots of Denominator):</span>
                <ul className="zpk-list">
                  {poles.map((p, i) => (
                    <li key={i}>
                      p<sub>{i + 1}</sub> = {p.re.toFixed(3)}
                      {p.im !== 0 ? ` ${p.im >= 0 ? '+' : '-'} j${Math.abs(p.im).toFixed(3)}` : ''}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="zpk-box">
                <span className="zpk-header">Zeros (Roots of Numerator):</span>
                <ul className="zpk-list">
                  {zeros.length === 0 ? (
                    <li className="empty-sub">No finite zeros</li>
                  ) : (
                    zeros.map((z, i) => (
                      <li key={i}>
                        z<sub>{i + 1}</sub> = {z.re.toFixed(3)}
                        {z.im !== 0 ? ` ${z.im >= 0 ? '+' : '-'} j${Math.abs(z.im).toFixed(3)}` : ''}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Discrete Transfer Function */}
          <div className="sim404-form-card">
            <h4 className="form-card-title">
              4. Discrete Transfer Function G(z) [Ts = {samplingTimeTs} s]
            </h4>
            <div className="form-math-box">
              <span className="math-label">G(z) &approx;</span>
              <div className="math-fraction">
                <span className="math-num">{discreteTf.numStr}</span>
                <div className="math-bar"></div>
                <span className="math-den">{discreteTf.denStr}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open-Loop Response Tab */}
      {activeTab === 'openloop' && (
        <div className="sim404-plot-panel">
          <div className="sim404-plot-controls">
            {(['step', 'pzmap', 'bode', 'nyquist', 'rootlocus'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`sim404-plot-btn ${openLoopPlotType === type ? 'active' : ''}`}
                onClick={() => setOpenLoopPlotType(type)}
              >
                {type === 'step' && 'Step Response'}
                {type === 'pzmap' && 'Pole-Zero Map'}
                {type === 'bode' && 'Bode Plot'}
                {type === 'nyquist' && 'Nyquist Plot'}
                {type === 'rootlocus' && 'Root Locus'}
              </button>
            ))}

            {openLoopPlotType === 'bode' && (
              <div className="sim404-margins-badge">
                <span>GM: <strong>{bode.gainMarginDb.toFixed(1)} dB</strong></span>
                <span>PM: <strong>{bode.phaseMargin.toFixed(1)}&deg;</strong></span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} width={820} height={360} className="sim404-canvas" />
        </div>
      )}

      {/* Closed-Loop Response Tab */}
      {activeTab === 'closedloop' && (
        <div className="sim404-plot-panel">
          <div className="sim404-cl-metrics-row">
            <div className="cl-metric-item">
              <span className="cl-m-title">Rise Time (tr)</span>
              <span className="cl-m-val">{metrics.riseTime.toFixed(2)} s</span>
            </div>
            <div className="cl-metric-item">
              <span className="cl-m-title">Peak Time (tp)</span>
              <span className="cl-m-val">{metrics.tPeak.toFixed(2)} s</span>
            </div>
            <div className="cl-metric-item highlight">
              <span className="cl-m-title">Overshoot (Mp)</span>
              <span className="cl-m-val">{metrics.overshootPct.toFixed(1)}%</span>
            </div>
            <div className="cl-metric-item">
              <span className="cl-m-title">Settling Time (ts)</span>
              <span className="cl-m-val">{metrics.tSettle.toFixed(2)} s</span>
            </div>
            <div className="cl-metric-item">
              <span className="cl-m-title">Steady State Err</span>
              <span className="cl-m-val">{metrics.ess.toFixed(3)}</span>
            </div>
          </div>

          <canvas ref={canvasRef} width={820} height={330} className="sim404-canvas" />
        </div>
      )}
    </div>
  );
};

// Canvas drawing helpers
function drawStepResponse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: { time: number[]; output: number[] },
  title: string,
  color: string
) {
  const padL = 50;
  const padR = 25;
  const padT = 30;
  const padB = 35;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxT = data.time[data.time.length - 1] || 25;
  const yVals = data.output;
  const minY = Math.min(0, ...yVals);
  const maxY = Math.max(1.5, Math.max(...yVals) * 1.15);

  const xToPix = (t: number) => padL + (t / maxT) * plotW;
  const yToPix = (y: number) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH;

  // Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let t = 0; t <= maxT; t += 5) {
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

  // Setpoint line y = 1
  const ySp = yToPix(1);
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padL, ySp);
  ctx.lineTo(padL + plotW, ySp);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText('SP = 1.0', padL + plotW - 40, ySp - 4);

  // Curve
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < data.time.length; i++) {
    const x = xToPix(data.time[i]);
    const y = yToPix(data.output[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, padL + 10, padT - 10);
}

function drawPzMap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  poles: Complex[],
  zeros: Complex[]
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = 35; // pix per unit

  // Axes
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, cy);
  ctx.lineTo(w - 30, cy); // Real axis (sigma)
  ctx.moveTo(cx, 20);
  ctx.lineTo(cx, h - 20); // Imag axis (j*omega)
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Real Axis (σ)', w - 35, cy - 8);
  ctx.textAlign = 'center';
  ctx.fillText('Imag Axis (jω)', cx, 15);

  // Poles (X)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  poles.forEach((p) => {
    const x = cx + p.re * scale;
    const y = cy - p.im * scale;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x - 6, y + 6);
    ctx.stroke();
  });

  // Zeros (O)
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.5;
  zeros.forEach((z) => {
    const x = cx + z.re * scale;
    const y = cy - z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.stroke();
  });
}

function drawBodePlot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bode: ReturnType<typeof computeBodeData>
) {
  const padL = 50;
  const padR = 25;
  const hHalf = (h - 60) / 2;

  // Upper: Mag (dB)
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.fillText('Magnitude (dB)', padL + 10, 20);

  const xToPix = (i: number) => padL + (i / bode.wList.length) * (w - padL - padR);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bode.magList.length; i++) {
    const x = xToPix(i);
    const y = 30 + hHalf / 2 - (bode.magList[i] / 60) * (hHalf / 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 0 dB Line
  const y0 = 30 + hHalf / 2;
  ctx.strokeStyle = '#475569';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(padL, y0);
  ctx.lineTo(w - padR, y0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Lower: Phase (deg)
  const topPhase = 45 + hHalf;
  ctx.fillText('Phase (deg)', padL + 10, topPhase - 5);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bode.phaseList.length; i++) {
    const x = xToPix(i);
    const y = topPhase + hHalf / 2 - ((bode.phaseList[i] + 90) / 180) * (hHalf / 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawNyquistPlot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bode: ReturnType<typeof computeBodeData>
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = 50;

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, cy);
  ctx.lineTo(w - 30, cy);
  ctx.moveTo(cx, 20);
  ctx.lineTo(cx, h - 20);
  ctx.stroke();

  // Critical Point (-1, j0)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx - 1 * scale, cy, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillText('(-1, j0)', cx - 1 * scale - 15, cy - 8);

  // Nyquist Locus
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bode.realList.length; i++) {
    const x = cx + bode.realList[i] * scale;
    const y = cy - bode.imagList[i] * scale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawRootLocus(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  poles: Complex[],
  zeros: Complex[]
) {
  drawPzMap(ctx, w, h, poles, zeros);
  // Root locus branches
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const cx = w / 2;
  const cy = h / 2;
  const scale = 35;
  poles.forEach((p) => {
    ctx.moveTo(cx + p.re * scale, cy - p.im * scale);
    ctx.lineTo(30, cy - p.im * scale);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}
