/**
 * controlMath.ts
 * High-precision classical and modern control system mathematics library
 * for Prosoft V2 (ACE 400 series simulators).
 */

export interface TransferFunction {
  num: number[]; // descending powers: [b_m, ..., b_1, b_0]
  den: number[]; // descending powers: [a_n, ..., a_1, a_0]
}

export interface StateSpace {
  A: number[][];
  B: number[];
  C: number[];
  D: number;
}

export interface Complex {
  re: number;
  im: number;
}

/** Evaluate polynomial at complex s: P(s) = sum(c_k * s^(n-k)) */
export function evalPolyComplex(coeffs: number[], s: Complex): Complex {
  let res: Complex = { re: 0, im: 0 };
  const n = coeffs.length - 1;
  for (let i = 0; i < coeffs.length; i++) {
    const power = n - i;
    const term = powComplex(s, power);
    res = {
      re: res.re + coeffs[i] * term.re,
      im: res.im + coeffs[i] * term.im,
    };
  }
  return res;
}

export function powComplex(s: Complex, p: number): Complex {
  if (p === 0) return { re: 1, im: 0 };
  const r = Math.sqrt(s.re * s.re + s.im * s.im);
  const theta = Math.atan2(s.im, s.re);
  const rp = Math.pow(r, p);
  return {
    re: rp * Math.cos(p * theta),
    im: rp * Math.sin(p * theta),
  };
}

export function divComplex(num: Complex, den: Complex): Complex {
  const d2 = den.re * den.re + den.im * den.im;
  if (d2 === 0) return { re: 1e9, im: 0 };
  return {
    re: (num.re * den.re + num.im * den.im) / d2,
    im: (num.im * den.re - num.re * den.im) / d2,
  };
}

/** Evaluate frequency response G(j*omega) */
export function evalFreqResponse(tf: TransferFunction, omega: number): { mag: number; magDb: number; phaseDeg: number; real: number; imag: number } {
  const s: Complex = { re: 0, im: omega };
  const numVal = evalPolyComplex(tf.num, s);
  const denVal = evalPolyComplex(tf.den, s);
  const g = divComplex(numVal, denVal);

  const mag = Math.sqrt(g.re * g.re + g.im * g.im);
  const magDb = 20 * Math.log10(Math.max(1e-9, mag));
  let phaseDeg = (Math.atan2(g.im, g.re) * 180) / Math.PI;

  return { mag, magDb, phaseDeg, real: g.re, imag: g.im };
}

/** Find roots of polynomial up to 4th order using numeric companion matrix QR */
export function findRoots(poly: number[]): Complex[] {
  // Trim leading zeros
  let p = [...poly];
  while (p.length > 0 && Math.abs(p[0]) < 1e-12) {
    p.shift();
  }
  if (p.length <= 1) return [];

  // Normalize by leading coefficient
  const lead = p[0];
  const a = p.slice(1).map((c) => c / lead);
  const n = a.length;

  if (n === 1) {
    // a0*s + a1 = 0 => s = -a1/a0
    return [{ re: -a[0], im: 0 }];
  }

  if (n === 2) {
    // s^2 + a0*s + a1 = 0
    const b = a[0];
    const c = a[1];
    const disc = b * b - 4 * c;
    if (disc >= 0) {
      return [
        { re: (-b + Math.sqrt(disc)) / 2, im: 0 },
        { re: (-b - Math.sqrt(disc)) / 2, im: 0 },
      ];
    } else {
      return [
        { re: -b / 2, im: Math.sqrt(-disc) / 2 },
        { re: -b / 2, im: -Math.sqrt(-disc) / 2 },
      ];
    }
  }

  // General companion matrix eigenvalue method via Durand-Kerner iteration
  const roots: Complex[] = [];
  const radius = 1 + Math.max(...a.map((x) => Math.abs(x)));
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n + 0.35;
    roots.push({
      re: radius * Math.cos(angle) * 0.7,
      im: radius * Math.sin(angle) * 0.7,
    });
  }

  // Iterate 40 passes
  for (let iter = 0; iter < 45; iter++) {
    for (let i = 0; i < n; i++) {
      let pVal = { re: 1, im: 0 };
      pVal = powComplex(roots[i], n);
      for (let j = 0; j < n; j++) {
        const term = powComplex(roots[i], n - 1 - j);
        pVal.re += a[j] * term.re;
        pVal.im += a[j] * term.im;
      }

      let denom = { re: 1, im: 0 };
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const diff = { re: roots[i].re - roots[j].re, im: roots[i].im - roots[j].im };
          denom = {
            re: denom.re * diff.re - denom.im * diff.im,
            im: denom.re * diff.im + denom.im * diff.re,
          };
        }
      }

      const delta = divComplex(pVal, denom);
      roots[i] = {
        re: roots[i].re - delta.re,
        im: roots[i].im - delta.im,
      };
    }
  }

  // Clean near-zero imaginary parts
  return roots.map((r) => ({
    re: Math.abs(r.re) < 1e-6 ? 0 : Math.round(r.re * 1000) / 1000,
    im: Math.abs(r.im) < 1e-6 ? 0 : Math.round(r.im * 1000) / 1000,
  }));
}

