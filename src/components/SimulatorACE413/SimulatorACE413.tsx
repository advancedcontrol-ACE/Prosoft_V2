import React, { useState, useEffect } from 'react';
import { SimACE413Header, type BlockDiagramModel } from './SimACE413Header';
import { SimACE413Diagram } from './SimACE413Diagram';
import { SimACE413Controls } from './SimACE413Controls';
import './SimulatorACE413.css';

interface SimulatorACE413Props {
  initialModel?: BlockDiagramModel;
  onHome: () => void;
}

export const SimulatorACE413: React.FC<SimulatorACE413Props> = ({
  initialModel = 'fopdt',
  onHome,
}) => {
  const [model, setModel] = useState<BlockDiagramModel>(initialModel);

  // Sync if initialModel changes
  useEffect(() => {
    if (initialModel) {
      setModel(initialModel);
    }
  }, [initialModel]);

  // Parameters
  const [gainK, setGainK] = useState<number>(1.2);
  const [tau1, setTau1] = useState<number>(12);
  const [tau2, setTau2] = useState<number>(5);
  const [theta, setTheta] = useState<number>(2.5);
  const [kc, setKc] = useState<number>(2.5);
  const [ti, setTi] = useState<number>(12);
  const [td, setTd] = useState<number>(0.5);

  // Update defaults on model switch
  const handleModelChange = (newModel: BlockDiagramModel) => {
    setModel(newModel);
    switch (newModel) {
      case 'fopdt':
        setGainK(1.2);
        setTau1(12);
        setTau2(0);
        setTheta(2.5);
        setKc(2.5);
        setTi(12);
        setTd(0.5);
        break;
      case 'two-interacting':
        setGainK(1.0);
        setTau1(15);
        setTau2(8);
        setTheta(1.0);
        setKc(3.0);
        setTi(20);
        setTd(1.2);
        break;
      case 'three-interacting':
        setGainK(1.0);
        setTau1(10);
        setTau2(10);
        setTheta(1.0);
        setKc(2.2);
        setTi(25);
        setTd(1.5);
        break;
      case 'two-non-interacting':
        setGainK(1.5);
        setTau1(14);
        setTau2(7);
        setTheta(1.5);
        setKc(2.8);
        setTi(18);
        setTd(1.0);
        break;
      case 'cascade':
        setGainK(1.0);
        setTau1(15);
        setTau2(4);
        setTheta(0.5);
        setKc(4.5);
        setTi(15);
        setTd(0.8);
        break;
      case 'feedforward':
        setGainK(1.2);
        setTau1(16);
        setTau2(5);
        setTheta(2.0);
        setKc(3.2);
        setTi(14);
        setTd(0.5);
        break;
      case 'smith':
        setGainK(1.5);
        setTau1(12);
        setTau2(6);
        setTheta(6.0);
        setKc(4.0);
        setTi(12);
        setTd(1.0);
        break;
    }
  };

  return (
    <div className="sim413-page">
      <div className="sim413-content">
        <SimACE413Header
          onHome={onHome}
          selectedModel={model}
          onModelChange={handleModelChange}
        />

        <div className="sim413-diagram-container">
          <SimACE413Diagram
            model={model}
            gainK={gainK}
            tau1={tau1}
            tau2={tau2}
            theta={theta}
            kc={kc}
            ti={ti}
            td={td}
          />
        </div>

        <div className="sim413-controls-container">
          <SimACE413Controls
            model={model}
            gainK={gainK}
            onGainKChange={setGainK}
            tau1={tau1}
            onTau1Change={setTau1}
            tau2={tau2}
            onTau2Change={setTau2}
            theta={theta}
            onThetaChange={setTheta}
            kc={kc}
            onKcChange={setKc}
            ti={ti}
            onTiChange={setTi}
            td={td}
            onTdChange={setTd}
          />
        </div>
      </div>
    </div>
  );
};
