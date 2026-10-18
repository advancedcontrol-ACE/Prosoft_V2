import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LabViewSlider.css';

interface LabViewSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  ticks: number[];
  value: number;
  decimals?: number;
  enabled?: boolean;
  onChange?: (val: number) => void;
}

export const LabViewSlider: React.FC<LabViewSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  ticks,
  value,
  decimals = 0,
  enabled = true,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const repeatRef = useRef<number | null>(null);
  const isFocusedRef = useRef(false);
  const lastCommittedValRef = useRef<number>(value);
  const lastCommitTimeRef = useRef<number>(0);

  // Clamped numeric value and percentage
  const clampedVal = Math.min(Math.max(value, min), max);
  const percent = max > min ? ((clampedVal - min) / (max - min)) * 100 : 0;

  // Local text state for input field to allow fluid user editing
  const [inputText, setInputText] = useState<string>(() => Number(value).toFixed(decimals));

  useEffect(() => {
    // If the input is currently focused by user typing, don't overwrite
    if (isFocusedRef.current) return;

    // If user recently committed a value (within 2.5s) and incoming poll hasn't reflected it yet, suppress reversion
    const now = Date.now();
    if (now - lastCommitTimeRef.current < 2500) {
      if (Math.abs(value - lastCommittedValRef.current) > 0.05) {
        return;
      }
    }

    setInputText(Number(value).toFixed(decimals));
    lastCommittedValRef.current = value;
  }, [value, decimals]);

  // Commit text input to parent
  const commitInput = (str: string) => {
    if (!onChange) return;
    const n = parseFloat(str);
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, min), max);
      const stepped = Math.round(clamped / step) * step;
      const finalVal = Number(stepped.toFixed(decimals));
      lastCommittedValRef.current = finalVal;
      lastCommitTimeRef.current = Date.now();
      onChange(finalVal);
      setInputText(finalVal.toFixed(decimals));
    } else {
      setInputText(lastCommittedValRef.current.toFixed(decimals));
    }
  };

  // Pointer drag along the vertical track or plate
  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !onChange || !trackRef.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);

      const updateValue = (clientY: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        // clientY is distance from top, so inverted (bottom = min, top = max)
        const ratio = 1 - (clientY - rect.top) / rect.height;
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        const raw = min + clampedRatio * (max - min);
        const stepped = Math.round(raw / step) * step;
        const finalVal = Number(Math.min(Math.max(stepped, min), max).toFixed(decimals));
        lastCommittedValRef.current = finalVal;
        lastCommitTimeRef.current = Date.now();
        setInputText(finalVal.toFixed(decimals));
        onChange(finalVal);
      };

      updateValue(e.clientY);

      const onPointerMove = (moveEvent: PointerEvent) => {
        updateValue(moveEvent.clientY);
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [enabled, min, max, step, decimals, onChange]
  );

  // Spinner Increment
  const handleIncrement = useCallback(() => {
    if (!enabled || !onChange) return;
    const next = Math.min(max, clampedVal + step);
    const finalVal = Number(next.toFixed(decimals));
    lastCommittedValRef.current = finalVal;
    lastCommitTimeRef.current = Date.now();
    setInputText(finalVal.toFixed(decimals));
    onChange(finalVal);
  }, [enabled, onChange, max, clampedVal, step, decimals]);

  // Spinner Decrement
  const handleDecrement = useCallback(() => {
    if (!enabled || !onChange) return;
    const next = Math.max(min, clampedVal - step);
    const finalVal = Number(next.toFixed(decimals));
    lastCommittedValRef.current = finalVal;
    lastCommitTimeRef.current = Date.now();
    setInputText(finalVal.toFixed(decimals));
    onChange(finalVal);
  }, [enabled, onChange, min, clampedVal, step, decimals]);

  // Support click-and-hold auto-repeat on spinner buttons
  const startRepeat = (action: () => void) => {
    action();
    const timeout = window.setTimeout(() => {
      repeatRef.current = window.setInterval(action, 75);
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

  return (
    <div className={`labview-slider-item ${enabled ? 'enabled' : 'disabled'}`}>
      {/* Title Centered at Top */}
      <div className="slider-title" title={label}>
        {label}
      </div>

      {/* Controls Row: Uniform width for exact grid column alignment */}
      <div className="slider-controls-row">
        {/* ── Compact Slider Bezel Plate ─────────────────────────── */}
        <div className="slider-plate" onPointerDown={handleTrackPointerDown}>
          {/* Scale Labels & Marks on Left */}
          <div className="slider-scale">
            {ticks.map((tick) => {
              const tickPercent = max > min ? ((tick - min) / (max - min)) * 100 : 0;
              return (
                <div
                  key={tick}
                  className="scale-mark"
                  style={{ bottom: `${tickPercent}%` }}
                >
                  <span className="tick-number">{tick}</span>
                  <span className="tick-dash" />
                </div>
              );
            })}
          </div>

          {/* Vertical Track Groove */}
          <div ref={trackRef} className="slider-track">
            {/* Vivid Amber/Golden Active Fill Bar */}
            <div
              className="slider-fill"
              style={{ height: `${percent}%` }}
            />

            {/* Pointer Thumb attached to right edge of track, pointing Left (◄) */}
            <div
              className="slider-thumb"
              style={{ bottom: `${percent}%` }}
            >
              <svg
                width="8"
                height="10"
                viewBox="0 0 8 10"
                className="thumb-pointer-svg"
              >
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

        {/* ── Digital Spinner Box (Snug next to plate, aligned at top) ── */}
        <div className="digital-spinner-box">
          {/* Spinners on Left (Up ▲ and Down ▼) */}
          <div className="spinner-controls">
            <button
              type="button"
              className="spinner-btn spinner-up"
              onMouseDown={(e) => {
                e.preventDefault();
                startRepeat(handleIncrement);
              }}
              disabled={!enabled || clampedVal >= max}
              tabIndex={-1}
              aria-label="Increase"
            >
              ▲
            </button>
            <button
              type="button"
              className="spinner-btn spinner-down"
              onMouseDown={(e) => {
                e.preventDefault();
                startRepeat(handleDecrement);
              }}
              disabled={!enabled || clampedVal <= min}
              tabIndex={-1}
              aria-label="Decrease"
            >
              ▼
            </button>
          </div>

          {/* Sunken White Numeric Input Box on Right (Covers max number width) */}
          <input
            type="text"
            className="digital-input"
            value={inputText}
            disabled={!enabled}
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
                if (!enabled || !onChange) return;
                const currentNum = parseFloat(inputText);
                const base = isNaN(currentNum) ? clampedVal : currentNum;
                const next = Math.min(max, base + step);
                const stepped = Math.round(next / step) * step;
                const finalVal = Number(Math.min(max, Math.max(min, stepped)).toFixed(decimals));
                const formatted = finalVal.toFixed(decimals);
                lastCommittedValRef.current = finalVal;
                lastCommitTimeRef.current = Date.now();
                setInputText(formatted);
                onChange(finalVal);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!enabled || !onChange) return;
                const currentNum = parseFloat(inputText);
                const base = isNaN(currentNum) ? clampedVal : currentNum;
                const next = Math.max(min, base - step);
                const stepped = Math.round(next / step) * step;
                const finalVal = Number(Math.min(max, Math.max(min, stepped)).toFixed(decimals));
                const formatted = finalVal.toFixed(decimals);
                lastCommittedValRef.current = finalVal;
                lastCommitTimeRef.current = Date.now();
                setInputText(formatted);
                onChange(finalVal);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
