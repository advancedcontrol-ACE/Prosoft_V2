// ============================================================
// Service to query dynamically available system COM Ports
// ============================================================

export async function fetchAvailablePorts(): Promise<string[]> {
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
        return data;
      }
    }
  } catch {
    // ignore
  }

  // Fallback: Check Web Serial API granted ports if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny = navigator as any;
    if (navAny.serial && typeof navAny.serial.getPorts === 'function') {
      const ports = await navAny.serial.getPorts();
      if (ports && ports.length > 0) {
        return ports.map((_: unknown, idx: number) => `COM${idx + 1}`);
      }
    }
  } catch {
    // ignore
  }

  return [];
}
