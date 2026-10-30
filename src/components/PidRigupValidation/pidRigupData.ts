export type PortType = 'fluid' | 'pneumatic' | 'electrical';

export interface ComponentPort {
  id: string;
  name: string;
  type: PortType;
  direction: 'in' | 'out' | 'inout';
  x: number; // percentage (0-100) or pixel offset on component
  y: number; // percentage (0-100) or pixel offset on component
  signalType?: string; // e.g. '4-20mA', '3-15psi', 'Air Supply', 'Water Pipe', 'Process Fluid'
}

export interface LibraryComponentDef {
  typeId: string;
  name: string;
  tag: string;
  category: 'tanks' | 'pumps' | 'valves' | 'transmitters' | 'controllers' | 'accessories';
  description: string;
  ports: ComponentPort[];
  defaultWidth: number;
  defaultHeight: number;
}

export interface PlacedComponent {
  id: string;
  typeId: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
}

export interface WireConnection {
  id: string;
  fromCompId: string;
  fromPortId: string;
  toCompId: string;
  toPortId: string;
  type: PortType;
  color?: string; // Optional custom color override (e.g. '#10b981', '#0284c7', '#f59e0b', '#dc2626')
  midOffset?: number; // Legacy or primary offset
  midOffsetX?: number; // Movable vertical segment offset (drag horizontal)
  midOffsetY?: number; // Movable horizontal segment offset (drag vertical)
  routeStyle?: 'orthogonal-h' | 'orthogonal-v' | 'curved';
}

export interface ProcessLoopDef {
  id: string;
  name: string;
  category: string;
  objective: string;
  description: string;
  requiredComponents: { typeId: string; count: number; name: string }[];
  expectedConnections: {
    fromTypeId: string;
    fromPortId: string;
    toTypeId: string;
    toPortId: string;
    type: PortType;
    desc: string;
  }[];
  pidRules: string[];
}

