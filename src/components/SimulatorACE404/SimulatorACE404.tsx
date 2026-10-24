import React, { useState } from 'react';
import { SimACE404Header } from './SimACE404Header';
import { SimACE404TfInputs, PRESET_SYSTEMS } from './SimACE404TfInputs';
import { SimACE404AnalysisView } from './SimACE404AnalysisView';
import type { TransferFunction } from '../../utils/controlMath';
import './SimulatorACE404.css';

interface SimulatorACE404Props {
  onHome: () => void;
}

export const SimulatorACE404: React.FC<SimulatorACE404Props> = ({ onHome }) => {
  const [tf, setTf] = useState<TransferFunction>(PRESET_SYSTEMS[0].tf);
  const [feedbackH, setFeedbackH] = useState<number>(1.0);
  const [pidMode, setPidMode] = useState<'p' | 'pi' | 'pd' | 'pid'>('pid');
  const [pidTopology, setPidTopology] = useState<'parallel' | 'series'>('parallel');
  const [kc, setKc] = useState<number>(2.5);
  const [ti, setTi] = useState<number>(4.0);
  const [td, setTd] = useState<number>(0.8);
  const [samplingTimeTs, setSamplingTimeTs] = useState<number>(0.1);

  return (
    <div className="sim404-container">
      {/* Header */}
      <SimACE404Header onHome={onHome} activeView="Model Analysis & PID Design" />

      {/* Main Dual-Column Content */}
      <div className="sim404-main-layout">
        {/* Left Column: Transfer Function Polynomials & Controller Inputs */}
        <div className="sim404-left-panel">
          <SimACE404TfInputs
            tf={tf}
            onTfChange={setTf}
            feedbackH={feedbackH}
            onFeedbackHChange={setFeedbackH}
            pidMode={pidMode}
            onPidModeChange={setPidMode}
            pidTopology={pidTopology}
            onPidTopologyChange={setPidTopology}
            kc={kc}
            onKcChange={setKc}
            ti={ti}
            onTiChange={setTi}
            td={td}
            onTdChange={setTd}
            samplingTimeTs={samplingTimeTs}
            onSamplingTimeChange={setSamplingTimeTs}
          />
        </div>

        {/* Right Column: Interactive Visualizations (TF Forms, Open-Loop, Closed-Loop) */}
        <div className="sim404-right-panel">
          <SimACE404AnalysisView
            tf={tf}
            feedbackH={feedbackH}
            pidMode={pidMode}
            pidTopology={pidTopology}
            kc={kc}
            ti={ti}
            td={td}
            samplingTimeTs={samplingTimeTs}
          />
        </div>
      </div>
    </div>
  );
};
