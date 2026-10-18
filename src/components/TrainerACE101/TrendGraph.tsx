import React, { useRef, useEffect, useState, useCallback } from 'react';
import './TrendGraph.css';

export interface TrendDataPoint {
  time: number;
  sp: number;
  pv: number;
  op: number;
}

interface TrendGraphProps {
  data: TrendDataPoint[];
  isHold: boolean;
  showSP?: boolean;
  showPV?: boolean;
  showOP?: boolean;
  onToggleSP?: () => void;
  onTogglePV?: () => void;
  onToggleOP?: () => void;
}

export const TrendGraph: React.FC<TrendGraphProps> = ({
  data,
  showSP = true,
  showPV = true,
  showOP = true,
  onToggleSP,
  onTogglePV,
  onToggleOP,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // X-Axis min & max controls (allow user to shrink or expand the graph)
  const [xMin, setXMin] = useState<number>(0);
  const [xMax, setXMax] = useState<number>(100);
  const [minInput, setMinInput] = useState<string>('0');
  const [maxInput, setMaxInput] = useState<string>('100');
  const [isEditingMin, setIsEditingMin] = useState<boolean>(false);
  const [isEditingMax, setIsEditingMax] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Custom Context Menu state (removes browser Inspect option)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 150;
    const menuHeight = 75;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
    setContextMenu({ x, y });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  const handleSaveImageAs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `trend_graph_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        }
      });
    } catch (err) {
      console.error('Failed to copy graph image:', err);
    }
  };

  // ── Sync inputs with dynamic xMin and xMax when NOT actively editing ──────
  useEffect(() => {
    if (!isEditingMin) {
      setMinInput(String(Math.round(xMin)));
    }
  }, [xMin, isEditingMin]);

  useEffect(() => {
    if (!isEditingMax) {
      setMaxInput(String(Math.round(xMax)));
    }
  }, [xMax, isEditingMax]);

  // ── Track container width dynamically ─────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateW = () => {
      if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    };
    updateW();
    const ro = new ResizeObserver(updateW);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Reset X-Axis when data is cleared (Stop -> Yes) ──────────────────────
  useEffect(() => {
    if (data.length === 0) {
      setXMin(0);
      setXMax(100);
      setMinInput('0');
      setMaxInput('100');
      setIsEditingMin(false);
      setIsEditingMax(false);
      setAutoScroll(true);
    }
  }, [data.length]);

  // ── Auto-scroll to latest data when in auto mode ───────────────────────────
  useEffect(() => {
    if (data.length === 0) return;
    const latestTime = data[data.length - 1].time;

    // Do not jump while user is typing into Min or Max inputs
    if (autoScroll && !isEditingMin && !isEditingMax) {
      const span = Math.max(10, xMax - xMin);
      if (latestTime > xMax) {
        setXMax(latestTime);
        setXMin(Math.max(0, latestTime - span));
      }
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      }
    }
  }, [data, autoScroll, xMin, xMax, isEditingMin, isEditingMax]);

  // ── Handle manual scrollbar dragging ──────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const atEnd = maxScroll <= 0 || el.scrollLeft >= maxScroll - 3;
    setAutoScroll(atEnd);

    const span = Math.max(10, xMax - xMin);
    const totalMax = Math.max(data.length > 0 ? data[data.length - 1].time : 100, span);
    const maxStart = Math.max(0, totalMax - span);

    if (!atEnd && maxScroll > 0) {
      const ratio = el.scrollLeft / maxScroll;
      const newMin = Math.round(ratio * maxStart);
      setXMin(newMin);
      setXMax(newMin + span);
    } else {
      setXMin(maxStart);
      setXMax(totalMax);
    }
  }, [data, xMin, xMax]);

  // ── Commit Min / Max on Enter or Blur ──────────────────────────────────────
  const commitMin = () => {
    setIsEditingMin(false);
    const parsed = parseFloat(minInput);
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed < xMax) {
        setXMin(parsed);
        setAutoScroll(false);
      } else {
        setMinInput(String(Math.round(xMin)));
      }
    } else {
      setMinInput(String(Math.round(xMin)));
    }
  };

  const commitMax = () => {
    setIsEditingMax(false);
    const parsed = parseFloat(maxInput);
    if (!isNaN(parsed)) {
      if (parsed > xMin) {
        setXMax(parsed);
        setAutoScroll(false);
      } else {
        setMaxInput(String(Math.round(xMax)));
      }
    } else {
      setMaxInput(String(Math.round(xMax)));
    }
  };

  const handleSetSpan = (newSpan: number) => {
    setIsEditingMin(false);
    setIsEditingMax(false);
    const span = Math.max(10, newSpan);
    const latest = data.length > 0 ? data[data.length - 1].time : 0;
    if (autoScroll && latest > 0) {
      const newMax = Math.max(span, latest);
      const newMin = Math.max(0, newMax - span);
      setXMax(newMax);
      setXMin(newMin);
      setMinInput(String(Math.round(newMin)));
      setMaxInput(String(Math.round(newMax)));
    } else {
      const newMax = xMin + span;
      setXMax(newMax);
      setMaxInput(String(Math.round(newMax)));
    }
  };

  const handleResetXAxis = () => {
    setIsEditingMin(false);
    setIsEditingMax(false);
    const latest = data.length > 0 ? data[data.length - 1].time : 0;
    if (latest > 100) {
      const newMin = Math.max(0, latest - 100);
      setXMax(latest);
      setXMin(newMin);
      setMinInput(String(Math.round(newMin)));
      setMaxInput(String(Math.round(latest)));
    } else {
      setXMin(0);
      setXMax(100);
      setMinInput('0');
      setMaxInput('100');
    }
    setAutoScroll(true);
  };

  // ── Canvas render ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const padL = 34;
    const padR = 12;
    const padT = 10;
    const padB = 22;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Y-Axis Grid Lines & Labels (0–100, step 20)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let yVal = 0; yVal <= 100; yVal += 20) {
      const yPos = padT + plotH - (yVal / 100) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(padL + plotW, yPos);
      ctx.stroke();
      ctx.fillText(yVal.toString(), padL - 4, yPos);
    }

    // X-Axis Grid Lines & Labels (scaled to current xMin .. xMax)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const span = Math.max(1, xMax - xMin);

    for (let tick = 0; tick <= 10; tick++) {
      const xPos = padL + (tick / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(xPos, padT);
      ctx.lineTo(xPos, padT + plotH);
      ctx.stroke();
      const labelVal = xMin + (tick / 10) * span;
      ctx.fillText(Math.round(labelVal).toString(), xPos, padT + plotH + 4);
    }

    // Plot border
    ctx.strokeStyle = '#0047ba';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, plotW, plotH);

    if (data.length === 0) return;

    // Clip traces cleanly within the plot border
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Draw traces
    const drawTrace = (
      accessor: (p: TrendDataPoint) => number,
      color: string
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < data.length; i++) {
        const p = data[i];
        const t = p.time;

        // Skip points before visible window (allow 1 point buffer for continuous line)
        if (t < xMin && i < data.length - 1 && data[i + 1].time < xMin) continue;

        const xPos = padL + ((t - xMin) / span) * plotW;
        const val = Math.min(Math.max(accessor(p), 0), 100);
        const yPos = padT + plotH - (val / 100) * plotH;

        if (!started) {
          ctx.moveTo(xPos, yPos);
          started = true;
        } else {
          ctx.lineTo(xPos, yPos);
        }

        // Break once well past the visible window
        if (t > xMax && i > 0 && data[i - 1].time > xMax) break;
      }
      ctx.stroke();
    };

    if (showSP) drawTrace((p) => p.sp, '#0047ba');
    if (showPV) drawTrace((p) => p.pv, '#16a34a');
    if (showOP) drawTrace((p) => p.op, '#dc2626');

    ctx.restore();
  }, [data, xMin, xMax, showSP, showPV, showOP]);

  const totalMax = Math.max(data.length > 0 ? data[data.length - 1].time : 100, xMax, 100);
  const span = Math.max(10, xMax - xMin);
  const phantomWidth = Math.max(
    Math.round(containerWidth * (totalMax / span)),
    containerWidth + 30
  );

  return (
    <div className="trend-graph-container">
      <div className="trend-main-area">
        {/* Canvas */}
        <div className="trend-canvas-wrapper">
          <canvas
            ref={canvasRef}
            id="ace101-trend-canvas"
            className="trend-canvas"
            onContextMenu={handleCanvasContextMenu}
          />
        </div>

        {/* Horizontal Scrollbar — appears below the canvas */}
        <div
          className="trend-scrollbar"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {/* Phantom element whose width drives the scrollbar range */}
          <div
            className="trend-scrollbar-phantom"
            style={{ width: phantomWidth }}
          />
        </div>

        {/* X-Axis Range Control Strip (Modify Min & Max to Shrink or Expand Graph) */}
        <div className="trend-xaxis-bar">
          <div className="xaxis-bar-left">
            <span className="xaxis-bar-tag">X-Axis Range:</span>
            <div className="xaxis-input-group">
              <span className="xaxis-field-label">Min:</span>
              <input
                type="number"
                className={`xaxis-field-input ${isEditingMin ? 'editing' : ''}`}
                value={minInput}
                step={10}
                min={0}
                onFocus={() => setIsEditingMin(true)}
                onChange={(e) => setMinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitMin();
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setMinInput(String(Math.round(xMin)));
                    setIsEditingMin(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onBlur={commitMin}
                title="Enter Min value and press Enter to apply to X-Axis"
              />
            </div>
            <span className="xaxis-sep">–</span>
            <div className="xaxis-input-group">
              <span className="xaxis-field-label">Max:</span>
              <input
                type="number"
                className={`xaxis-field-input ${isEditingMax ? 'editing' : ''}`}
                value={maxInput}
                step={10}
                min={xMin + 5}
                onFocus={() => setIsEditingMax(true)}
                onChange={(e) => setMaxInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitMax();
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setMaxInput(String(Math.round(xMax)));
                    setIsEditingMax(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onBlur={commitMax}
                title="Enter Max value and press Enter to apply to X-Axis"
              />
              <span className="xaxis-unit">s</span>
            </div>
          </div>

          <div className="xaxis-bar-right">
            <span className="xaxis-presets-label">Span:</span>
            <button
              type="button"
              className={`xaxis-btn ${xMax - xMin === 50 ? 'active' : ''}`}
              onClick={() => handleSetSpan(50)}
              title="Expand waveform (50s Window)"
            >
              50s
            </button>
            <button
              type="button"
              className={`xaxis-btn ${xMax - xMin === 100 ? 'active' : ''}`}
              onClick={() => handleSetSpan(100)}
              title="Default waveform (100s Window)"
            >
              100s
            </button>
            <button
              type="button"
              className={`xaxis-btn ${xMax - xMin === 200 ? 'active' : ''}`}
              onClick={() => handleSetSpan(200)}
              title="Shrink waveform (200s Window)"
            >
              200s
            </button>
            <button
              type="button"
              className="xaxis-btn reset"
              onClick={handleResetXAxis}
              title="Reset X-Axis to default"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Channel Selectors */}
      <div className="trend-legend">
        <button
          type="button"
          className={`legend-item ${showSP ? 'active-sp' : 'muted'}`}
          onClick={onToggleSP}
          title="Toggle Set Point (%)"
        >
          <span className="legend-label">SP %</span>
          <span className="legend-indicator blue-bar">︽</span>
        </button>

        <button
          type="button"
          className={`legend-item ${showPV ? 'active-pv' : 'muted'}`}
          onClick={onTogglePV}
          title="Toggle Process Variable (%)"
        >
          <span className="legend-label">PV %</span>
          <span className="legend-indicator green-bar">︽</span>
        </button>

        <button
          type="button"
          className={`legend-item ${showOP ? 'active-op' : 'muted'}`}
          onClick={onToggleOP}
          title="Toggle Controller Output (%)"
        >
          <span className="legend-label">OP %</span>
          <span className="legend-indicator red-bar">︽</span>
        </button>
      </div>

      {contextMenu && (
        <div
          className="trend-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="trend-context-menu-item"
            onClick={handleSaveImageAs}
          >
            Save image as...
          </button>
          <button
            type="button"
            className="trend-context-menu-item"
            onClick={handleCopyImage}
          >
            Copy image
          </button>
        </div>
      )}
    </div>
  );
};
