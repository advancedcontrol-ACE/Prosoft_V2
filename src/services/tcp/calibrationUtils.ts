// ============================================================
// ACE 2007 DAQ Calibration & Channel Mapping Utilities
// ============================================================

export type TransmitterRange = '4-20mA' | '4-12mA' | '12-20mA';

export interface CalibrationPoint {
  trueValue: number;
  measuredValue: number;
}

export interface ChannelCalibration {
  slope: number;
  offset: number;
  rSquared: number;
  points: CalibrationPoint[];
}

export type IpOption = 'IP0' | 'IP1' | 'IP2' | 'IP3' | 'Not Used';

export interface MappingRow {
  pv: 'PV0' | 'PV1' | 'PV2' | 'PV3';
  ip: IpOption;
}

export interface CalibrationConfig {
  transmitters: {
    ip0: TransmitterRange;
    ip1: TransmitterRange;
    ip2: TransmitterRange;
    ip3: TransmitterRange;
  };
  mappingRows: MappingRow[];
  mappings: {
    pv0: 'ip0' | 'ip1' | 'ip2' | 'ip3' | 'not_used';
    pv1: 'ip0' | 'ip1' | 'ip2' | 'ip3' | 'not_used';
    pv2: 'ip0' | 'ip1' | 'ip2' | 'ip3' | 'not_used';
    pv3: 'ip0' | 'ip1' | 'ip2' | 'ip3' | 'not_used';
  };
  calibrations: {
    ip0: ChannelCalibration;
    ip1: ChannelCalibration;
    ip2: ChannelCalibration;
    ip3: ChannelCalibration;
  };
}

export const STANDARD_TRUE_VALUES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const SAMPLE_FIGURE2_MEASURED = {
  ip0: [2, 12, 23, 32, 40, 53, 60, 73, 80, 92, 100],
  ip1: [0, 10, 20, 33, 40, 54, 60, 70, 80, 90, 100],
  ip2: [0, 10, 24, 30, 40, 52, 60, 70, 82, 90, 100],
  ip3: [0, 14, 20, 30, 42, 52, 62, 73, 80, 90, 100],
};

export function createDefaultPoints(chKey?: 'ip0' | 'ip1' | 'ip2' | 'ip3'): CalibrationPoint[] {
  const measuredArr = chKey ? SAMPLE_FIGURE2_MEASURED[chKey] : null;
  return STANDARD_TRUE_VALUES.map((v, i) => ({
    trueValue: v,
    measuredValue: measuredArr ? measuredArr[i] : v,
  }));
}

export function createDefaultChannelCalibration(chKey?: 'ip0' | 'ip1' | 'ip2' | 'ip3'): ChannelCalibration {
  const points = createDefaultPoints(chKey);
  const reg = calculateLinearRegression(points);
  return {
    slope: reg.slope,
    offset: reg.offset,
    rSquared: reg.rSquared,
    points,
  };
}

export const DEFAULT_MAPPING_ROWS: MappingRow[] = [
  { pv: 'PV0', ip: 'IP0' },
  { pv: 'PV1', ip: 'Not Used' },
  { pv: 'PV2', ip: 'Not Used' },
  { pv: 'PV3', ip: 'Not Used' },
];

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  transmitters: {
    ip0: '4-20mA',
    ip1: '4-20mA',
    ip2: '4-20mA',
    ip3: '4-20mA',
  },
  mappingRows: DEFAULT_MAPPING_ROWS,
  mappings: {
    pv0: 'ip0',
    pv1: 'not_used',
    pv2: 'not_used',
    pv3: 'not_used',
  },
  calibrations: {
    ip0: createDefaultChannelCalibration('ip0'),
    ip1: createDefaultChannelCalibration('ip1'),
    ip2: createDefaultChannelCalibration('ip2'),
    ip3: createDefaultChannelCalibration('ip3'),
  },
};

/**
 * Helper to determine which IP channel is currently mapped to a given PV channel.
 * Returns null if the channel is 'Not Used'.
 */
export function getChannelForPv(
  config: CalibrationConfig,
  pv: string
): 'ip0' | 'ip1' | 'ip2' | 'ip3' | null {
  const normPv = pv.toUpperCase();
  const row = config.mappingRows?.find((r) => r.pv.toUpperCase() === normPv);
  if (row) {
    if (row.ip === 'Not Used') return null;
    return row.ip.toLowerCase() as 'ip0' | 'ip1' | 'ip2' | 'ip3';
  }
  const key = normPv.toLowerCase() as 'pv0' | 'pv1' | 'pv2' | 'pv3';
  const val = config.mappings?.[key];
  if (!val || val === 'not_used') return null;
  return val as 'ip0' | 'ip1' | 'ip2' | 'ip3';
}

/**
 * Check if a physical terminal IP channel is mapped to any PV variable.
 */
export function isIpChannelUsed(
  config: CalibrationConfig | undefined,
  chKey: 'ip0' | 'ip1' | 'ip2' | 'ip3'
): boolean {
  if (!config) return chKey === 'ip0';
  if (!config.mappingRows || config.mappingRows.length === 0) {
    return chKey === 'ip0';
  }
  return config.mappingRows.some(
    (r) => r.ip !== 'Not Used' && r.ip.toLowerCase() === chKey
  );
}

/**
 * Format live channel display data based on terminal usage and open circuit (9999).
 */
