import React, { useRef, useEffect, useState } from 'react';
import './SimACE401TrendGraph.css';

export interface SimTrendPoint {
  time: number;
  sp: number;
  pv: number;
  op: number;
}

interface SimACE401TrendGraphProps {
  data: SimTrendPoint[];
  isRunning: boolean;
  onClearChart?: () => void;
  onExportRef?: (exportFn: () => void) => void;
}

export const SimACE401TrendGraph: React.FC<SimACE401TrendGraphProps> = ({
  data,
  onClearChart,
  onExportRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showSP, setShowSP] = useState(true);
  const [showPV, setShowPV] = useState(true);
  const [showOP, setShowOP] = useState(true);

  const [xMax, setXMax] = useState(100);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ACE401_TrendGraph_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (onExportRef) {
      onExportRef(handleExport);
    }
  }, [onExportRef]);

  // Context menu handling
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth - 70; // 70px for right legend
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Layout dimensions
    const marginLeft = 38;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 28;
    const plotW = width - marginLeft - marginRight;
    const plotH = height - marginTop - marginBottom;

    // Draw Plot Background (LabVIEW White / Off-white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(marginLeft, marginTop, plotW, plotH);

    // Grid properties
    const yDivisions = 5; // 0, 20, 40, 60, 80, 100
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#9ca3af';

    // Horizontal Grid Lines & Y-Axis Labels
    ctx.font = 'bold 10.5px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= yDivisions; i++) {
      const yVal = (i / yDivisions) * 100;
      const yPos = marginTop + plotH - (i / yDivisions) * plotH;

      ctx.beginPath();
      ctx.strokeStyle = i === 0 || i === yDivisions ? '#4b5563' : '#cbd5e1';
      ctx.moveTo(marginLeft, yPos);
      ctx.lineTo(marginLeft + plotW, yPos);
      ctx.stroke();

      ctx.fillText(String(Math.round(yVal)), marginLeft - 5, yPos);
    }

    // Determine X range
    const maxDataTime = data.length > 0 ? data[data.length - 1].time : 0;
    const curXMax = Math.max(100, Math.ceil(maxDataTime / 20) * 20);
    if (curXMax !== xMax) {
      setXMax(curXMax);
    }

    // Vertical Grid Lines & X-Axis Labels
    const xStep = curXMax <= 100 ? 5 : 10;
    const numXSteps = curXMax / xStep;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= numXSteps; i++) {
      const xVal = i * xStep;
      const xPos = marginLeft + (xVal / curXMax) * plotW;

      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0 ? '#cbd5e1' : '#e2e8f0';
      ctx.moveTo(xPos, marginTop);
      ctx.lineTo(xPos, marginTop + plotH);
      ctx.stroke();

      // Show labels every 5 or 10s
      if (i % 2 === 0 || curXMax <= 50) {
        ctx.fillStyle = '#111827';
        ctx.fillText(String(xVal), xPos, marginTop + plotH + 4);
      }
    }

    // Draw Plot Border (Recessed Bezel)
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(marginLeft, marginTop, plotW, plotH);

    // Plot Data Lines
    if (data.length > 1) {
      const getX = (t: number) => marginLeft + (t / curXMax) * plotW;
      const getY = (val: number) => marginTop + plotH - (Math.max(0, Math.min(100, val)) / 100) * plotH;

      // 1. SP (Blue)
      if (showSP) {
        ctx.beginPath();
        ctx.strokeStyle = '#1d4ed8'; // Dark vivid blue
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.moveTo(getX(data[0].time), getY(data[0].sp));
        for (let i = 1; i < data.length; i++) {
          ctx.lineTo(getX(data[i].time), getY(data[i].sp));
        }
        ctx.stroke();
      }

      // 2. PV (Green)
      if (showPV) {
        ctx.beginPath();
        ctx.strokeStyle = '#16a34a'; // Vibrant emerald green
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.moveTo(getX(data[0].time), getY(data[0].pv));
        for (let i = 1; i < data.length; i++) {
          ctx.lineTo(getX(data[i].time), getY(data[i].pv));
        }
        ctx.stroke();
      }

      // 3. OP (Red)
      if (showOP) {
        ctx.beginPath();
        ctx.strokeStyle = '#dc2626'; // Vivid red
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.moveTo(getX(data[0].time), getY(data[0].op));
        for (let i = 1; i < data.length; i++) {
          ctx.lineTo(getX(data[i].time), getY(data[i].op));
        }
        ctx.stroke();
      }
    }
  }, [data, showSP, showPV, showOP, xMax]);

  return (
    <div
      ref={containerRef}
      className="sim401-trend-container"
      onContextMenu={handleContextMenu}
    >
      <canvas ref={canvasRef} className="sim401-trend-canvas" />

      {/* Plot Legend on Right */}
      <div className="sim401-trend-legend">
        {/* SP % */}
        <div
          className={`sim401-legend-item ${!showSP ? 'legend-hidden' : ''}`}
          onClick={() => setShowSP(!showSP)}
          title="Toggle Set Point trace"
        >
          <span className="sim401-legend-label">SP %</span>
          <span className="sim401-legend-icon icon-sp">
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M4 14 L10 6 L16 14" fill="none" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* PV % */}
        <div
          className={`sim401-legend-item ${!showPV ? 'legend-hidden' : ''}`}
          onClick={() => setShowPV(!showPV)}
          title="Toggle Process Variable trace"
        >
          <span className="sim401-legend-label">PV %</span>
          <span className="sim401-legend-icon icon-pv">
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M4 14 L10 6 L16 14" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* OP % */}
        <div
          className={`sim401-legend-item ${!showOP ? 'legend-hidden' : ''}`}
          onClick={() => setShowOP(!showOP)}
          title="Toggle Controller Output trace"
        >
          <span className="sim401-legend-label">OP %</span>
          <span className="sim401-legend-icon icon-op">
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M4 14 L10 6 L16 14" fill="none" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          className="sim401-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="sim401-ctx-item"
            onClick={() => {
              const text = data.map((d) => `${d.time},${d.sp},${d.pv},${d.op}`).join('\n');
              navigator.clipboard?.writeText(`Time,SP,PV,OP\n${text}`);
              setContextMenu(null);
            }}
          >
            Copy Data
          </div>
          <div className="sim401-ctx-item" onClick={handleExport}>
            Export Graph Image
          </div>
          {onClearChart && (
            <div
              className="sim401-ctx-item"
              onClick={() => {
                onClearChart();
                setContextMenu(null);
              }}
            >
              Clear Chart
            </div>
          )}
          <div
            className="sim401-ctx-item"
            onClick={() => {
              setShowSP(true);
              setShowPV(true);
              setShowOP(true);
              setContextMenu(null);
            }}
          >
            Show All Traces
          </div>
          <div className="sim401-ctx-divider" />
          <div
            className="sim401-ctx-item"
            onClick={() => setContextMenu(null)}
          >
            Close
          </div>
        </div>
      )}
    </div>
  );
};
