import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SimACE401Slider.css';

interface SimACE401SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  ticks: number[];
  value: number;
  decimals?: number;
  enabled?: boolean;
  readOnly?: boolean;
  onChange?: (val: number) => void;
  width?: number;
  plateHeight?: number;
}

export const SimACE401Slider: React.FC<SimACE401SliderProps> = ({
  label,
  min,
  max,
  step = 1,
  ticks,
  value,
  decimals = 0,
  enabled = true,
  readOnly = false,
  onChange,
  width = 118,
  plateHeight = 98,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const repeatRef = useRef<number | null>(null);
  const isFocusedRef = useRef(false);

  const clampedVal = Math.min(Math.max(value, min), max);
  const percent = max > min ? ((clampedVal - min) / (max - min)) * 100 : 0;

  const [inputText, setInputText] = useState<string>(() => Number(value).toFixed(decimals));

  useEffect(() => {
    if (!isFocusedRef.current) {
      setInputText(Number(value).toFixed(decimals));
    }
  }, [value, decimals]);

  const commitInput = (str: string) => {
    if (!onChange || readOnly || !enabled) return;
    const n = parseFloat(str);
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, min), max);
      const stepped = Math.round(clamped / step) * step;
      const finalVal = Number(stepped.toFixed(decimals));
      onChange(finalVal);
      setInputText(finalVal.toFixed(decimals));
    } else {
      setInputText(Number(value).toFixed(decimals));
    }
  };

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || readOnly || !onChange || !trackRef.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);

      const updateValue = (clientY: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const rawRatio = (rect.bottom - clientY) / rect.height;
        const clampedRatio = Math.min(Math.max(rawRatio, 0), 1);
        const rawVal = min + clampedRatio * (max - min);
        const steppedVal = Math.round(rawVal / step) * step;
        const finalVal = Number(Math.min(Math.max(steppedVal, min), max).toFixed(decimals));
        onChange(finalVal);
      };

      updateValue(e.clientY);

      const handlePointerMove = (moveEvt: PointerEvent) => {
        updateValue(moveEvt.clientY);
      };

      const handlePointerUp = (upEvt: PointerEvent) => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        try {
          e.currentTarget.releasePointerCapture(upEvt.pointerId);
        } catch {}
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [enabled, readOnly, onChange, min, max, step, decimals]
  );

  const handleIncrement = () => {
    if (!enabled || readOnly || !onChange) return;
    const nextVal = Math.min(max, clampedVal + step);
    const finalVal = Number(nextVal.toFixed(decimals));
    onChange(finalVal);
    setInputText(finalVal.toFixed(decimals));
  };

  const handleDecrement = () => {
    if (!enabled || readOnly || !onChange) return;
    const prevVal = Math.max(min, clampedVal - step);
    const finalVal = Number(prevVal.toFixed(decimals));
    onChange(finalVal);
    setInputText(finalVal.toFixed(decimals));
  };

  const startRepeat = (action: () => void) => {
    if (!enabled || readOnly) return;
    action();
    const timeout = window.setTimeout(() => {
      repeatRef.current = window.setInterval(action, 80);
    }, 280);

    const stopRepeat = () => {
      window.clearTimeout(timeout);
      if (repeatRef.current) window.clearInterval(repeatRef.current);
      window.removeEventListener('mouseup', stopRepeat);
      window.removeEventListener('pointerup', stopRepeat);
    };

    window.addEventListener('mouseup', stopRepeat);
    window.addEventListener('pointerup', stopRepeat);
  };

  const isInteractive = enabled && !readOnly;

  return (
    <div
      className={`sim401-slider-item ${!enabled ? 'disabled' : ''} ${readOnly ? 'readonly' : ''}`}
      style={{ width }}
    >
      <div className="sim401-slider-title" title={label}>
        {label}
      </div>

      <div className="sim401-slider-controls-row">
        {/* Slider Plate */}
        <div
          className="sim401-slider-plate"
          style={{ height: plateHeight }}
          onPointerDown={handleTrackPointerDown}
        >
          {/* Tick Scale */}
          <div className="sim401-slider-scale">
            {ticks.map((t) => {
              const tickPercent = ((t - min) / (max - min)) * 100;
              return (
                <div
                  key={t}
                  className="sim401-scale-mark"
                  style={{ bottom: `${tickPercent}%` }}
                >
                  <span className="sim401-tick-number">{t}</span>
                  <span className="sim401-tick-dash" />
                </div>
              );
            })}
          </div>

          {/* Track */}
          <div ref={trackRef} className="sim401-slider-track">
            <div
              className="sim401-slider-fill"
              style={{ height: `${percent}%` }}
            />
            <div
              className="sim401-slider-thumb"
              style={{ bottom: `${percent}%` }}
            >
              <svg width="8" height="10" viewBox="0 0 8 10">
                <polygon
                  points="0,5 7,1 7,9"
                  fill="#f8fafc"
                  stroke="#52525b"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Digital Input/Display Box */}
        <div className={`sim401-digital-box ${!isInteractive ? 'box-disabled' : ''}`}>
          {isInteractive && (
            <div className="sim401-spinners">
              <button
                type="button"
                className="sim401-spin-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  startRepeat(handleIncrement);
                }}
                disabled={clampedVal >= max}
                tabIndex={-1}
              >
                ▲
              </button>
              <button
                type="button"
                className="sim401-spin-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  startRepeat(handleDecrement);
                }}
                disabled={clampedVal <= min}
                tabIndex={-1}
              >
                ▼
              </button>
            </div>
          )}

          <input
            type="text"
            className="sim401-digital-input"
            value={inputText}
            disabled={!isInteractive}
            readOnly={!isInteractive}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onChange={(e) => setInputText(e.target.value)}
            onBlur={() => {
              isFocusedRef.current = false;
              commitInput(inputText);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitInput(inputText);
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleIncrement();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleDecrement();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
