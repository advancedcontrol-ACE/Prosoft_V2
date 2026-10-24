import React, { useRef, useEffect, useState } from 'react';
import './SimACE403TrainingGraphs.css';

export interface DataPoint {
  t: number;
  op: number;
  pv: number;
}

export type PlantGraphTab = 'input-profile' | 'process-response' | 'convergence';

interface SimACE403TrainingGraphsProps {
  plannedOpProfile: { t: number; op: number }[];
  collectedData: DataPoint[];
  duration: number;
  currentTime: number;
  isGenerating: boolean;
  isTraining: boolean;
  lossHistory: number[];
  activeTab?: PlantGraphTab;
  onTabChange?: (tab: PlantGraphTab) => void;
}

export const SimACE403TrainingGraphs: React.FC<SimACE403TrainingGraphsProps> = ({
  plannedOpProfile,
  collectedData,
  duration,
  currentTime,
  isGenerating,
  isTraining,
  lossHistory,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<PlantGraphTab>('input-profile');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: PlantGraphTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hasData = collectedData.length > 0;

  // Auto-switch to appropriate tab when generating or training begins
  useEffect(() => {
    if (isTraining && hasData) {
      setActiveTab('convergence');
    } else if (isGenerating && hasData) {
      setActiveTab('process-response');
    } else if (!hasData && activeTab !== 'input-profile') {
      setActiveTab('input-profile');
    }
  }, [isTraining, isGenerating, hasData]);

  const curPoint = collectedData.length > 0 ? collectedData[collectedData.length - 1] : { pv: 0, op: 0 };
  const lastLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0;

  // Render Canvas based on Active Tab
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark slate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 48;
    const padRight = 24;
    const padTop = 18;
    const padBot = 28;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBot;

    // ─────────────────────────────────────────────────────────────
    // TAB 1: Generated Input Profile (Discrete OP % vs Time)
    // ─────────────────────────────────────────────────────────────
    if (activeTab === 'input-profile') {
      // Y-axis gridlines & labels (0% to 100%)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';

      for (let yPct = 0; yPct <= 100; yPct += 20) {
        const y = padTop + plotH - (yPct / 100) * plotH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
        ctx.fillText(`${yPct}%`, padLeft - 8, y + 4);
      }

      // X-axis time ticks
      const maxT = Math.max(10, duration);
      const stepT = maxT <= 60 ? 10 : maxT <= 150 ? 15 : 30;
      ctx.textAlign = 'center';

      for (let t = 0; t <= maxT; t += stepT) {
        const x = padLeft + (t / maxT) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();
        ctx.fillText(`${t}s`, x, height - 10);
      }

      // Draw Planned OP profile line (Cyan)
      if (plannedOpProfile.length > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.beginPath();

        plannedOpProfile.forEach((pt, idx) => {
          const x = padLeft + Math.min(1, pt.t / maxT) * plotW;
          const y = padTop + plotH - (Math.min(100, Math.max(0, pt.op)) / 100) * plotH;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Current Excitation Time cursor
      if (isGenerating && currentTime > 0) {
        const curX = padLeft + Math.min(1, currentTime / maxT) * plotW;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(curX, padTop);
        ctx.lineTo(curX, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 2: Real-Time Process Response (Live PV & OP vs Time)
    // ─────────────────────────────────────────────────────────────
    if (activeTab === 'process-response') {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';

      for (let yPct = 0; yPct <= 100; yPct += 20) {
        const y = padTop + plotH - (yPct / 100) * plotH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
        ctx.fillText(`${yPct}%`, padLeft - 8, y + 4);
      }

      const maxT = Math.max(10, duration);
      const stepT = maxT <= 60 ? 10 : maxT <= 150 ? 15 : 30;
      ctx.textAlign = 'center';

      for (let t = 0; t <= maxT; t += stepT) {
        const x = padLeft + (t / maxT) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();
        ctx.fillText(`${t}s`, x, height - 10);
      }

      if (collectedData.length > 0) {
        // 1. Draw OP (Dashed Cyan)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        collectedData.forEach((pt, idx) => {
          const x = padLeft + Math.min(1, pt.t / maxT) * plotW;
          const y = padTop + plotH - (Math.min(100, Math.max(0, pt.op)) / 100) * plotH;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Draw Process Variable PV (Solid Emerald Green)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        collectedData.forEach((pt, idx) => {
          const x = padLeft + Math.min(1, pt.t / maxT) * plotW;
          const y = padTop + plotH - (Math.min(100, Math.max(0, pt.pv)) / 100) * plotH;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 3: Model Convergence (MSE Loss vs Epoch)
    // ─────────────────────────────────────────────────────────────
    if (activeTab === 'convergence') {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';

      const maxLoss = Math.max(0.05, ...lossHistory);
      for (let i = 0; i <= 4; i++) {
        const yFrac = i / 4;
        const y = padTop + plotH - yFrac * plotH;
        const val = (yFrac * maxLoss).toFixed(4);
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
        ctx.fillText(val, padLeft - 8, y + 4);
      }

      ctx.textAlign = 'center';
      const maxEpoch = Math.max(10, lossHistory.length);
      for (let ep = 0; ep <= maxEpoch; ep += Math.max(1, Math.round(maxEpoch / 5))) {
        const x = padLeft + (ep / maxEpoch) * plotW;
        ctx.fillText(`Ep ${ep}`, x, height - 10);
      }

      if (lossHistory.length > 0) {
        // Draw Loss curve in amber
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        lossHistory.forEach((loss, idx) => {
          const x = padLeft + (idx / Math.max(1, lossHistory.length - 1)) * plotW;
          const y = padTop + plotH - (loss / maxLoss) * plotH;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else {
        // Placeholder when not yet trained
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Model convergence curve will render during training.', width / 2, height / 2);
      }
    }
  }, [activeTab, plannedOpProfile, collectedData, duration, currentTime, isGenerating, lossHistory]);

  return (
    <div className="sim403-graphs-container">
      {/* ── Top Tabs Bar (Figure 1: 3 Tabs for Plant Parameters) ── */}
      <div className="sim403-plant-tabs-bar">
        <button
          type="button"
          className={`sim403-plant-tab-btn ${activeTab === 'input-profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('input-profile')}
        >
          <span className="sim403-plant-tab-icon">&#128200;</span>
          Generated Input Profile
        </button>
        <button
          type="button"
          className={`sim403-plant-tab-btn ${activeTab === 'process-response' ? 'active' : ''}`}
          disabled={!hasData}
          onClick={() => setActiveTab('process-response')}
          title={!hasData ? 'Generate or import data first' : 'Real-Time Process Response'}
        >
          <span className="sim403-plant-tab-icon">&#128202;</span>
          Real-Time Process Response
        </button>
        <button
          type="button"
          className={`sim403-plant-tab-btn ${activeTab === 'convergence' ? 'active' : ''}`}
          disabled={!hasData}
          onClick={() => setActiveTab('convergence')}
          title={!hasData ? 'Generate or import data first' : 'Model Convergence'}
        >
          <span className="sim403-plant-tab-icon">&#128161;</span>
          Model Convergence
        </button>
      </div>

      {/* ── Main Graph Content Card ── */}
      <div className="sim403-graph-card">
        {/* Header with Title & Telemetry Badges */}
        <div className="sim403-graph-header">
          <div className="sim403-graph-title-group">
            <span className="sim403-graph-title">
              {activeTab === 'input-profile' && 'Generated Input Profile (Discrete OP % vs Time)'}
              {activeTab === 'process-response' && 'Real-Time Process Response (Live PV & OP vs Time)'}
              {activeTab === 'convergence' && 'Model Training Convergence (MSE Loss vs Epoch)'}
            </span>
          </div>

          <div className="sim403-graph-badges">
            {activeTab === 'input-profile' && (
              <>
                <span className="sim403-badge-op">&bull; Generated OP Signal</span>
                <span className="sim403-badge-duration">Duration: {duration}s</span>
              </>
            )}

            {activeTab === 'process-response' && (
              <>
                <span className="sim403-badge-pv">&bull; PV: {curPoint.pv.toFixed(1)}%</span>
                <span className="sim403-badge-op">&bull; OP: {curPoint.op.toFixed(1)}%</span>
                <span className="sim403-badge-samples">Samples: {collectedData.length}</span>
              </>
            )}

            {activeTab === 'convergence' && (
              <>
                <span className="sim403-badge-training">
                  &bull; Loss: {lastLoss.toFixed(5)}
                </span>
                <span className="sim403-badge-duration">Epochs: {lossHistory.length}</span>
              </>
            )}
          </div>
        </div>

        {/* Canvas Area (Full Height) */}
        <div className="sim403-canvas-wrapper">
          <canvas ref={canvasRef} width={800} height={340} className="sim403-canvas" />
        </div>

        {/* Bottom Workflow Banner matching Figure 1 */}
        <div className="sim403-workflow-banner">
          <span className="sim403-workflow-icon">&#128161;</span>
          <span className="sim403-workflow-text">
            <strong>Workflow:</strong> 1. Generate Input &amp; Collect Data &rarr; 2. Train Model &amp; Export &rarr; 3. Switch to Process Schematic &amp; Hit RUN to Validate ML Control
          </span>
        </div>
      </div>
    </div>
  );
};
