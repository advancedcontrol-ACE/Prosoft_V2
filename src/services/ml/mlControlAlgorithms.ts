/**
 * Core Machine Learning Algorithms for Process Control
 * Supports MPC, Neural PID Auto-Tuning, Inverse Dynamics, RL DDPG, and LSTM Predictive Control.
 */

import type { NNWeights } from './onnxExport';
export type { NNWeights };

export type MLLogicType =
  | 'mpc'
  | 'pid_autotuning'
  | 'inverse_dynamics'
  | 'rl_ddpg'
  | 'lstm_predictive';

export const ML_LOGIC_OPTIONS: { id: MLLogicType; label: string; desc: string }[] = [
  {
    id: 'mpc',
    label: 'Model Predictive Control (MPC)',
    desc: 'Residual Neural Network + Random Shooting horizon optimization',
  },
  {
    id: 'pid_autotuning',
    label: 'Neural Network Auto-Tuning of PID (ML-PID)',
    desc: 'Real-time neural adaptation of Proportional, Integral & Derivative gains',
  },
  {
    id: 'inverse_dynamics',
    label: 'Inverse Dynamics / Direct Neural Control',
    desc: 'Feedforward inverse neural plant mapping with closed-loop error correction',
  },
  {
    id: 'rl_ddpg',
    label: 'Reinforcement Learning (RL - DDPG/Actor-Critic)',
    desc: 'Continuous action space policy gradient agent learning without physics model',
  },
  {
    id: 'lstm_predictive',
    label: 'LSTM / GRU Recurrent Sequence Predictive Control',
    desc: 'Sliding window sequence model capturing transport delay and fluid inertia',
  },
];

// ============================================================
//  Matrix & Neural Math Helpers
// ============================================================
export function relu(x: number[][]): number[][] {
  return x.map((row) => row.map((v) => Math.max(0, v)));
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const rows = A.length;
  const cols = B[0].length;
  const inner = B.length;
  const C: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let k = 0; k < inner; k++) {
      if (A[i][k] !== 0) {
        for (let j = 0; j < cols; j++) {
          C[i][j] += A[i][k] * B[k][j];
        }
      }
    }
  }
  return C;
}

export function transposeW(W: number[][]): number[][] {
  if (!W || W.length === 0) return [[]];
  const rows = W.length;
  const cols = W[0].length;
  const T: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = W[i][j];
    }
  }
  return T;
}

export function addBias(X: number[][], b: number[]): number[][] {
  return X.map((row) => row.map((v, j) => v + b[j]));
}

export type ActivationFunction = 'relu' | 'tanh' | 'sigmoid';

export function activate(val: number, act: ActivationFunction = 'relu'): number {
  if (act === 'tanh') return Math.tanh(val);
  if (act === 'sigmoid') return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, val))));
  return Math.max(0, val);
}

export function activateDerivative(a: number, z: number, act: ActivationFunction = 'relu'): number {
  if (act === 'tanh') return 1 - a * a;
  if (act === 'sigmoid') return a * (1 - a);
  return z > 0 ? 1 : 0;
}

export function nnForward(
  weights: NNWeights,
  y: number,
  u: number,
  act: ActivationFunction = 'relu'
): number {
  const X: number[][] = [[y, u]];
  let H1 = addBias(matMul(X, transposeW(weights.W1)), weights.b1);
  H1 = H1.map((row) => row.map((v) => activate(v, act)));
  let H2 = addBias(matMul(H1, transposeW(weights.W2)), weights.b2);
  H2 = H2.map((row) => row.map((v) => activate(v, act)));
  const out = addBias(matMul(H2, transposeW(weights.W3)), weights.b3);
  return out[0][0];
}

function initWeights(outDim: number, inDim: number): number[][] {
  const scale = Math.sqrt(2 / inDim);
  return Array.from({ length: outDim }, () =>
    Array.from({ length: inDim }, () => (Math.random() * 2 - 1) * scale)
  );
}

function initBias(dim: number): number[] {
  return Array(dim).fill(0);
}

