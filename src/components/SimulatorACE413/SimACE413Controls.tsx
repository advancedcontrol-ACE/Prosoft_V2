import React, { useRef, useEffect, useMemo } from 'react';
import type { BlockDiagramModel } from './SimACE413Header';
import { simulateStepResponse, type TransferFunction } from '../../utils/controlMath';
import { SimACE401Slider } from '../SimulatorACE401/SimACE401Slider';
import './SimACE413Controls.css';

interface SimACE413ControlsProps {
  model: BlockDiagramModel;
  gainK: number;
  onGainKChange: (v: number) => void;
  tau1: number;
  onTau1Change: (v: number) => void;
  tau2: number;
  onTau2Change: (v: number) => void;
  theta: number;
  onThetaChange: (v: number) => void;
  kc: number;
  onKcChange: (v: number) => void;
  ti: number;
  onTiChange: (v: number) => void;
  td: number;
  onTdChange: (v: number) => void;
}

export const SimACE413Controls: React.FC<SimACE413ControlsProps> = ({
  model,
  gainK,
  onGainKChange,
  tau1,
  onTau1Change,
  tau2,
  onTau2Change,
  theta,
  onThetaChange,
  kc,
  onKcChange,
  ti,
  onTiChange,
  td,
  onTdChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute closed-loop transfer function based on topology
  const closedTf = useMemo<TransferFunction>(() => {
    // Controller numerator and denominator
    let cNum: number[] = [kc * ti * Math.max(0.01, td), kc * ti, kc];
    let cDen: number[] = [ti * 0.1, ti, 0];
    if (ti >= 1000) {
      cNum = [kc];
      cDen = [1];
    }

    // Plant TF
    let pNum: number[] = [gainK];
    let pDen: number[] = [tau1, 1];

    if (model === 'two-non-interacting') {
      pNum = [gainK];
      pDen = [tau1 * tau2, tau1 + tau2, 1];
    } else if (model === 'two-interacting') {
      // (R1 C1 R2 C2)s^2 + (R1 C1 + R2 C2 + R1 C2)s + 1
      pNum = [gainK];
      pDen = [tau1 * tau2, tau1 + tau2 + 0.5 * tau1, 1];
    } else if (model === 'three-interacting') {
      pNum = [gainK];
      pDen = [tau1 * tau2 * 5, (tau1 + tau2) * 4, 3 * tau1, 1];
    } else if (model === 'fopdt' || model === 'feedforward' || model === 'cascade' || model === 'smith') {
      // 1st order Pade delay for closed loop calculation
      const halfTh = 0.5 * theta;
      pNum = [-gainK * halfTh, gainK];
      pDen = [tau1 * halfTh, tau1 + halfTh, 1];
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

    const forwardNum = mul(cNum, pNum);
    const forwardDen = mul(cDen, pDen);
    const clDen = add(forwardDen, forwardNum);

    return { num: forwardNum, den: clDen };
  }, [model, gainK, tau1, tau2, theta, kc, ti, td]);

  const stepData = useMemo(() => simulateStepResponse(closedTf, 25, 120), [closedTf]);

  // Performance metrics
  const metrics = useMemo(() => {
    const y = stepData.output;
    const t = stepData.time;
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
  }, [stepData]);

  // Draw Step Response Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const padL = 45;
    const padR = 20;
    const padT = 25;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxT = 25;
    const minY = Math.min(0, ...stepData.output);
    const maxY = Math.max(1.4, Math.max(...stepData.output) * 1.15);

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
      ctx.fillText(`${t}s`, x, padT + plotH + 14);
    }

    // Setpoint Line y = 1.0
    const ySp = yToPix(1.0);
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, ySp);
    ctx.lineTo(padL + plotW, ySp);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('SP = 1.0', padL + plotW - 40, ySp - 4);

    // Step Curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < stepData.time.length; i++) {
      const x = xToPix(stepData.time[i]);
      const y = yToPix(stepData.output[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Closed-Loop Step Response y(t)', padL + 8, padT - 8);
  }, [stepData]);

  return (
    <div className="sim413-controls-grid">
      {/* Parameters Sliders Column */}
      <div className="sim413-card">
        <h4 className="sim413-card-title">Block Parameters & Controller Tuning</h4>
        <div className="sim413-sliders-row">
          <SimACE401Slider
            label="Controller Gain Kc"
            min={0.1}
            max={30}
            step={0.1}
            ticks={[0.1, 10, 20, 30]}
            value={kc}
            onChange={onKcChange}
          />
          <SimACE401Slider
            label="Integral Time Ti (s)"
            min={0.5}
            max={60}
            step={0.5}
            ticks={[0.5, 20, 40, 60]}
            value={ti}
            onChange={onTiChange}
          />
          <SimACE401Slider
            label="Derivative Time Td (s)"
            min={0}
            max={15}
            step={0.2}
            ticks={[0, 5, 10, 15]}
            value={td}
            onChange={onTdChange}
          />
          <SimACE401Slider
            label="Plant Gain K"
            min={0.1}
            max={5.0}
            step={0.1}
            ticks={[0.1, 1.5, 3.0, 5.0]}
            value={gainK}
            decimals={1}
            onChange={onGainKChange}
          />
          <SimACE401Slider
            label="Time Constant Tau 1 (s)"
            min={1}
            max={40}
            step={1}
            ticks={[1, 10, 25, 40]}
            value={tau1}
            onChange={onTau1Change}
          />
          <SimACE401Slider
            label="Time Constant Tau 2 (s)"
            min={1}
            max={40}
            step={1}
            ticks={[1, 10, 25, 40]}
            value={tau2}
            onChange={onTau2Change}
          />
          <SimACE401Slider
            label="Delay Theta (s)"
            min={0}
            max={15}
            step={0.5}
            ticks={[0, 5, 10, 15]}
            value={theta}
            onChange={onThetaChange}
          />
        </div>
      </div>

      {/* Response Simulation Column */}
      <div className="sim413-card">
        <div className="sim413-metrics-strip">
          <div className="metric-pill">
            <span className="p-title">Rise Time (tr)</span>
            <span className="p-val">{metrics.riseTime.toFixed(2)}s</span>
          </div>
          <div className="metric-pill">
            <span className="p-title">Overshoot (Mp)</span>
            <span className="p-val">{metrics.overshootPct.toFixed(1)}%</span>
          </div>
          <div className="metric-pill">
            <span className="p-title">Settling Time (ts)</span>
            <span className="p-val">{metrics.tSettle.toFixed(2)}s</span>
          </div>
          <div className="metric-pill">
            <span className="p-title">Steady Error (ess)</span>
            <span className="p-val">{metrics.ess.toFixed(3)}</span>
          </div>
        </div>

        <canvas ref={canvasRef} width={520} height={230} className="sim413-canvas" />
      </div>
    </div>
  );
};
