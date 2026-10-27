import React, { useState } from 'react';
import './CalibrationPanel.css';
import {
  type CalibrationConfig,
  type TransmitterRange,
  type MappingRow,
  type IpOption,
  calculateLinearRegression,
  createDefaultPoints,
  DEFAULT_CALIBRATION_CONFIG,
  rawAdcToCalibrated,
  rawAdcToMa,
} from '../../services/tcp/calibrationUtils';

interface CalibrationPanelProps {
  config: CalibrationConfig;
  onChange: (config: CalibrationConfig) => void;
  onSave: (config: CalibrationConfig) => Promise<void> | void;
  rawInputs?: {
    ip0?: number;
    ip1?: number;
    ip2?: number;
    ip3?: number;
  };
}

const CHANNELS: Array<'ip0' | 'ip1' | 'ip2' | 'ip3'> = ['ip0', 'ip1', 'ip2', 'ip3'];
const CHANNEL_LABELS: Record<'ip0' | 'ip1' | 'ip2' | 'ip3', string> = {
  ip0: 'IP 0',
  ip1: 'IP 1',
  ip2: 'IP 2',
  ip3: 'IP 3',
};

const PV_OPTIONS: Array<'PV0' | 'PV1' | 'PV2' | 'PV3'> = ['PV0', 'PV1', 'PV2', 'PV3'];
const IP_OPTIONS: IpOption[] = ['IP0', 'IP1', 'IP2', 'IP3', 'Not Used'];
const RANGE_OPTIONS: TransmitterRange[] = ['4-20mA', '4-12mA', '12-20mA'];

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  config,
  onChange,
  onSave,
  rawInputs,
}) => {
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'info') => {
    setFeedback({ text, type });
    window.setTimeout(() => setFeedback(null), 3000);
  };

  // ── Cell 1x1: Transmitter Range Handler ───────────────────
  const handleRangeChange = (ch: 'ip0' | 'ip1' | 'ip2' | 'ip3', range: TransmitterRange) => {
    const updated: CalibrationConfig = {
      ...config,
      transmitters: {
        ...config.transmitters,
        [ch]: range,
      },
    };
    onChange(updated);
  };

  // ── Cell 1x1: Channel Mapping Handlers ─────────────────────
  const handleMappingPvChange = (index: number, newPv: 'PV0' | 'PV1' | 'PV2' | 'PV3') => {
    const currentRows: MappingRow[] = config.mappingRows && config.mappingRows.length === 4
      ? [...config.mappingRows]
      : [...DEFAULT_CALIBRATION_CONFIG.mappingRows];

    currentRows[index] = { ...currentRows[index], pv: newPv };

    // Sync direct mappings object
    const newMappings = { ...config.mappings };
    currentRows.forEach((r) => {
      const pvKey = r.pv.toLowerCase() as 'pv0' | 'pv1' | 'pv2' | 'pv3';
      const ipKey = r.ip.toLowerCase() as 'ip0' | 'ip1' | 'ip2' | 'ip3';
      newMappings[pvKey] = ipKey;
    });

    onChange({
      ...config,
      mappingRows: currentRows,
      mappings: newMappings,
    });
  };

  const handleMappingIpChange = (index: number, newIp: IpOption) => {
    const currentRows: MappingRow[] = config.mappingRows && config.mappingRows.length === 4
      ? [...config.mappingRows]
      : [...DEFAULT_CALIBRATION_CONFIG.mappingRows];

    currentRows[index] = { ...currentRows[index], ip: newIp };

    // Sync direct mappings object
    const newMappings = { ...config.mappings };
    currentRows.forEach((r) => {
      const pvKey = r.pv.toLowerCase() as 'pv0' | 'pv1' | 'pv2' | 'pv3';
      const ipKey = r.ip === 'Not Used' ? 'not_used' : (r.ip.toLowerCase() as 'ip0' | 'ip1' | 'ip2' | 'ip3');
      newMappings[pvKey] = ipKey;
    });

    onChange({
      ...config,
      mappingRows: currentRows,
      mappings: newMappings,
    });
  };

  // ── Cell 2x1: Measured Value Input Handler ────────────────
  const handleMeasuredChange = (
    ch: 'ip0' | 'ip1' | 'ip2' | 'ip3',
    index: number,
    valStr: string
  ) => {
    const num = valStr === '' ? 0 : Number(valStr);
    const chCal = config.calibrations[ch];
    const newPoints = chCal.points.map((p, i) =>
      i === index ? { ...p, measuredValue: num } : p
    );

    const updated: CalibrationConfig = {
      ...config,
      calibrations: {
        ...config.calibrations,
        [ch]: {
          ...chCal,
          points: newPoints,
        },
      },
    };
    onChange(updated);
  };

  // ── Cell 3x1: Calibrate (Recalculate Slope & Offset) ───────
  const handleCalibrate = () => {
    const updatedCalibrations = { ...config.calibrations };

    CHANNELS.forEach((ch) => {
      const chCal = updatedCalibrations[ch];
      const reg = calculateLinearRegression(chCal.points);
      updatedCalibrations[ch] = {
        ...chCal,
        slope: reg.slope,
        offset: reg.offset,
        rSquared: reg.rSquared,
      };
    });

    const updatedConfig: CalibrationConfig = {
      ...config,
      calibrations: updatedCalibrations,
    };
    onChange(updatedConfig);
    showToast('Slopes & offsets calculated!', 'info');
  };

  // ── Cell 3x1: Save Calibration ─────────────────────────────
  const handleSave = async () => {
    const updatedCalibrations = { ...config.calibrations };
    CHANNELS.forEach((ch) => {
      const chCal = updatedCalibrations[ch];
      const reg = calculateLinearRegression(chCal.points);
      updatedCalibrations[ch] = {
        ...chCal,
        slope: reg.slope,
        offset: reg.offset,
        rSquared: reg.rSquared,
      };
    });

    const finalConfig: CalibrationConfig = {
      ...config,
      calibrations: updatedCalibrations,
    };

    onChange(finalConfig);
    await onSave(finalConfig);
    showToast('Calibration saved to disk!', 'success');
  };

  // ── Cell 3x1: Reset to Defaults ────────────────────────────
  const handleReset = () => {
    if (window.confirm('Reset all calibration settings and mappings to defaults?')) {
      onChange(DEFAULT_CALIBRATION_CONFIG);
      showToast('Restored default parameters', 'info');
    }
  };

  const rows = config.mappingRows && config.mappingRows.length === 4
    ? config.mappingRows
    : DEFAULT_CALIBRATION_CONFIG.mappingRows;

  // Calculate live input percentage based on configured transmitter range and calibration
  const getPercentVal = (ch: 'ip0' | 'ip1' | 'ip2' | 'ip3') => {
    const raw = rawInputs?.[ch];
    if (raw === undefined || raw === null || isNaN(raw) || raw === 9999) return '----';
    const range = config.transmitters[ch] || '4-20mA';
    const cal = config.calibrations[ch];
    const pct = rawAdcToCalibrated(raw, range, cal);
    return `${pct.toFixed(2)}%`;
  };

  // Calculate live input mA based on configured transmitter range
  const getMaVal = (ch: 'ip0' | 'ip1' | 'ip2' | 'ip3') => {
    const raw = rawInputs?.[ch];
    if (raw === undefined || raw === null || isNaN(raw) || raw === 9999) return '----';
    const range = config.transmitters[ch] || '4-20mA';
    const ma = rawAdcToMa(raw, range);
    return `${ma.toFixed(2)} mA`;
  };

  return (
    <div className="calibration-container">
      {/* ============================================================
          CELL 1 x 1: Top Row (Transmitter & Channel Map Frames)
          Shifted towards left (no large gaps)
          ============================================================ */}
      <div className="cal-cell-1x1">
        {/* Frame 1: Transmitter */}
        <div className="cal-subframe transmitter-frame">
          <div className="cal-frame-header">
            <span className="cal-frame-title">📡 Transmitter</span>
          </div>
          <div className="cal-table-wrap">
            <table className="cal-table">
              <tbody>
                {CHANNELS.map((ch) => (
                  <tr key={ch}>
                    <td>
                      <span className="ch-badge">{ch.toUpperCase()}</span>
                    </td>
                    <td>
                      <select
                        className="cal-select cal-select-range"
                        value={config.transmitters[ch] || '4-20mA'}
                        onChange={(e) =>
                          handleRangeChange(ch, e.target.value as TransmitterRange)
                        }
                      >
                        {RANGE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Frame 2: Channel Map */}
        <div className="cal-subframe mapping-frame">
          <div className="cal-frame-header">
            <span className="cal-frame-title">🔀 Channel Map</span>
          </div>
          <div className="cal-table-wrap">
            <table className="cal-table">
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="cal-select cal-select-pv"
                        value={row.pv}
                        onChange={(e) =>
                          handleMappingPvChange(
                            idx,
                            e.target.value as 'PV0' | 'PV1' | 'PV2' | 'PV3'
                          )
                        }
                      >
                        {PV_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="cal-select cal-select-ip"
                        value={row.ip}
                        onChange={(e) =>
                          handleMappingIpChange(
                            idx,
                            e.target.value as IpOption
                          )
                        }
                      >
                        {IP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================
          CELL 2 x 1: Middle Row (Calibration Tables - Figure 2)
          Reduced rectangular bordered box size
          ============================================================ */}
      <div className="cal-cell-2x1">
        <div className="cal-cell-2x1-header">
          <div className="cal-frame-title">
            <span>⚖️</span> Calibration Tables (0 - 100%)
          </div>
        </div>

        <div className="cal-columns-grid">
          {CHANNELS.map((ch) => {
            const chCal = config.calibrations[ch] || DEFAULT_CALIBRATION_CONFIG.calibrations[ch];
            const chRange = config.transmitters[ch] || '4-20mA';

            return (
              <div key={ch} className="cal-col-card">
                <div className="cal-col-header">
                  <span>{CHANNEL_LABELS[ch]}</span>
                  <span className="cal-col-header-tag">{chRange}</span>
                </div>

                <div className="cal-col-subtitles">
                  <span>True</span>
                  <span>Meas</span>
                </div>

                <div className="cal-points-list">
                  {(chCal.points || createDefaultPoints(ch)).map((pt, pIdx) => (
                    <div key={pIdx} className="cal-point-row">
                      <div className="lv-true-box">{pt.trueValue}</div>
                      <input
                        type="number"
                        className="lv-measured-input"
                        value={pt.measuredValue}
                        onChange={(e) => handleMeasuredChange(ch, pIdx, e.target.value)}
                        step="any"
                      />
                    </div>
                  ))}
                </div>

                {/* Regression Summary (Figure 2) */}
                <div className="cal-col-stats">
                  <div className="cal-stat-line">
                    <span>Slope:</span>
                    <span className="stat-val">{Number(chCal.slope ?? 1.0).toFixed(4)}</span>
                  </div>
                  <div className="cal-stat-line">
                    <span>Offset:</span>
                    <span className="stat-val">{Number(chCal.offset ?? 0.0).toFixed(4)}</span>
                  </div>
                  <div className="cal-stat-line">
                    <span>R&sup2;:</span>
                    <span className="stat-val">{Number(chCal.rSquared ?? 1.0).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          CELL 3 x 1 (1 x 3): Action Buttons & Live Raw ADC & % Readouts
          Equal sized buttons side by side, Live ADC on next line,
          and Input % values on the third line.
          ============================================================ */}
      <div className="cal-cell-3x1">
        {/* Line 1: All 3 buttons of equal size side by side */}
        <div className="cal-buttons-row">
          <button
            type="button"
            className="cal-btn cal-btn-primary"
            onClick={handleCalibrate}
            title="Calculate linear regression slope and offset for all channels"
          >
            🧮 Calibrate
          </button>

          <button
            type="button"
            className="cal-btn cal-btn-success"
            onClick={handleSave}
            title="Save calibration and channel mappings to computer disk"
          >
            💾 Save Calibration
          </button>

          <button
            type="button"
            className="cal-btn cal-btn-secondary"
            onClick={handleReset}
            title="Reset to factory default calibration points"
          >
            ↺ Reset Defaults
          </button>
        </div>

        {feedback && (
          <div className={`cal-feedback cal-feedback-${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        {/* Line 1: Input % values calculated based on transmitter section */}
        <div className="cal-live-row">
          <span className="cal-live-label">INPUT (%):</span>
          <span className="cal-live-ch">
            IP0: <strong className="pct-val">{getPercentVal('ip0')}</strong>
          </span>
          <span className="cal-live-ch">
            IP1: <strong className="pct-val">{getPercentVal('ip1')}</strong>
          </span>
          <span className="cal-live-ch">
            IP2: <strong className="pct-val">{getPercentVal('ip2')}</strong>
          </span>
          <span className="cal-live-ch">
            IP3: <strong className="pct-val">{getPercentVal('ip3')}</strong>
          </span>
        </div>

        {/* Line 2: Input mA values calculated based on transmitter section */}
        <div className="cal-live-row">
          <span className="cal-live-label">INPUT (mA):</span>
          <span className="cal-live-ch">
            IP0: <strong className="ma-val">{getMaVal('ip0')}</strong>
          </span>
          <span className="cal-live-ch">
            IP1: <strong className="ma-val">{getMaVal('ip1')}</strong>
          </span>
          <span className="cal-live-ch">
            IP2: <strong className="ma-val">{getMaVal('ip2')}</strong>
          </span>
          <span className="cal-live-ch">
            IP3: <strong className="ma-val">{getMaVal('ip3')}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
