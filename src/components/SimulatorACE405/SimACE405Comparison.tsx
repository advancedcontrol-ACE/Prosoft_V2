import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { TuningResult } from './SimACE405Inputs';
import { simulateStepResponse, type TransferFunction } from '../../utils/controlMath';
import './SimACE405Comparison.css';

interface SimACE405ComparisonProps {
  plantTf: TransferFunction;
  tuningResults: TuningResult;
  algorithmName: string;
}

export const SimACE405Comparison: React.FC<SimACE405ComparisonProps> = ({
  plantTf,
  tuningResults,
  algorithmName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showP, setShowP] = useState<boolean>(true);
  const [showPI, setShowPI] = useState<boolean>(true);
  const [showPID, setShowPID] = useState<boolean>(true);

  // Helper to build closed loop TF from PID parameters
  const buildClosedLoopTf = (kc: number, ti: number, td: number): TransferFunction => {
    let cNum: number[] = [kc];
    let cDen: number[] = [1];

    if (ti > 1000 && td === 0) {
      // P mode
      cNum = [kc];
      cDen = [1];
    } else if (td === 0) {
      // PI mode
      cNum = [kc * ti, kc];
      cDen = [ti, 0];
    } else if (ti > 1000) {
      // PD mode
      cNum = [kc * td, kc];
      cDen = [0.1 * td, 1];
    } else {
      // PID mode
      cNum = [kc * ti * td, kc * ti, kc];
      cDen = [ti * 0.1 * td, ti, 0];
    }

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

    const forwardNum = mul(cNum, plantTf.num);
    const forwardDen = mul(cDen, plantTf.den);
    const clDen = add(forwardDen, forwardNum);

    return { num: forwardNum, den: clDen };
  };

  const clP = useMemo(
    () => buildClosedLoopTf(tuningResults.p.kc, tuningResults.p.ti, tuningResults.p.td),
    [plantTf, tuningResults.p]
  );
  const clPI = useMemo(
    () => buildClosedLoopTf(tuningResults.pi.kc, tuningResults.pi.ti, tuningResults.pi.td),
    [plantTf, tuningResults.pi]
  );
  const clPID = useMemo(
    () => buildClosedLoopTf(tuningResults.pid.kc, tuningResults.pid.ti, tuningResults.pid.td),
    [plantTf, tuningResults.pid]
  );

  const stepP = useMemo(() => simulateStepResponse(clP, 25, 120), [clP]);
  const stepPI = useMemo(() => simulateStepResponse(clPI, 25, 120), [clPI]);
  const stepPID = useMemo(() => simulateStepResponse(clPID, 25, 120), [clPID]);

  // Compute metrics for each mode
  const calcMetrics = (data: { time: number[]; output: number[] }) => {
    const y = data.output;
    const t = data.time;
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

    let tSettle = t[t.length - 1];
    for (let i = y.length - 1; i >= 0; i--) {
      if (Math.abs(y[i] - yFinal) > Math.abs(yFinal) * 0.02) {
        tSettle = t[i];
        break;
      }
    }

    return { yFinal, yMax, overshootPct, riseTime, tPeak, tSettle, ess };
  };

  const metricsP = useMemo(() => calcMetrics(stepP), [stepP]);
  const metricsPI = useMemo(() => calcMetrics(stepPI), [stepPI]);
  const metricsPID = useMemo(() => calcMetrics(stepPID), [stepPID]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const padL = 50;
    const padR = 25;
    const padT = 30;
    const padB = 35;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxT = 25;
    let allY: number[] = [0, 1.2];
    if (showP) allY.push(...stepP.output);
    if (showPI) allY.push(...stepPI.output);
    if (showPID) allY.push(...stepPID.output);

    const minY = Math.min(0, ...allY);
    const maxY = Math.max(1.4, Math.max(...allY) * 1.15);

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

    // Setpoint Line y = 1.0
    const ySp = yToPix(1.0);
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, ySp);
    ctx.lineTo(padL + plotW, ySp);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('SP = 1.0', padL + plotW - 40, ySp - 4);

    // Plot P
    if (showP) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < stepP.time.length; i++) {
        const x = xToPix(stepP.time[i]);
        const y = yToPix(stepP.output[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Plot PI
    if (showPI) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < stepPI.time.length; i++) {
        const x = xToPix(stepPI.time[i]);
        const y = yToPix(stepPI.output[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Plot PID
    if (showPID) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < stepPID.time.length; i++) {
        const x = xToPix(stepPID.time[i]);
        const y = yToPix(stepPID.output[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [showP, showPI, showPID, stepP, stepPI, stepPID]);

  return (
    <div className="sim405-comp-container">
      {/* Upper Half: Comparative Plot */}
      <div className="sim405-chart-box">
        <div className="sim405-chart-header">
          <span className="sim405-chart-title">
            Comparative Closed-Loop Step Response ({algorithmName})
          </span>
          <div className="sim405-legend-toggles">
            <label className="toggle-label orange">
              <input
                type="checkbox"
                checked={showP}
                onChange={(e) => setShowP(e.target.checked)}
              />
              P Mode
            </label>
            <label className="toggle-label green">
              <input
                type="checkbox"
                checked={showPI}
                onChange={(e) => setShowPI(e.target.checked)}
              />
              PI Mode
            </label>
            <label className="toggle-label cyan">
              <input
                type="checkbox"
                checked={showPID}
                onChange={(e) => setShowPID(e.target.checked)}
              />
              PID Mode
            </label>
          </div>
        </div>

        <canvas ref={canvasRef} width={820} height={290} className="sim405-comp-canvas" />
      </div>

      {/* Lower Half: Performance Metrics Comparison Table */}
      <div className="sim405-metrics-card">
        <h4 className="sim405-card-title">Comparative Performance Metrics</h4>
        <table className="sim405-metrics-table">
          <thead>
            <tr>
              <th>Performance Metric</th>
              <th className="th-p">P Mode</th>
              <th className="th-pi">PI Mode</th>
              <th className="th-pid">PID Mode</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="metric-name">Rise Time (tr)</td>
              <td>{metricsP.riseTime.toFixed(2)} s</td>
              <td>{metricsPI.riseTime.toFixed(2)} s</td>
              <td className="highlight-cell">{metricsPID.riseTime.toFixed(2)} s</td>
            </tr>
            <tr>
              <td className="metric-name">Peak Overshoot (Mp)</td>
              <td>{metricsP.overshootPct.toFixed(1)}%</td>
              <td>{metricsPI.overshootPct.toFixed(1)}%</td>
              <td className="highlight-cell">{metricsPID.overshootPct.toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="metric-name">Peak Time (tp)</td>
              <td>{metricsP.tPeak.toFixed(2)} s</td>
              <td>{metricsPI.tPeak.toFixed(2)} s</td>
              <td className="highlight-cell">{metricsPID.tPeak.toFixed(2)} s</td>
            </tr>
            <tr>
              <td className="metric-name">Settling Time (ts, 2%)</td>
              <td>{metricsP.tSettle.toFixed(2)} s</td>
              <td>{metricsPI.tSettle.toFixed(2)} s</td>
              <td className="highlight-cell">{metricsPID.tSettle.toFixed(2)} s</td>
            </tr>
            <tr>
              <td className="metric-name">Steady State Error (ess)</td>
              <td>{metricsP.ess.toFixed(3)}</td>
              <td>{metricsPI.ess.toFixed(3)}</td>
              <td className="highlight-cell">{metricsPID.ess.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