/** Convert SISO Transfer Function to Controllable Canonical State-Space Form */
export function tfToStateSpace(tf: TransferFunction): StateSpace {
  let num = [...tf.num];
  let den = [...tf.den];

  // Trim leading zeros
  while (num.length > 0 && Math.abs(num[0]) < 1e-12) num.shift();
  while (den.length > 0 && Math.abs(den[0]) < 1e-12) den.shift();

  if (den.length === 0) den = [1];
  if (num.length === 0) num = [0];

  const lead = den[0];
  const aNorm = den.map((c) => c / lead);
  const n = aNorm.length - 1; // system order

  // Pad num with leading zeros up to order n+1
  while (num.length < n + 1) {
    num.unshift(0);
  }
  const bNorm = num.map((c) => c / lead);

  const D = bNorm[0];
  const beta = bNorm.slice(1).map((b_i, idx) => b_i - D * aNorm[idx + 1]);

  // Controllable Canonical Form
  // A matrix size n x n
  const A: number[][] = [];
  for (let i = 0; i < n; i++) {
    A[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === n - 1) {
        // Bottom row has coefficients -a_n, -a_{n-1}, ...
        A[i][j] = -aNorm[n - j];
      } else if (j === i + 1) {
        A[i][j] = 1;
      } else {
        A[i][j] = 0;
      }
    }
  }

  // B vector size n
  const B: number[] = new Array(n).fill(0);
  if (n > 0) B[n - 1] = 1;

  // C vector size n
  const C: number[] = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    C[j] = beta[n - 1 - j];
  }

  return { A, B, C, D };
}

/** Simulate Continuous Step Response using RK4 */
export function simulateStepResponse(
  tf: TransferFunction,
  tMax: number = 20,
  points: number = 200
): { time: number[]; output: number[] } {
  const ss = tfToStateSpace(tf);
  const n = ss.A.length;

  if (n === 0) {
    const time = [0, tMax];
    const output = [ss.D, ss.D];
    return { time, output };
  }

  const dt = tMax / points;
  let x = new Array(n).fill(0);

  const time: number[] = [];
  const output: number[] = [];

  const f = (state: number[], u: number): number[] => {
    const dxdt: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += ss.A[i][j] * state[j];
      }
      dxdt[i] = sum + ss.B[i] * u;
    }
    return dxdt;
  };

  for (let step = 0; step <= points; step++) {
    const t = step * dt;
    time.push(Math.round(t * 100) / 100);

    // Compute y = C*x + D*u (u = 1 for t >= 0)
    let y = ss.D * 1;
    for (let i = 0; i < n; i++) {
      y += ss.C[i] * x[i];
    }
    output.push(y);

    // RK4 integration
    const u = 1;
    const k1 = f(x, u);
    const x_k2 = x.map((xi, i) => xi + 0.5 * dt * k1[i]);
    const k2 = f(x_k2, u);
    const x_k3 = x.map((xi, i) => xi + 0.5 * dt * k2[i]);
    const k3 = f(x_k3, u);
    const x_k4 = x.map((xi, i) => xi + dt * k3[i]);
    const k4 = f(x_k4, u);

    x = x.map((xi, i) => xi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  return { time, output };
}

/** Compute Bode Analysis Points and Margins */
export function computeBodeData(
  tf: TransferFunction,
  wMin: number = 0.01,
  wMax: number = 100,
  points: number = 120
) {
  const decMin = Math.log10(wMin);
  const decMax = Math.log10(wMax);
  const step = (decMax - decMin) / points;

  const wList: number[] = [];
  const magList: number[] = [];
  const phaseList: number[] = [];
  const realList: number[] = [];
  const imagList: number[] = [];

  let gainCrossoverW: number | null = null;
  let phaseCrossoverW: number | null = null;
  let prevMagDb = 0;
  let prevPhase = 0;

  for (let i = 0; i <= points; i++) {
    const w = Math.pow(10, decMin + i * step);
    const res = evalFreqResponse(tf, w);

    wList.push(w);
    magList.push(res.magDb);
    phaseList.push(res.phaseDeg);
    realList.push(res.real);
    imagList.push(res.imag);

    // Gain crossover: 0 dB
    if (i > 0 && prevMagDb >= 0 && res.magDb < 0 && gainCrossoverW === null) {
      gainCrossoverW = w;
    }
    // Phase crossover: -180 deg
    if (i > 0 && prevPhase >= -180 && res.phaseDeg < -180 && phaseCrossoverW === null) {
      phaseCrossoverW = w;
    }

    prevMagDb = res.magDb;
    prevPhase = res.phaseDeg;
  }

  let phaseMargin = 180;
  if (gainCrossoverW !== null) {
    const resAtGc = evalFreqResponse(tf, gainCrossoverW);
    phaseMargin = 180 + resAtGc.phaseDeg;
  }

  let gainMarginDb = 999;
  if (phaseCrossoverW !== null) {
    const resAtPc = evalFreqResponse(tf, phaseCrossoverW);
    gainMarginDb = -resAtPc.magDb;
  }

  return {
    wList,
    magList,
    phaseList,
    realList,
    imagList,
    gainMarginDb: gainMarginDb > 100 ? 999 : gainMarginDb,
    phaseMargin: Math.abs(phaseMargin) > 180 ? 180 : phaseMargin,
    gainCrossoverW,
    phaseCrossoverW,
  };
}