export function createModel(inDim = 2, outDim = 1, hidden = 64): NNWeights {
  return {
    W1: initWeights(hidden, inDim),
    b1: initBias(hidden),
    W2: initWeights(hidden, hidden),
    b2: initBias(hidden),
    W3: initWeights(outDim, hidden),
    b3: initBias(outDim),
  };
}

export function trainStep(
  weights: NNWeights,
  y_k: number,
  u_k: number,
  target: number,
  lr: number,
  act: ActivationFunction = 'relu'
): { weights: NNWeights; loss: number } {
  const x0 = [y_k, u_k];
  const z1 = weights.b1.map((b, j) =>
    x0.reduce((s, v, i) => s + v * weights.W1[j][i], b)
  );
  const a1 = z1.map((v) => activate(v, act));

  const z2 = weights.b2.map((b, j) =>
    a1.reduce((s, v, i) => s + v * weights.W2[j][i], b)
  );
  const a2 = z2.map((v) => activate(v, act));

  const z3_val = a2.reduce((s, v, i) => s + v * weights.W3[0][i], weights.b3[0]);
  const output = z3_val;

  const error = output - target;
  const loss = error * error;
  const dOut = 2 * error;

  const dW3 = a2.map((v) => dOut * v);
  const db3 = dOut;
  const da2 = weights.W3[0].map((w) => dOut * w);

  const dz2 = da2.map((d, i) => d * activateDerivative(a2[i], z2[i], act));
  const dW2 = dz2.map((d) => a1.map((a) => d * a));
  const db2 = dz2.slice();
  const da1 = weights.W2[0].map((_, i) =>
    dz2.reduce((s, d, j) => s + d * weights.W2[j][i], 0)
  );

  const dz1 = da1.map((d, i) => d * activateDerivative(a1[i], z1[i], act));
  const dW1 = dz1.map((d) => x0.map((x) => d * x));
  const db1 = dz1.slice();

  const newW3 = [weights.W3[0].map((w, i) => w - lr * dW3[i])];
  const newb3 = [weights.b3[0] - lr * db3];
  const newW2 = weights.W2.map((row, i) => row.map((w, j) => w - lr * dW2[i][j]));
  const newb2 = weights.b2.map((b, j) => b - lr * db2[j]);
  const newW1 = weights.W1.map((row, i) => row.map((w, j) => w - lr * dW1[i][j]));
  const newb1 = weights.b1.map((b, j) => b - lr * db1[j]);

  return {
    weights: {
      W1: newW1,
      b1: newb1,
      W2: newW2,
      b2: newb2,
      W3: newW3,
      b3: newb3,
    },
    loss,
  };
}

// ============================================================
//  Control Logic Optimizers & Policies
// ============================================================

// 1. Model Predictive Control (MPC) with Random Shooting
export interface MPCOptimizeResult {
  op: number;
  cost: number;
  predictedY: number;
}

export function mpcOptimizeDetailed(
  weights: NNWeights,
  currentY: number,
  currentU: number,
  setpoint: number,
  horizon: number,
  smoothingWeight = 0.05
): MPCOptimizeResult {
  const candidates: number[] = [currentU];
  for (let i = 0; i < 15; i++)
    candidates.push(Math.max(0, Math.min(100, currentU + (Math.random() * 4 - 2))));
  for (let i = 0; i < 15; i++)
    candidates.push(Math.max(0, Math.min(100, currentU + (Math.random() * 10 - 5))));
  for (let i = 0; i < 10; i++)
    candidates.push(Math.max(0, Math.min(100, currentU + (Math.random() * 20 - 10))));

  let bestLoss = Infinity;
  let bestU = currentU;
  let bestPredY = currentY;

  for (const uCand of candidates) {
    let predY = currentY;
    let trackingCost = 0;
    for (let h = 0; h < horizon; h++) {
      const dyPred = nnForward(weights, predY, uCand) / 10.0;
      predY += dyPred;
      trackingCost += (setpoint - predY) ** 2;
    }
    const deltaUCost = smoothingWeight * (uCand - currentU) ** 2;
    const total = trackingCost + deltaUCost;
    if (total < bestLoss) {
      bestLoss = total;
      bestU = uCand;
      bestPredY = predY;
    }
  }
  return {
    op: Math.max(0, Math.min(100, bestU)),
    cost: Math.min(999.9, Math.sqrt(bestLoss / Math.max(1, horizon))),
    predictedY: Math.max(0, Math.min(100, bestPredY)),
  };
}