export function getChannelDisplayData(
  chKey: 'ip0' | 'ip1' | 'ip2' | 'ip3',
  config: CalibrationConfig | undefined,
  rawAdc?: number,
  fallbackVal?: number
): { text: string; pct: number; isUnusedOrOpen: boolean } {
  const isUsed = isIpChannelUsed(config, chKey);
  // Open circuit hardware code 9999 or unmapped terminal
  if (!isUsed || rawAdc === 9999) {
    return { text: '---', pct: 0, isUnusedOrOpen: true };
  }
  if (rawAdc !== undefined && rawAdc !== null) {
    const range = config?.transmitters?.[chKey] || '4-20mA';
    const cal = config?.calibrations?.[chKey];
    const val = rawAdcToCalibrated(rawAdc, range, cal);
    return { text: val.toFixed(1), pct: val, isUnusedOrOpen: false };
  }
  if (fallbackVal !== undefined && fallbackVal !== null && fallbackVal >= 0) {
    return { text: fallbackVal.toFixed(1), pct: fallbackVal, isUnusedOrOpen: false };
  }
  return { text: '---', pct: 0, isUnusedOrOpen: true };
}

/**
 * Least-squares linear regression:
 * True = Slope * Measured + Offset
 */
export function calculateLinearRegression(points: CalibrationPoint[]): {
  slope: number;
  offset: number;
  rSquared: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 1.0, offset: 0.0, rSquared: 1.0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of points) {
    const x = Number(p.measuredValue) || 0;
    const y = Number(p.trueValue) || 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-9) {
    return { slope: 1.0, offset: 0.0, rSquared: 1.0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const offset = (sumY - slope * sumX) / n;

  // Correlation coefficient R^2
  const yDenominator = n * sumY2 - sumY * sumY;
  let rSquared = 1.0;
  if (yDenominator > 1e-9) {
    const numerator = n * sumXY - sumX * sumY;
    rSquared = Math.min(1.0, Math.max(0.0, (numerator * numerator) / (denominator * yDenominator)));
  }

  return {
    slope: Number(slope.toFixed(4)),
    offset: Number(offset.toFixed(4)),
    rSquared: Number(rSquared.toFixed(4)),
  };
}

/**
 * Get ADC counts min and max based on transmitter range:
 * - 4-20mA: 4mA ≈ 819, 20mA ≈ 4095
 * - 4-12mA: 4mA ≈ 819, 12mA ≈ 2047
 * - 12-20mA: 12mA ≈ 2047, 20mA ≈ 4095
 */
export function getTransmitterAdcSpan(range: TransmitterRange): { minAdc: number; maxAdc: number } {
  switch (range) {
    case '4-12mA':
      return { minAdc: 819, maxAdc: 2047 };
    case '12-20mA':
      return { minAdc: 2047, maxAdc: 4095 };
    case '4-20mA':
    default:
      return { minAdc: 819, maxAdc: 4095 };
  }
}

/**
 * Convert raw ADC count (0-4095) to calibrated percentage (0-100%):
 * 1. Checks open circuit (9999 -> 0%)
 * 2. Scales ADC into transmitter span [minAdc, maxAdc] -> measured percentage
 * 3. Applies linear calibration: Calibrated = Slope * measured + Offset
 */
export function rawAdcToCalibrated(
  rawAdc: number,
  range: TransmitterRange = '4-20mA',
  calibration?: ChannelCalibration
): number {
  if (rawAdc === 9999 || isNaN(rawAdc) || rawAdc === undefined || rawAdc === null) {
    return 0.0;
  }

  const { minAdc, maxAdc } = getTransmitterAdcSpan(range);
  const span = Math.max(1, maxAdc - minAdc);

  // Raw percentage before calibration (0-100%)
  const rawPct = Math.max(0, Math.min(100, ((rawAdc - minAdc) / span) * 100));

  if (!calibration) {
    return Number(rawPct.toFixed(2));
  }

  // Apply calibration slope & offset
  const slope = typeof calibration.slope === 'number' ? calibration.slope : 1.0;
  const offset = typeof calibration.offset === 'number' ? calibration.offset : 0.0;

  const calibrated = slope * rawPct + offset;
  return Number(Math.max(0, Math.min(100, calibrated)).toFixed(2));
}

/**
 * Convert raw ADC count (0-4095) to corresponding current in mA:
 * - 4-20mA: 819 -> 4.00 mA, 4095 -> 20.00 mA
 * - 4-12mA: 819 -> 4.00 mA, 2047 -> 12.00 mA
 * - 12-20mA: 2047 -> 12.00 mA, 4095 -> 20.00 mA
 */
export function rawAdcToMa(
  rawAdc: number,
  range: TransmitterRange = '4-20mA'
): number {
  if (rawAdc === 9999 || isNaN(rawAdc) || rawAdc === undefined || rawAdc === null) {
    return 0.0;
  }

  const { minAdc, maxAdc } = getTransmitterAdcSpan(range);
  const span = Math.max(1, maxAdc - minAdc);

  let minMa = 4.0;
  let maxMa = 20.0;
  if (range === '4-12mA') {
    minMa = 4.0;
    maxMa = 12.0;
  } else if (range === '12-20mA') {
    minMa = 12.0;
    maxMa = 20.0;
  }

  const ma = minMa + ((rawAdc - minAdc) / span) * (maxMa - minMa);
  return Number(Math.max(0, Math.min(25, ma)).toFixed(2));
}
