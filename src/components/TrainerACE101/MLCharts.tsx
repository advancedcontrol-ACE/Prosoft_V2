import React, { useRef, useEffect } from 'react';

interface SignalProfileChartProps {
  data: number[]; // OP array for each second [0..endTime]
  currentTime?: number;
  isCollecting?: boolean;
}

export const SignalProfileChart: React.FC<SignalProfileChartProps> = ({
  data,
  currentTime = -1,
  isCollecting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use actual client size for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    canvas.height = Math.max(160, Math.floor(rect.height * dpr));

    ctx.scale(dpr, dpr);
    const cssW = rect.width;
    const cssH = rect.height;

    // Background
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, cssW, cssH);

    // Margins
    const padL = 44;
    const padR = 20;
    const padT = 24;
    const padB = 26;
    const plotW = Math.max(10, cssW - padL - padR);
    const plotH = Math.max(10, cssH - padT - padB);

    // Grid lines & Y-axis labels (0 to 100%)
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = [0, 20, 40, 60, 80, 100];
    for (const val of yTicks) {
      const y = padT + plotH - (val / 100) * plotH;
      ctx.strokeStyle = val === 0 || val === 100 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${val}%`, padL - 6, y);
    }

    // X-axis Time ticks
    const totalPoints = Math.max(1, data.length);
    const maxTime = Math.max(10, totalPoints - 1);
    const numXTicks = Math.min(8, Math.max(3, Math.floor(plotW / 80)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= numXTicks; i++) {
      const frac = i / numXTicks;
      const tVal = Math.round(frac * maxTime);
      const x = padL + frac * plotW;

      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${tVal}s`, x, padT + plotH + 6);
    }

    // Draw Input Signal
    if (data.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8'; // Sky blue
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';

      for (let i = 0; i < data.length; i++) {
        const x = padL + (i / maxTime) * plotW;
        const yVal = Math.max(0, Math.min(100, data[i]));
        const y = padT + plotH - (yVal / 100) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Current Playback Scrubber / Marker
      if (currentTime >= 0 && currentTime < data.length) {
        const curX = padL + (currentTime / maxTime) * plotW;
        const curYVal = data[currentTime] ?? 0;
        const curY = padT + plotH - (curYVal / 100) * plotH;

        // Vertical guide line
        ctx.strokeStyle = isCollecting ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(curX, padT);
        ctx.lineTo(curX, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow circle
        ctx.fillStyle = isCollecting ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(curX, curY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [data, currentTime, isCollecting]);

  return (
    <div className="mlc-chart-container">
      <div className="mlc-chart-top-bar">
        <span className="mlc-chart-title">
          📈 Generated Input Profile (Discrete OP % vs Time)
        </span>
        <div className="mlc-chart-legend">
          <span className="legend-chip chip-op">● Generated OP Signal</span>
          {data.length > 0 && (
            <span className="legend-stat">Duration: {data.length - 1}s</span>
          )}
          {currentTime >= 0 && (
            <span className="legend-stat active-stat">
              t = {currentTime}s | OP = {data[currentTime]?.toFixed(1) ?? '0'}%
            </span>
          )}
        </div>
      </div>
      <div className="mlc-canvas-wrap">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

interface RealtimeResponseChartProps {
  data: { time: number; pv: number; op: number }[];
  isCollecting?: boolean;
  currentPV?: number;
  currentOP?: number;
}

export const RealtimeResponseChart: React.FC<RealtimeResponseChartProps> = ({
  data,
  isCollecting = false,
  currentPV = 0,
  currentOP = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    canvas.height = Math.max(160, Math.floor(rect.height * dpr));

    ctx.scale(dpr, dpr);
    const cssW = rect.width;
    const cssH = rect.height;

    // Background
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, cssW, cssH);

    // Margins
    const padL = 44;
    const padR = 20;
    const padT = 24;
    const padB = 26;
    const plotW = Math.max(10, cssW - padL - padR);
    const plotH = Math.max(10, cssH - padT - padB);

    // Grid lines & Y-axis labels (0 to 100%)
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = [0, 20, 40, 60, 80, 100];
    for (const val of yTicks) {
      const y = padT + plotH - (val / 100) * plotH;
      ctx.strokeStyle = val === 0 || val === 100 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${val}%`, padL - 6, y);
    }

    // Time calculations
    const maxTime = data.length > 0 ? Math.max(30, data[data.length - 1].time) : 60;
    const numXTicks = Math.min(8, Math.max(3, Math.floor(plotW / 80)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= numXTicks; i++) {
      const frac = i / numXTicks;
      const tVal = Math.round(frac * maxTime);
      const x = padL + frac * plotW;

      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${tVal}s`, x, padT + plotH + 6);
    }

    if (data.length > 1) {
      // 1. Draw OP series (Orange)
      ctx.beginPath();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      data.forEach((pt, i) => {
        const x = padL + (pt.time / maxTime) * plotW;
        const yVal = Math.max(0, Math.min(100, pt.op));
        const y = padT + plotH - (yVal / 100) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 2. Draw PV series (Green)
      ctx.beginPath();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      data.forEach((pt, i) => {
        const x = padL + (pt.time / maxTime) * plotW;
        const yVal = Math.max(0, Math.min(100, pt.pv));
        const y = padT + plotH - (yVal / 100) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Marker on latest point
      const last = data[data.length - 1];
      const lastX = padL + (last.time / maxTime) * plotW;
      const pvY = padT + plotH - (Math.max(0, Math.min(100, last.pv)) / 100) * plotH;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(lastX, pvY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [data, isCollecting]);

  return (
    <div className="mlc-chart-container">
      <div className="mlc-chart-top-bar">
        <span className="mlc-chart-title">
          📊 Real-Time Process Response (Live PV &amp; OP vs Time)
        </span>
        <div className="mlc-chart-legend">
          <span className="legend-chip chip-pv">● PV: {currentPV.toFixed(1)}%</span>
          <span className="legend-chip chip-op">● OP: {currentOP.toFixed(1)}%</span>
          <span className="legend-stat">Samples: {data.length}</span>
          {isCollecting && (
            <span className="recording-pill">● RECORDING MODBUS</span>
          )}
        </div>
      </div>
      <div className="mlc-canvas-wrap">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