// ── Complete Industrial P&ID Library Component Catalog ───────────────
export const LIBRARY_COMPONENTS: LibraryComponentDef[] = [
  // 1. Tanks & Vessels
  {
    typeId: 'process-tank',
    name: 'Process Tank',
    tag: 'T-101',
    category: 'tanks',
    description: 'Graduated transparent acrylic tank with overflow weir and bottom outlet drain.',
    defaultWidth: 100,
    defaultHeight: 120,
    ports: [
      { id: 'inlet', name: 'Inlet Pipe', type: 'fluid', direction: 'in', x: 25, y: 0, signalType: 'Water Pipe' },
      { id: 'overflow', name: 'Overflow Drain', type: 'fluid', direction: 'out', x: 100, y: 35, signalType: 'Water Pipe' },
      { id: 'bottom-outlet', name: 'Bottom Discharge', type: 'fluid', direction: 'out', x: 75, y: 100, signalType: 'Water Pipe' },
      { id: 'tap-lt', name: 'Hydrostatic Tap', type: 'fluid', direction: 'out', x: 0, y: 85, signalType: 'Hydrostatic Tap' },
    ],
  },
  {
    typeId: 'sump-tank',
    name: 'Sump Water Tank',
    tag: 'T-102',
    category: 'tanks',
    description: 'Reservoir buffer tank supplying recirculation pump and receiving drain return.',
    defaultWidth: 120,
    defaultHeight: 70,
    ports: [
      { id: 'drain-return', name: 'Drain Return', type: 'fluid', direction: 'in', x: 30, y: 0, signalType: 'Water Pipe' },
      { id: 'pump-suction', name: 'Pump Suction Nozzle', type: 'fluid', direction: 'out', x: 80, y: 0, signalType: 'Water Pipe' },
    ],
  },
  {
    typeId: 'heated-tank',
    name: 'Heated Process Tank',
    tag: 'T-103',
    category: 'tanks',
    description: 'Thermally insulated fluid tank with internal immersion heater element.',
    defaultWidth: 100,
    defaultHeight: 120,
    ports: [
      { id: 'fluid-in', name: 'Fluid Inlet', type: 'fluid', direction: 'in', x: 30, y: 0, signalType: 'Water Pipe' },
      { id: 'fluid-out', name: 'Fluid Discharge', type: 'fluid', direction: 'out', x: 70, y: 100, signalType: 'Water Pipe' },
      { id: 'heater-pwr', name: 'Heater Power Input', type: 'electrical', direction: 'in', x: 100, y: 50, signalType: '230VAC / SSR' },
      { id: 'rtd-well', name: 'Thermowell Port', type: 'fluid', direction: 'out', x: 0, y: 65, signalType: 'Thermowell' },
    ],
  },

  // 2. Pumps & Actuators
  {
    typeId: 'centrifugal-pump',
    name: 'Centrifugal Pump',
    tag: 'P-101',
    category: 'pumps',
    description: 'Monoblock centrifugal water pump providing process flow.',
    defaultWidth: 80,
    defaultHeight: 70,
    ports: [
      { id: 'suction', name: 'Suction Inlet', type: 'fluid', direction: 'in', x: 0, y: 55, signalType: 'Water Pipe' },
      { id: 'discharge', name: 'Discharge Outlet', type: 'fluid', direction: 'out', x: 65, y: 0, signalType: 'Water Pipe' },
      { id: 'power', name: 'Motor Power Supply', type: 'electrical', direction: 'in', x: 100, y: 40, signalType: '230VAC' },
    ],
  },

  // 3. Valves
  {
    typeId: 'control-valve',
    name: 'Pneumatic Control Valve',
    tag: 'CV-101',
    category: 'valves',
    description: 'Equal percentage globe valve with pneumatic diaphragm spring actuator.',
    defaultWidth: 70,
    defaultHeight: 90,
    ports: [
      { id: 'inlet', name: 'Process Pipe Inlet', type: 'fluid', direction: 'in', x: 0, y: 78, signalType: 'Water Pipe' },
      { id: 'outlet', name: 'Process Pipe Outlet', type: 'fluid', direction: 'out', x: 100, y: 78, signalType: 'Water Pipe' },
      { id: 'air-in', name: 'Actuator Air Signal', type: 'pneumatic', direction: 'in', x: 50, y: 0, signalType: '3-15 psi' },
    ],
  },
  {
    typeId: 'manual-valve',
    name: 'Manual Gate / Ball Valve',
    tag: 'HV-101',
    category: 'valves',
    description: 'Hand-operated shut-off and throttling drain/bypass valve.',
    defaultWidth: 60,
    defaultHeight: 50,
    ports: [
      { id: 'inlet', name: 'Process Fluid In', type: 'fluid', direction: 'in', x: 0, y: 55, signalType: 'Water Pipe' },
      { id: 'outlet', name: 'Process Fluid Out', type: 'fluid', direction: 'out', x: 100, y: 55, signalType: 'Water Pipe' },
    ],
  },

  // 3b. Piping & Line Pieces (Movable pipe pieces)
  {
    typeId: 'pipe-horizontal',
    name: 'Horizontal Pipe',
    tag: 'PIPE-H',
    category: 'valves',
    description: 'Straight horizontal process fluid pipe piece with flanged connections.',
    defaultWidth: 120,
    defaultHeight: 28,
    ports: [
      { id: 'p-in', name: 'Pipe Port A', type: 'fluid', direction: 'inout', x: 0, y: 50, signalType: 'Water Pipe' },
      { id: 'p-out', name: 'Pipe Port B', type: 'fluid', direction: 'inout', x: 100, y: 50, signalType: 'Water Pipe' },
    ],
  },
  {
    typeId: 'pipe-vertical',
    name: 'Vertical Pipe',
    tag: 'PIPE-V',
    category: 'valves',
    description: 'Straight vertical process fluid pipe piece with flanged connections.',
    defaultWidth: 28,
    defaultHeight: 120,
    ports: [
      { id: 'p-in', name: 'Pipe Port Top', type: 'fluid', direction: 'inout', x: 50, y: 0, signalType: 'Water Pipe' },
      { id: 'p-out', name: 'Pipe Port Bottom', type: 'fluid', direction: 'inout', x: 50, y: 100, signalType: 'Water Pipe' },
    ],
  },
  {
    typeId: 'pipe-elbow',
    name: '90° Elbow Pipe',
    tag: 'ELBOW',
    category: 'valves',
    description: '90-degree corner elbow pipe fitting for routing pipelines around equipment.',
    defaultWidth: 60,
    defaultHeight: 60,
    ports: [
      { id: 'p-in', name: 'Elbow Side Port', type: 'fluid', direction: 'inout', x: 0, y: 50, signalType: 'Water Pipe' },
      { id: 'p-out', name: 'Elbow Bottom Port', type: 'fluid', direction: 'inout', x: 50, y: 100, signalType: 'Water Pipe' },
    ],
  },
  {
    typeId: 'pipe-tee',
    name: 'Tee Junction Pipe',
    tag: 'TEE-FIT',
    category: 'valves',
    description: '3-way T-junction pipe splitter for branch flows and return lines.',
    defaultWidth: 70,
    defaultHeight: 50,
    ports: [
      { id: 'p-left', name: 'Main Run Left', type: 'fluid', direction: 'inout', x: 0, y: 50, signalType: 'Water Pipe' },
      { id: 'p-right', name: 'Main Run Right', type: 'fluid', direction: 'inout', x: 100, y: 50, signalType: 'Water Pipe' },
      { id: 'p-branch', name: 'Branch Port', type: 'fluid', direction: 'inout', x: 50, y: 100, signalType: 'Water Pipe' },
    ],
  },

  // 4. Converters & Air Supply
  {
    typeId: 'ip-converter',
    name: 'I/P Converter',
    tag: 'FY-101',
    category: 'controllers',
    description: 'Electro-pneumatic transducer converting 4–20 mA current to 3–15 psi proportional air signal.',
    defaultWidth: 75,
    defaultHeight: 75,
    ports: [
      { id: 'air-supply', name: 'Air Supply (20 psi)', type: 'pneumatic', direction: 'in', x: 0, y: 30, signalType: 'Air Supply (20 psi)' },
      { id: 'current-in', name: 'Current Input (4–20 mA)', type: 'electrical', direction: 'in', x: 0, y: 75, signalType: '4–20 mA' },
      { id: 'signal-out', name: 'Pressure Output (3–15 psi)', type: 'pneumatic', direction: 'out', x: 100, y: 45, signalType: '3–15 psi' },
    ],
  },
  {
    typeId: 'air-source',
    name: 'Pneumatic Air Supply',
    tag: 'AS-100',
    category: 'accessories',
    description: 'Regulated instrument air supply filter regulator station (20 psi).',
    defaultWidth: 65,
    defaultHeight: 65,
    ports: [
      { id: 'air-out', name: 'Instrument Air Output', type: 'pneumatic', direction: 'out', x: 100, y: 50, signalType: '20 psi Air Supply' },
    ],
  },

  // 5. Transmitters & Sensors
  {
    typeId: 'level-transmitter',
    name: 'Level Transmitter (LT)',
    tag: 'LT-101',
    category: 'transmitters',
    description: 'Piezoresistive hydrostatic pressure transmitter calibrated 0–250 mmwc head, 4–20 mA output.',
    defaultWidth: 65,
    defaultHeight: 80,
    ports: [
      { id: 'sensor-tap', name: 'Process Fluid Tap', type: 'fluid', direction: 'in', x: 50, y: 100, signalType: 'Hydrostatic Tap' },
      { id: 'current-out', name: 'Process Signal (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 35, signalType: '4–20 mA' },
      { id: 'power', name: '24VDC Loop Power', type: 'electrical', direction: 'in', x: 0, y: 35, signalType: '24VDC' },
    ],
  },
  {
    typeId: 'flow-transmitter',
    name: 'Flow Transmitter / Rotameter (FT)',
    tag: 'FT-101',
    category: 'transmitters',
    description: 'Inline variable area flowmeter / magnetic pulse transmitter with 4–20 mA output.',
    defaultWidth: 60,
    defaultHeight: 90,
    ports: [
      { id: 'fluid-in', name: 'Fluid Inflow', type: 'fluid', direction: 'in', x: 50, y: 100, signalType: 'Water Pipe' },
      { id: 'fluid-out', name: 'Fluid Outflow', type: 'fluid', direction: 'out', x: 50, y: 0, signalType: 'Water Pipe' },
      { id: 'signal-out', name: 'Flow Signal (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 50, signalType: '4–20 mA' },
    ],
  },
  {
    typeId: 'pressure-transmitter',
    name: 'Pressure Transmitter (PT)',
    tag: 'PT-101',
    category: 'transmitters',
    description: 'Ceramic piezoresistive gauge pressure transmitter for pipeline and vessel pressure.',
    defaultWidth: 65,
    defaultHeight: 80,
    ports: [
      { id: 'pressure-tap', name: 'Pressure Tap', type: 'fluid', direction: 'in', x: 50, y: 100, signalType: 'Pressure Tap' },
      { id: 'signal-out', name: 'Pressure Signal (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 35, signalType: '4–20 mA' },
    ],
  },
  {
    typeId: 'temp-transmitter',
    name: 'Temperature Transmitter (TT)',
    tag: 'TT-101',
    category: 'transmitters',
    description: 'RTD Pt100 head-mounted temperature transmitter converting temperature to 4–20 mA.',
    defaultWidth: 65,
    defaultHeight: 80,
    ports: [
      { id: 'probe-in', name: 'RTD Sensor Probe', type: 'fluid', direction: 'in', x: 50, y: 100, signalType: 'Thermowell' },
      { id: 'signal-out', name: 'Temperature Signal (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 35, signalType: '4–20 mA' },
    ],
  },

  // 6. Controllers
  {
    typeId: 'pid-controller',
    name: 'PID Process Controller (Delta DTB / ACE 2007)',
    tag: 'LIC-101',
    category: 'controllers',
    description: 'Digital PID Indicating Controller with PV input, SP tracking, and 4–20 mA / DAC OP output.',
    defaultWidth: 90,
    defaultHeight: 90,
    ports: [
      { id: 'pv-in', name: 'PV Input (4–20 mA / 0–5V)', type: 'electrical', direction: 'in', x: 0, y: 30, signalType: '4–20 mA' },
      { id: 'cascade-sp-in', name: 'Remote SP In (4–20 mA)', type: 'electrical', direction: 'in', x: 0, y: 70, signalType: '4–20 mA' },
      { id: 'op-out', name: 'MV / OP Output (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 50, signalType: '4–20 mA' },
    ],
  },
  {
    typeId: 'secondary-controller',
    name: 'Secondary Slave Controller (FIC-101)',
    tag: 'FIC-101',
    category: 'controllers',
    description: 'Inner-loop slave flow or pressure controller in cascade control configurations.',
    defaultWidth: 90,
    defaultHeight: 90,
    ports: [
      { id: 'pv-in', name: 'Inner PV In (4–20 mA)', type: 'electrical', direction: 'in', x: 0, y: 30, signalType: '4–20 mA' },
      { id: 'remote-sp-in', name: 'Remote SP In (from Master OP)', type: 'electrical', direction: 'in', x: 0, y: 70, signalType: '4–20 mA' },
      { id: 'op-out', name: 'Slave MV / OP Out (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 50, signalType: '4–20 mA' },
    ],
  },
  {
    typeId: 'ratio-station',
    name: 'Ratio Computing Station (FY)',
    tag: 'FF-101',
    category: 'controllers',
    description: 'Multiplies wild flow input by desired ratio factor to set captive stream flow setpoint.',
    defaultWidth: 80,
    defaultHeight: 80,
    ports: [
      { id: 'wild-flow-in', name: 'Wild Flow (4–20 mA)', type: 'electrical', direction: 'in', x: 0, y: 35, signalType: '4–20 mA' },
      { id: 'ratio-sp-out', name: 'Computed SP Out (4–20 mA)', type: 'electrical', direction: 'out', x: 100, y: 50, signalType: '4–20 mA' },
    ],
  },
];

// ── 7 Standard Process Loops Definitions with Target Topology ────────
export const PROCESS_LOOPS: ProcessLoopDef[] = [
  {
    id: 'level-process',
    name: 'Level Process',
    category: 'Single Loop Feedback',
    objective: 'Rig up a closed-loop Liquid Level Feedback Control system using an Acrylic Process Tank, Centrifugal Pump, Pneumatic Control Valve, Flow Transmitter / Rotameter, I/P Converter, Hydrostatic Level Transmitter, and PID Controller.',
    description: 'Water is pumped from the Sump Tank through the Pneumatic Control Valve and Rotameter into the Process Tank. The Level Transmitter measures liquid head and sends a 4–20 mA signal to the PID Controller. The controller computes OP (4–20 mA) to the I/P Converter, which supplies proportional air (3–15 psi) to actuate the Control Valve.',
    requiredComponents: [
      { typeId: 'sump-tank', count: 1, name: 'Sump Water Tank (T-102)' },
      { typeId: 'centrifugal-pump', count: 1, name: 'Centrifugal Pump (P-101)' },
      { typeId: 'control-valve', count: 1, name: 'Control Valve (CV-101)' },
      { typeId: 'flow-transmitter', count: 1, name: 'Flow Transmitter / Rotameter (FT-101)' },
      { typeId: 'process-tank', count: 1, name: 'Process Tank (T-101)' },
      { typeId: 'level-transmitter', count: 1, name: 'Level Transmitter (LT-101)' },
      { typeId: 'pid-controller', count: 1, name: 'Level Controller (LIC-101)' },
      { typeId: 'ip-converter', count: 1, name: 'I/P Converter (FY-101)' },
      { typeId: 'air-source', count: 1, name: 'Air Supply (AS-100)' },
    ],
    expectedConnections: [
      { fromTypeId: 'sump-tank', fromPortId: 'pump-suction', toTypeId: 'centrifugal-pump', toPortId: 'suction', type: 'fluid', desc: 'Sump suction to pump suction nozzle' },
      { fromTypeId: 'centrifugal-pump', fromPortId: 'discharge', toTypeId: 'control-valve', toPortId: 'inlet', type: 'fluid', desc: 'Pump discharge pipe to control valve inlet' },
      { fromTypeId: 'control-valve', fromPortId: 'outlet', toTypeId: 'flow-transmitter', toPortId: 'fluid-in', type: 'fluid', desc: 'Control valve outlet to Rotameter inflow' },
      { fromTypeId: 'flow-transmitter', fromPortId: 'fluid-out', toTypeId: 'process-tank', toPortId: 'inlet', type: 'fluid', desc: 'Rotameter outflow pipe to Process Tank inlet' },
      { fromTypeId: 'process-tank', fromPortId: 'tap-lt', toTypeId: 'level-transmitter', toPortId: 'sensor-tap', type: 'fluid', desc: 'Process tank bottom hydrostatic tap to LT sensor port' },
      { fromTypeId: 'level-transmitter', fromPortId: 'current-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'LT 4–20 mA output to Controller PV input' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'ip-converter', toPortId: 'current-in', type: 'electrical', desc: 'Controller 4–20 mA OP output to I/P converter current input' },
      { fromTypeId: 'air-source', fromPortId: 'air-out', toTypeId: 'ip-converter', toPortId: 'air-supply', type: 'pneumatic', desc: '20 psi Air Supply to I/P converter supply port' },
      { fromTypeId: 'ip-converter', fromPortId: 'signal-out', toTypeId: 'control-valve', toPortId: 'air-in', type: 'pneumatic', desc: 'I/P 3–15 psi pneumatic signal line to Control Valve actuator dome' },
      { fromTypeId: 'process-tank', fromPortId: 'bottom-outlet', toTypeId: 'sump-tank', toPortId: 'drain-return', type: 'fluid', desc: 'Tank bottom discharge drain return to sump tank' },
    ],
    pidRules: [
      'Level Transmitter sensing line must originate from the bottom hydrostatic pressure tap.',
      'I/P converter must receive 20 psi instrument air supply and deliver 3–15 psi to Control Valve.',
      'Current loop 4–20 mA from Controller OP must wire into I/P current input terminals.',
      'Sump tank recirculation return line must close the fluid cycle.',
    ],
  },
  {
    id: 'flow-process',
    name: 'Flow Process',
    category: 'Single Loop Feedback',
    objective: 'Rig up a high-speed Flow Rate Feedback Loop with inline Flow Transmitter / Rotameter, Control Valve, I/P Converter, and Flow Indicating Controller (FIC).',
    description: 'Pump feeds water through the pneumatic control valve and the inline Flow Transmitter (FT). The flow sensor outputs 4–20 mA to the Flow Controller (FIC), which regulates flow rate via the I/P converter and control valve.',
    requiredComponents: [
      { typeId: 'sump-tank', count: 1, name: 'Sump Water Tank' },
      { typeId: 'centrifugal-pump', count: 1, name: 'Centrifugal Pump' },
      { typeId: 'control-valve', count: 1, name: 'Control Valve' },
      { typeId: 'flow-transmitter', count: 1, name: 'Flow Transmitter (FT)' },
      { typeId: 'pid-controller', count: 1, name: 'Flow Controller (FIC)' },
      { typeId: 'ip-converter', count: 1, name: 'I/P Converter' },
      { typeId: 'air-source', count: 1, name: 'Air Supply' },
    ],
    expectedConnections: [
      { fromTypeId: 'sump-tank', fromPortId: 'pump-suction', toTypeId: 'centrifugal-pump', toPortId: 'suction', type: 'fluid', desc: 'Sump suction to pump suction' },
      { fromTypeId: 'centrifugal-pump', fromPortId: 'discharge', toTypeId: 'control-valve', toPortId: 'inlet', type: 'fluid', desc: 'Pump discharge to control valve' },
      { fromTypeId: 'control-valve', fromPortId: 'outlet', toTypeId: 'flow-transmitter', toPortId: 'fluid-in', type: 'fluid', desc: 'Control valve outlet to Flowmeter fluid inlet' },
      { fromTypeId: 'flow-transmitter', fromPortId: 'fluid-out', toTypeId: 'sump-tank', toPortId: 'drain-return', type: 'fluid', desc: 'Flowmeter discharge return to sump tank' },
      { fromTypeId: 'flow-transmitter', fromPortId: 'signal-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'FT 4–20 mA flow signal to Controller PV in' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'ip-converter', toPortId: 'current-in', type: 'electrical', desc: 'Controller OP (4–20 mA) to I/P current input' },
      { fromTypeId: 'air-source', fromPortId: 'air-out', toTypeId: 'ip-converter', toPortId: 'air-supply', type: 'pneumatic', desc: 'Air supply to I/P converter' },
      { fromTypeId: 'ip-converter', fromPortId: 'signal-out', toTypeId: 'control-valve', toPortId: 'air-in', type: 'pneumatic', desc: 'I/P 3–15 psi output to Control Valve actuator' },
    ],
    pidRules: [
      'Flow transmitter must be installed in series on the discharge line after the control valve.',
      'Flow loop feedback is typically fast-responding with small Ti and high proportional action.',
    ],
  },
  {
    id: 'pressure-process',
    name: 'Pressure Process',
    category: 'Single Loop Feedback',
    objective: 'Establish and validate a Pressure Process Loop regulating pressure across a closed vessel or header using a Pressure Transmitter (PT), Controller, I/P converter, and Control Valve.',
    description: 'Pressure Transmitter senses hydrostatic line pressure and transmits a 4–20 mA PV signal to the Pressure Indicating Controller (PIC). Controller throttles the control valve to maintain target system pressure.',
    requiredComponents: [
      { typeId: 'sump-tank', count: 1, name: 'Sump Tank' },
      { typeId: 'centrifugal-pump', count: 1, name: 'Pump' },
      { typeId: 'control-valve', count: 1, name: 'Control Valve' },
      { typeId: 'pressure-transmitter', count: 1, name: 'Pressure Transmitter (PT)' },
      { typeId: 'pid-controller', count: 1, name: 'Pressure Controller (PIC)' },
      { typeId: 'ip-converter', count: 1, name: 'I/P Converter' },
      { typeId: 'air-source', count: 1, name: 'Air Supply' },
    ],
    expectedConnections: [
      { fromTypeId: 'sump-tank', fromPortId: 'pump-suction', toTypeId: 'centrifugal-pump', toPortId: 'suction', type: 'fluid', desc: 'Sump suction to pump suction' },
      { fromTypeId: 'centrifugal-pump', fromPortId: 'discharge', toTypeId: 'control-valve', toPortId: 'inlet', type: 'fluid', desc: 'Pump discharge to control valve' },
      { fromTypeId: 'control-valve', fromPortId: 'outlet', toTypeId: 'pressure-transmitter', toPortId: 'pressure-tap', type: 'fluid', desc: 'Pipeline pressure tap to PT sensor inlet' },
      { fromTypeId: 'pressure-transmitter', fromPortId: 'signal-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'PT 4–20 mA output to Controller PV input' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'ip-converter', toPortId: 'current-in', type: 'electrical', desc: 'Controller OP output to I/P current input' },
      { fromTypeId: 'air-source', fromPortId: 'air-out', toTypeId: 'ip-converter', toPortId: 'air-supply', type: 'pneumatic', desc: 'Air supply to I/P converter' },
      { fromTypeId: 'ip-converter', fromPortId: 'signal-out', toTypeId: 'control-valve', toPortId: 'air-in', type: 'pneumatic', desc: 'I/P 3–15 psi pneumatic signal to Control Valve' },
    ],
    pidRules: [
      'Pressure transmitter sensing impulse line connects to high-pressure side or vessel header.',
      'Control Valve acts as a backpressure regulator or inlet throttle.',
    ],
  },
  {
    id: 'temperature-process',
    name: 'Temperature Process',
    category: 'Thermal Process Loop',
    objective: 'Rig up a Temperature Control Loop with a Heated Tank, RTD Temperature Transmitter (TT), and Temperature Controller (TIC).',
    description: 'Process fluid in the Heated Tank is sensed by a Pt100 RTD and Temperature Transmitter (TT). The Temperature Indicating Controller (TIC) modulates electric heating power (SSR) to sustain target fluid temperature.',
    requiredComponents: [
      { typeId: 'heated-tank', count: 1, name: 'Heated Process Tank (T-103)' },
      { typeId: 'temp-transmitter', count: 1, name: 'Temperature Transmitter (TT-101)' },
      { typeId: 'pid-controller', count: 1, name: 'Temperature Controller (TIC-101)' },
    ],
    expectedConnections: [
      { fromTypeId: 'heated-tank', fromPortId: 'rtd-well', toTypeId: 'temp-transmitter', toPortId: 'probe-in', type: 'fluid', desc: 'Thermowell immersion probe to Temperature Transmitter' },
      { fromTypeId: 'temp-transmitter', fromPortId: 'signal-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'TT 4–20 mA signal to Controller PV input' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'heated-tank', toPortId: 'heater-pwr', type: 'electrical', desc: 'Controller OP command (4–20 mA / PWM) to Heater Power Unit' },
    ],
    pidRules: [
      'Thermowell must be immersed below liquid level.',
      'Temperature loops feature large thermal inertia and dead-time, requiring derivative action.',
    ],
  },
  {
    id: 'cascade-process',
    name: 'Cascade Process',
    category: 'Advanced Control Architecture',
    objective: 'Implement a Cascade Control Loop (Level-to-Flow or Temperature-to-Flow) where the primary Master Controller sets the setpoint of a fast inner Slave Controller.',
    description: 'The Primary (Master) Level Controller (LIC) calculates the required flow setpoint and passes its OP output to the Secondary (Slave) Flow Controller (FIC) remote SP input. The Slave controller handles supply pressure disturbances directly before they affect the primary tank level.',
    requiredComponents: [
      { typeId: 'process-tank', count: 1, name: 'Process Tank' },
      { typeId: 'sump-tank', count: 1, name: 'Sump Tank' },
      { typeId: 'centrifugal-pump', count: 1, name: 'Pump' },
      { typeId: 'control-valve', count: 1, name: 'Control Valve' },
      { typeId: 'flow-transmitter', count: 1, name: 'Flow Transmitter (Inner Loop)' },
      { typeId: 'level-transmitter', count: 1, name: 'Level Transmitter (Outer Loop)' },
      { typeId: 'pid-controller', count: 1, name: 'Primary Master Controller (LIC)' },
      { typeId: 'secondary-controller', count: 1, name: 'Secondary Slave Controller (FIC)' },
      { typeId: 'ip-converter', count: 1, name: 'I/P Converter' },
      { typeId: 'air-source', count: 1, name: 'Air Supply' },
    ],
    expectedConnections: [
      { fromTypeId: 'process-tank', fromPortId: 'tap-lt', toTypeId: 'level-transmitter', toPortId: 'sensor-tap', type: 'fluid', desc: 'Tank tap to Level Transmitter' },
      { fromTypeId: 'level-transmitter', fromPortId: 'current-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'LT 4–20 mA to Master LIC PV in' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'secondary-controller', toPortId: 'remote-sp-in', type: 'electrical', desc: 'Master LIC OP out (4–20 mA) to Slave FIC Remote SP in' },
      { fromTypeId: 'flow-transmitter', fromPortId: 'signal-out', toTypeId: 'secondary-controller', toPortId: 'pv-in', type: 'electrical', desc: 'Inner FT 4–20 mA flow signal to Slave FIC PV in' },
      { fromTypeId: 'secondary-controller', fromPortId: 'op-out', toTypeId: 'ip-converter', toPortId: 'current-in', type: 'electrical', desc: 'Slave FIC OP out to I/P converter current in' },
      { fromTypeId: 'air-source', fromPortId: 'air-out', toTypeId: 'ip-converter', toPortId: 'air-supply', type: 'pneumatic', desc: 'Air supply to I/P' },
      { fromTypeId: 'ip-converter', fromPortId: 'signal-out', toTypeId: 'control-valve', toPortId: 'air-in', type: 'pneumatic', desc: 'I/P 3–15 psi to Control Valve' },
      { fromTypeId: 'centrifugal-pump', fromPortId: 'discharge', toTypeId: 'control-valve', toPortId: 'inlet', type: 'fluid', desc: 'Pump discharge to valve' },
      { fromTypeId: 'control-valve', fromPortId: 'outlet', toTypeId: 'flow-transmitter', toPortId: 'fluid-in', type: 'fluid', desc: 'Valve outlet to FT' },
      { fromTypeId: 'flow-transmitter', fromPortId: 'fluid-out', toTypeId: 'process-tank', toPortId: 'inlet', type: 'fluid', desc: 'FT outlet to Tank inlet' },
    ],
    pidRules: [
      'Master controller output MUST wire to the Slave controller Remote Setpoint input.',
      'Slave controller OP MUST drive the final control element (I/P converter & valve).',
    ],
  },
  {
    id: 'ratio-control',
    name: 'Ratio Control',
    category: 'Multi-Stream Control',
    objective: 'Rig up a Ratio Control Scheme maintaining a fixed stoichiometric or blending ratio between an uncontrolled Wild Flow Stream and a Controlled Captive Stream.',
    description: 'Wild flow is measured by FT-101. The Ratio Computing Station (FF-101) scales this flow by target ratio factor K and sends the calculated setpoint to the Captive Stream Flow Controller (FIC), which drives the Control Valve.',
    requiredComponents: [
      { typeId: 'flow-transmitter', count: 1, name: 'Wild Stream Flow Transmitter' },
      { typeId: 'ratio-station', count: 1, name: 'Ratio Station (FF-101)' },
      { typeId: 'pid-controller', count: 1, name: 'Captive Flow Controller (FIC)' },
      { typeId: 'control-valve', count: 1, name: 'Captive Stream Control Valve' },
      { typeId: 'ip-converter', count: 1, name: 'I/P Converter' },
      { typeId: 'air-source', count: 1, name: 'Air Supply' },
    ],
    expectedConnections: [
      { fromTypeId: 'flow-transmitter', fromPortId: 'signal-out', toTypeId: 'ratio-station', toPortId: 'wild-flow-in', type: 'electrical', desc: 'Wild FT 4–20 mA signal to Ratio Station' },
      { fromTypeId: 'ratio-station', fromPortId: 'ratio-sp-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'Ratio Station SP out (4–20 mA) to Captive FIC Setpoint' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'ip-converter', toPortId: 'current-in', type: 'electrical', desc: 'Captive FIC OP out to I/P converter' },
      { fromTypeId: 'air-source', fromPortId: 'air-out', toTypeId: 'ip-converter', toPortId: 'air-supply', type: 'pneumatic', desc: 'Air supply to I/P' },
      { fromTypeId: 'ip-converter', fromPortId: 'signal-out', toTypeId: 'control-valve', toPortId: 'air-in', type: 'pneumatic', desc: 'I/P 3–15 psi to Control Valve' },
    ],
    pidRules: [
      'Wild stream flow transmitter connects to Ratio Station (FF-101).',
      'Ratio station generates proportional setpoint for captive flow controller.',
    ],
  },
  {
    id: 'feedforward-control',
    name: 'Feedforward Control',
    category: 'Advanced Disturbance Rejection',
    objective: 'Construct a combined Feedforward + Feedback Control Scheme to counteract measured load disturbances before they manifest in process error.',
    description: 'A load disturbance (e.g. demand outflow or inlet temperature change) is directly measured by an upstream sensor and processed through a feedforward lead-lag model. The feedforward signal is summed with the feedback PID controller output to drive the valve.',
    requiredComponents: [
      { typeId: 'process-tank', count: 1, name: 'Process Tank' },
      { typeId: 'flow-transmitter', count: 1, name: 'Disturbance Flow Transmitter' },
      { typeId: 'level-transmitter', count: 1, name: 'Primary Level Transmitter' },
      { typeId: 'pid-controller', count: 1, name: 'Feedback Controller (LIC)' },
      { typeId: 'ip-converter', count: 1, name: 'I/P Converter' },
      { typeId: 'control-valve', count: 1, name: 'Control Valve' },
      { typeId: 'air-source', count: 1, name: 'Air Supply' },
    ],
    expectedConnections: [
      { fromTypeId: 'process-tank', fromPortId: 'tap-lt', toTypeId: 'level-transmitter', toPortId: 'sensor-tap', type: 'fluid', desc: 'Tank tap to Level Transmitter' },
      { fromTypeId: 'level-transmitter', fromPortId: 'current-out', toTypeId: 'pid-controller', toPortId: 'pv-in', type: 'electrical', desc: 'LT 4–20 mA feedback signal to Controller PV in' },
      { fromTypeId: 'pid-controller', fromPortId: 'op-out', toTypeId: 'ip-converter', toPortId: 'current-in', type: 'electrical', desc: 'Controller combined OP to I/P converter' },
      { fromTypeId: 'air-source', fromPortId: 'air-out', toTypeId: 'ip-converter', toPortId: 'air-supply', type: 'pneumatic', desc: 'Air supply to I/P' },
      { fromTypeId: 'ip-converter', fromPortId: 'signal-out', toTypeId: 'control-valve', toPortId: 'air-in', type: 'pneumatic', desc: 'I/P 3–15 psi to Control Valve' },
    ],
    pidRules: [
      'Feedforward path measures disturbance directly upstream.',
      'Feedback trim loop corrects any steady-state model offsets.',
    ],
  },
];

// ── Validation Engine ────────────────────────────────────────────────
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0 - 100%
  matchedConnections: number;
  totalRequiredConnections: number;
  missingComponents: { typeId: string; name: string; needed: number; have: number }[];
  connectionChecklist: {
    desc: string;
    isSatisfied: boolean;
    type: PortType;
  }[];
  unconnectedPorts: { compTag: string; portName: string }[];
  summaryMessage: string;
}

export function validateRigup(
  loop: ProcessLoopDef,
  placedComponents: PlacedComponent[],
  wires: WireConnection[]
): ValidationResult {
  const missingComponents: { typeId: string; name: string; needed: number; have: number }[] = [];

  // 1. Check Component Availability
  for (const req of loop.requiredComponents) {
    const matching = placedComponents.filter((c) => c.typeId === req.typeId);
    if (matching.length < req.count) {
      missingComponents.push({
        typeId: req.typeId,
        name: req.name,
        needed: req.count,
        have: matching.length,
      });
    }
  }

  // 2. Check Expected Connections
  const connectionChecklist = loop.expectedConnections.map((expected) => {
    const isSatisfied = wires.some((w) => {
      const fromComp = placedComponents.find((c) => c.id === w.fromCompId);
      const toComp = placedComponents.find((c) => c.id === w.toCompId);
      if (!fromComp || !toComp) return false;

      // Check direct or symmetric connection matching types & ports
      const direct =
        fromComp.typeId === expected.fromTypeId &&
        w.fromPortId === expected.fromPortId &&
        toComp.typeId === expected.toTypeId &&
        w.toPortId === expected.toPortId &&
        w.type === expected.type;

      const reverse =
        toComp.typeId === expected.fromTypeId &&
        w.toPortId === expected.fromPortId &&
        fromComp.typeId === expected.toTypeId &&
        w.fromPortId === expected.toPortId &&
        w.type === expected.type;

      return direct || reverse;
    });

    return {
      desc: expected.desc,
      isSatisfied,
      type: expected.type,
    };
  });

  const matchedCount = connectionChecklist.filter((c) => c.isSatisfied).length;
  const totalExpected = connectionChecklist.length;

  // 3. Check for unconnected ports on placed components
  const unconnectedPorts: { compTag: string; portName: string }[] = [];
  for (const comp of placedComponents) {
    const def = LIBRARY_COMPONENTS.find((l) => l.typeId === comp.typeId);
    if (!def) continue;

    for (const port of def.ports) {
      // Is this port involved in any wire?
      const isConnected = wires.some(
        (w) =>
          (w.fromCompId === comp.id && w.fromPortId === port.id) ||
          (w.toCompId === comp.id && w.toPortId === port.id)
      );
      if (!isConnected) {
        unconnectedPorts.push({ compTag: comp.tag, portName: port.name });
      }
    }
  }

  const compPenalty = missingComponents.length > 0 ? (missingComponents.length / loop.requiredComponents.length) * 40 : 0;
  const connScore = totalExpected > 0 ? (matchedCount / totalExpected) * 100 : 0;
  const finalScore = Math.max(0, Math.round(connScore - compPenalty));

  const isValid = missingComponents.length === 0 && matchedCount === totalExpected;

  let summaryMessage = '';
  if (isValid) {
    summaryMessage = `🎉 Excellent! 100% Valid P&ID Rigup for ${loop.name}. All signal lines, pipelines, and pneumatic connections are correct!`;
  } else if (missingComponents.length > 0) {
    summaryMessage = `⚠️ Missing required components: ${missingComponents.map((m) => `${m.name} (${m.have}/${m.needed})`).join(', ')}.`;
  } else {
    summaryMessage = `ℹ️ ${matchedCount} of ${totalExpected} connections verified. Review checklist below to complete the loop.`;
  }

  return {
    isValid,
    score: finalScore,
    matchedConnections: matchedCount,
    totalRequiredConnections: totalExpected,
    missingComponents,
    connectionChecklist,
    unconnectedPorts,
    summaryMessage,
  };
}
