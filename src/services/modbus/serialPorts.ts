// ============================================================
// Service to query dynamically available system COM Ports
// ============================================================

import { hardwareSimulator } from '../hardwareSimulator';

export async function fetchAvailablePorts(): Promise<string[]> {
  const result: string[] = [];

  try {
    const res = await fetch(`/api/ports?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        result.push(...data);
      }
    }
  } catch {
    // ignore
  }

  // Fallback: Check Web Serial API granted ports if available
  if (result.length === 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navAny = navigator as any;
      if (navAny.serial && typeof navAny.serial.getPorts === 'function') {
        const ports = await navAny.serial.getPorts();
        if (ports && ports.length > 0) {
          result.push(...ports.map((_: unknown, idx: number) => `COM${idx + 1}`));
        }
      }
    } catch {
      // ignore
    }
  }

  // If Hardware Simulator is active, ensure virtual COM port is available
  if (hardwareSimulator.isActive && !result.some((p) => p.includes('Simulator'))) {
    result.unshift('COM1 (Simulator)');
  }

  return result;
}
