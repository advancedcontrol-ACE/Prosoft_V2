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

/** Number of data points visible in the canvas window at one time */
const WINDOW_SIZE = 100;

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

  /** Index of the first data point currently visible on the left edge */
  const [scrollOffset, setScrollOffset] = useState(0);
  /**
   * When true the view auto-follows the newest data (scrolled to the rightmost end).
   * Becomes false when the user manually scrolls left; returns to true when they
   * scroll back to the right edge.
   */
  const [autoScroll, setAutoScroll] = useState(true);
  const [containerWidth, setContainerWidth] = useState(800);

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

  // ── Auto-scroll scrollbar to the right end when new data arrives ──────────
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    }
  }, [data.length, autoScroll, containerWidth]);

  // ── Sync scrollOffset when data.length changes and we are in auto mode ────
  useEffect(() => {
    if (autoScroll) {
      const maxOffset = Math.max(0, data.length - WINDOW_SIZE);
      setScrollOffset(maxOffset);
    }
  }, [data.length, autoScroll]);

  // ── Handle manual scroll ──────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const atEnd = maxScroll <= 0 || el.scrollLeft >= maxScroll - 2;
    setAutoScroll(atEnd);

    if (!atEnd) {
      const ratio = el.scrollLeft / Math.max(1, maxScroll);
      const maxOffset = Math.max(0, data.length - WINDOW_SIZE);
      setScrollOffset(Math.round(ratio * maxOffset));
    } else {
      setScrollOffset(Math.max(0, data.length - WINDOW_SIZE));
    }
  }, [data.length]);

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

    // X-Axis Grid Lines & Labels — show actual data-point indices
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const startIdx = scrollOffset;
    const endIdx = Math.min(data.length, startIdx + WINDOW_SIZE);
    const pointsInWindow = endIdx - startIdx;
    const displayWindow = Math.max(pointsInWindow, WINDOW_SIZE);

    for (let tick = 0; tick <= 10; tick++) {
      const xPos = padL + (tick / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(xPos, padT);
      ctx.lineTo(xPos, padT + plotH);
      ctx.stroke();
      const labelVal = startIdx + Math.round((tick / 10) * displayWindow);
      ctx.fillText(labelVal.toString(), xPos, padT + plotH + 4);
    }

    // Plot border
    ctx.strokeStyle = '#0047ba';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, plotW, plotH);

    if (data.length === 0) return;

    // Draw a trace for a given accessor function and colour
    const drawTrace = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessor: (p: TrendDataPoint) => number,
      color: string
    ) => {
      const slice = data.slice(startIdx, endIdx);
      if (slice.length === 0) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      slice.forEach((p, idx) => {
        const xPos = padL + (idx / (displayWindow - 1 || 1)) * plotW;
        const val = Math.min(Math.max(accessor(p), 0), 100);
        const yPos = padT + plotH - (val / 100) * plotH;
        if (idx === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      });
      ctx.stroke();
    };

    if (showSP) drawTrace((p) => p.sp, '#0047ba');
    if (showPV) drawTrace((p) => p.pv, '#16a34a');
    if (showOP) drawTrace((p) => p.op, '#dc2626');
  }, [data, scrollOffset, showSP, showPV, showOP]);

  // Proportional phantom width:
  // Scales with total accumulated data points beyond WINDOW_SIZE (100).
  // Always at least containerWidth + 30 so the scrollbar thumb is visibly rendered and active!
  const totalPoints = Math.max(data.length, WINDOW_SIZE);
  const phantomWidth = Math.max(
    Math.round(containerWidth * (totalPoints / WINDOW_SIZE)),
    containerWidth + 30
  );

  return (
    <div className="trend-graph-container">
      <div className="trend-main-area">
        {/* Canvas */}
        <div className="trend-canvas-wrapper">
          <canvas ref={canvasRef} className="trend-canvas" />
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
    </div>
  );
};
