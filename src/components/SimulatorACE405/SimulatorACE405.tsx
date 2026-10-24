import React, { useState, useMemo } from 'react';
import { SimACE405Header } from './SimACE405Header';
import { SimACE405Inputs, type TuningResult } from './SimACE405Inputs';
import { SimACE405Comparison } from './SimACE405Comparison';
import type { TransferFunction } from '../../utils/controlMath';
import './SimulatorACE405.css';

interface SimulatorACE405Props {
  onHome: () => void;
}

export const SimulatorACE405: React.FC<SimulatorACE405Props> = ({ onHome }) => {
  const [family, setFamily] = useState<'ultimate' | 'reaction'>('reaction');
  const [algorithm, setAlgorithm] = useState<string>('zn_open');

  // Ultimate Gain Inputs
  const [ku, setKu] = useState<number>(3.5);
  const [pu, setPu] = useState<number>(6.0);

  // Process Reaction Inputs
  const [gainK, setGainK] = useState<number>(1.5);
  const [tau, setTau] = useState<number>(8.0);
  const [theta, setTheta] = useState<number>(2.0);

  // Derive Plant Transfer Function for simulation
  const plantTf = useMemo<TransferFunction>(() => {
    if (family === 'reaction') {
      // FOPDT with 1st-order Pade approximation for delay e^(-theta*s) ~ (1 - 0.5*theta*s)/(1 + 0.5*theta*s)
      const halfTh = 0.5 * theta;
      const num = [-gainK * halfTh, gainK];
      const den = [tau * halfTh, tau + halfTh, 1];
      return { num, den };
    } else {
      // 3rd order plant that has exact Ku, Pu: G(s) = K0 / (s + 1)^3
      return { num: [1], den: [1, 3, 3, 1] };
    }
  }, [family, gainK, tau, theta]);

  // Compute Tuning Formulas
  const tuningResults = useMemo<TuningResult>(() => {
    if (family === 'ultimate') {
      if (algorithm === 'tyreus_luyben') {
        const pi_kc = ku / 3.2;
        const pid_kc = ku / 2.2;
        return {
          p: { kc: 0.5 * ku, pb: 200 / ku, ti: 999999, td: 0 },
          pi: { kc: pi_kc, pb: 100 / pi_kc, ti: 2.2 * pu, td: 0 },
          pd: { kc: 0.5 * ku, pb: 200 / ku, ti: 999999, td: 0.1 * pu },
          pid: { kc: pid_kc, pb: 100 / pid_kc, ti: 2.2 * pu, td: pu / 6.3 },
        };
      } else {
        // ZN Closed Loop
        const p_kc = 0.5 * ku;
        const pi_kc = 0.45 * ku;
        const pid_kc = 0.6 * ku;
        return {
          p: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0 },
          pi: { kc: pi_kc, pb: 100 / pi_kc, ti: pu / 1.2, td: 0 },
          pd: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: pu / 8 },
          pid: { kc: pid_kc, pb: 100 / pid_kc, ti: pu / 2, td: pu / 8 },
        };
      }
    } else {
      // Process Reaction Methods
      const r = theta / tau;
      const k0 = (1 / gainK) * (tau / theta);

      if (algorithm === 'cohen_coon') {
        const p_kc = k0 * (1 + r / 3);
        const pi_kc = k0 * (0.9 + r / 12);
        const pi_ti = theta * ((30 + 3 * r) / (9 + 20 * r));
        const pd_kc = k0 * (1.25 + r / 6);
        const pd_td = theta * ((6 - 2 * r) / (22 + 3 * r));
        const pid_kc = k0 * (4 / 3 + r / 4);
        const pid_ti = theta * ((32 + 6 * r) / (13 + 8 * r));
        const pid_td = theta * (4 / (11 + 2 * r));

        return {
          p: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0 },
          pi: { kc: pi_kc, pb: 100 / pi_kc, ti: pi_ti, td: 0 },
          pd: { kc: pd_kc, pb: 100 / pd_kc, ti: 999999, td: Math.max(0.01, pd_td) },
          pid: { kc: pid_kc, pb: 100 / pid_kc, ti: pid_ti, td: Math.max(0.01, pid_td) },
        };
      } else if (algorithm === 'chr_0') {
        // CHR 0% Overshoot
        const p_kc = 0.3 * k0;
        const pi_kc = 0.35 * k0;
        const pid_kc = 0.6 * k0;
        return {
          p: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0 },
          pi: { kc: pi_kc, pb: 100 / pi_kc, ti: 1.2 * tau, td: 0 },
          pd: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0.5 * theta },
          pid: { kc: pid_kc, pb: 100 / pid_kc, ti: 1.0 * tau, td: 0.5 * theta },
        };
      } else if (algorithm === 'chr_20') {
        // CHR 20% Overshoot
        const p_kc = 0.7 * k0;
        const pi_kc = 0.6 * k0;
        const pid_kc = 0.95 * k0;
        return {
          p: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0 },
          pi: { kc: pi_kc, pb: 100 / pi_kc, ti: 1.0 * tau, td: 0 },
          pd: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0.47 * theta },
          pid: { kc: pid_kc, pb: 100 / pid_kc, ti: 1.35 * tau, td: 0.47 * theta },
        };
      } else {
        // ZN Open Loop
        const p_kc = k0;
        const pi_kc = 0.9 * k0;
        const pid_kc = 1.2 * k0;
        return {
          p: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0 },
          pi: { kc: pi_kc, pb: 100 / pi_kc, ti: 3.33 * theta, td: 0 },
          pd: { kc: p_kc, pb: 100 / p_kc, ti: 999999, td: 0.5 * theta },
          pid: { kc: pid_kc, pb: 100 / pid_kc, ti: 2.0 * theta, td: 0.5 * theta },
        };
      }
    }
  }, [family, algorithm, ku, pu, gainK, tau, theta]);

  const algorithmDisplayNames: Record<string, string> = {
    zn_closed: 'Ziegler-Nichols (Closed-Loop)',
    tyreus_luyben: 'Tyreus-Luyben',
    zn_open: 'Ziegler-Nichols (Open-Loop)',
    cohen_coon: 'Cohen-Coon',
    chr_0: 'CHR (0% Overshoot)',
    chr_20: 'CHR (20% Overshoot)',
  };

  return (
    <div className="sim405-container">
      {/* Header */}
      <SimACE405Header onHome={onHome} tuningFamily={family} />

      {/* Main Dual-Column Content */}
      <div className="sim405-main-layout">
        {/* Left Column: Family Selector, Inputs & Computed Table */}
        <div className="sim405-left-panel">
          <SimACE405Inputs
            family={family}
            onFamilyChange={setFamily}
            ku={ku}
            onKuChange={setKu}
            pu={pu}
            onPuChange={setPu}
            gainK={gainK}
            onGainKChange={setGainK}
            tau={tau}
            onTauChange={setTau}
            theta={theta}
            onThetaChange={setTheta}
            algorithm={algorithm}
            onAlgorithmChange={setAlgorithm}
            tuningResults={tuningResults}
          />
        </div>

        {/* Right Column: Comparative Step Response & Metrics */}
        <div className="sim405-right-panel">
          <SimACE405Comparison
            plantTf={plantTf}
            tuningResults={tuningResults}
            algorithmName={algorithmDisplayNames[algorithm] || algorithm}
          />
        </div>
      </div>
    </div>
  );
};