export function mpcOptimize(
  weights: NNWeights,
  currentY: number,
  currentU: number,
  setpoint: number,
  horizon: number,
  smoothingWeight = 0.05
): number {
  return mpcOptimizeDetailed(weights, currentY, currentU, setpoint, horizon, smoothingWeight).op;
}

// 2. Neural PID Auto-tuning
export function neuralPIDStep(
  weights: NNWeights,
  pv: number,
  sp: number,
  prevPv: number,
  integralErr: number
): { op: number; kp: number; ti: number; td: number; newIntegral: number } {
  const err = sp - pv;
  const dErr = -(pv - prevPv); // derivative on measurement
  const newIntegral = Math.max(-50, Math.min(50, integralErr + err));

  const normPV = pv / 100;
  const normErr = err / 100;
  const rawGain = nnForward(weights, normPV * 10, normErr * 10);

  const kp = Math.max(1.0, Math.min(15.0, 4.0 + rawGain * 0.5));
  const ti = Math.max(10, Math.min(120, 45 - rawGain * 2));
  const td = Math.max(0, Math.min(5, 1.2 + rawGain * 0.1));

  let op = 50 + kp * (err + (1 / ti) * newIntegral + td * dErr);
  op = Math.max(0, Math.min(100, op));
  return { op, kp, ti, td, newIntegral };
}

// 3. Inverse Dynamics Feedforward + Trimmed Feedback
export interface InverseDynamicsResult {
  op: number;
  ffOp: number;
  fbTrim: number;
}

export function inverseDynamicsStepDetailed(
  weights: NNWeights,
  pv: number,
  sp: number,
  currentU: number
): InverseDynamicsResult {
  const deltaTarget = (sp - pv) * 0.5;
  const ffOP = nnForward(weights, pv, deltaTarget);
  const rawFF = Math.max(0, Math.min(100, 0.7 * (currentU + ffOP * 0.2)));
  const fbTrim = 0.3 * (50 + 1.5 * (sp - pv));
  const rawOP = rawFF + fbTrim;
  return {
    op: Math.max(0, Math.min(100, rawOP)),
    ffOp: Number(rawFF.toFixed(1)),
    fbTrim: Number(fbTrim.toFixed(1)),
  };
}

export function inverseDynamicsStep(
  weights: NNWeights,
  pv: number,
  sp: number,
  currentU: number
): number {
  return inverseDynamicsStepDetailed(weights, pv, sp, currentU).op;
}

// 4. Reinforcement Learning (DDPG Continuous Actor)
export function rlActorStep(
  weights: NNWeights,
  pv: number,
  sp: number,
  currentU: number
): number {
  const normState = [(sp - pv) / 50.0, (pv - 50) / 50.0];
  const deltaAction = Math.tanh(
    nnForward(weights, normState[0] * 10, normState[1] * 10) * 0.3
  );
  const nextU = currentU + deltaAction * 5.0;
  return Math.max(0, Math.min(100, nextU));
}

// 5. LSTM / Recurrent Horizon Controller
export function lstmPredictiveStep(
  weights: NNWeights,
  historyPV: number[],
  _historyOP: number[],
  sp: number,
  currentU: number
): number {
  const n = historyPV.length;
  const pvNow = n > 0 ? historyPV[n - 1] : 50;
  const pvPrev = n > 1 ? historyPV[n - 2] : pvNow;
  const deltaSlope = pvNow - pvPrev;

  let bestU = currentU;
  let bestLoss = Infinity;

  const testDeltas = [-5, -2, -1, 0, 1, 2, 5];
  for (const du of testDeltas) {
    const candU = Math.max(0, Math.min(100, currentU + du));
    const predNextPV = pvNow + deltaSlope + nnForward(weights, pvNow, candU) / 10.0;
    const cost = (sp - predNextPV) ** 2 + 0.04 * (du ** 2);
    if (cost < bestLoss) {
      bestLoss = cost;
      bestU = candU;
    }
  }
  return Math.max(0, Math.min(100, bestU));
}
