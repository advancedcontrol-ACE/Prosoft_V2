// ============================================================
// ACE Process Control Software — Menu Configuration
// ============================================================
// Central menu data structure. All menu items are defined here.
// To add a new product: add an entry to the relevant items array.
// 'enabled: false' renders the item greyed-out but still visible.
// 'type: separator'  renders a horizontal rule between items.
// ============================================================

export interface MenuItem {
  id: string;
  label: string;
  enabled: boolean;
  type?: 'item' | 'separator';   // default: 'item'
  children?: MenuItem[];
  action?: string;               // route / module key for future navigation
}

export interface TopLevelMenu {
  id: string;
  label: string;
  items: MenuItem[];
}

// ── Shared helper: separator ──────────────────────────────────
const sep = (id: string): MenuItem => ({
  id,
  label: '',
  enabled: false,
  type: 'separator',
});

// ── Controller sub-menus for ACE 101 / 102 / 103 / 104 ───────
// (Figure 2 — common to all four basic single-loop trainers)
const controllerMenu101_104: MenuItem[] = [
  { id: 'dtb9696',  label: 'Delta DTB9696', enabled: true, action: 'dtb9696' },
  sep('s1'),
  { id: 'ut321e',   label: 'UT321E',        enabled: true, action: 'ut321e' },
  sep('s2'),
  { id: 'ut32a',    label: 'UT32A',         enabled: true, action: 'ut32a' },
  sep('s3'),
  { id: 'ace2007a', label: 'ACE 2007',      enabled: true, action: 'ace2007a' },
  sep('s4'),
  { id: 'ut35a',    label: 'UT35A',         enabled: true, action: 'ut35a' },
];

// ── ACE 106 — controller sub-menus (Figure 3) ────────────────
// Each controller expands to Level Control / Flow Control / Cascade Control
const cascadeControlModes: MenuItem[] = [
  { id: 'level-ctrl',   label: 'Level Control',   enabled: true },
  sep('sc1'),
  { id: 'flow-ctrl',    label: 'Flow Control',    enabled: true },
  sep('sc2'),
  { id: 'cascade-ctrl', label: 'Cascade Control', enabled: true },
];

const ace106Controllers: MenuItem[] = [
  { id: 'dvpex2',  label: 'DELTA DVPEX2', enabled: true, children: cascadeControlModes.map(m => ({ ...m, id: `dvpex2-${m.id}` })) },
  sep('s106-1'),
  { id: 'ace2002', label: 'ACE 2002',     enabled: true, children: cascadeControlModes.map(m => ({ ...m, id: `ace2002-${m.id}` })) },
  sep('s106-2'),
  { id: 'ace2007', label: 'ACE 2007',     enabled: true, children: cascadeControlModes.map(m => ({ ...m, id: `ace2007-${m.id}` })) },
  sep('s106-3'),
  { id: 'sr20plc', label: 'SR20 PLC',     enabled: true, children: cascadeControlModes.map(m => ({ ...m, id: `sr20-${m.id}` })) },
];

// ──────────────────────────────────────────────────────────────
// Process Trainers
// ──────────────────────────────────────────────────────────────
const basicProcessTrainers: MenuItem[] = [
  { id: 'ace101', label: 'Level Process Trainer (ACE 101)',                         enabled: true,  children: controllerMenu101_104.map(m => ({ ...m, id: `ace101-${m.id}`, action: `ace101-${m.action || m.id}` })) },
  sep('bsep1'),
  { id: 'ace102', label: 'Flow Process Trainer (ACE 102)',                          enabled: true,  children: controllerMenu101_104.map(m => ({ ...m, id: `ace102-${m.id}`, action: `ace102-${m.action || m.id}` })) },
  sep('bsep2'),
  { id: 'ace103', label: 'Pressure Process Trainer (ACE 103)',                      enabled: true,  children: controllerMenu101_104.map(m => ({ ...m, id: `ace103-${m.id}`, action: `ace103-${m.action || m.id}` })) },
  sep('bsep3'),
  { id: 'ace104', label: 'Temperature Process Trainer (ACE 104)',                   enabled: true,  children: controllerMenu101_104.map(m => ({ ...m, id: `ace104-${m.id}`, action: `ace104-${m.action || m.id}` })) },
  sep('bsep4'),
  { id: 'ace105', label: 'Multi Process Trainer (ACE 105)',                         enabled: false },
  sep('bsep5'),
  { id: 'ace106', label: 'Cascade Process Trainer (Level + Flow) (ACE 106)',        enabled: true,  children: ace106Controllers },
  sep('bsep6'),
  { id: 'ace107', label: 'Cascade Process Trainer (Temperature + Flow) (ACE 107)', enabled: false },
  sep('bsep7'),
  { id: 'ace108', label: 'Multi Variable Process Trainer (ACE 108)',                enabled: true,  action: 'ace108' },
  sep('bsep8'),
  { id: 'ace109', label: 'Coupled Tank Level Process Trainer (ACE 109)',            enabled: false },
  sep('bsep9'),
  { id: 'ace110', label: 'Four Tank Level Process Trainer (ACE 110)',               enabled: true,  action: 'ace110' },
  sep('bsep10'),
  { id: 'ace111', label: 'Five Tank Level Process Trainer (ACE 111)',               enabled: true,  action: 'ace111' },
];

const advancedProcessTrainers: MenuItem[] = [
  { id: 'adv-placeholder', label: 'Advanced Trainer (Coming Soon)', enabled: false },
];

const nonLinearProcessTrainers: MenuItem[] = [
  { id: 'nl-placeholder', label: 'Non-Linear Trainer (Coming Soon)', enabled: false },
];

const commonExperiments: MenuItem[] = [
  { id: 'exp-placeholder', label: 'Common Experiments (Coming Soon)', enabled: false },
];

const processTrainers: TopLevelMenu = {
  id: 'process-trainers',
  label: 'Process Trainers',
  items: [
    { id: 'basic',      label: 'Basic Process Trainers',      enabled: true, children: basicProcessTrainers },
    sep('pt-s1'),
    { id: 'advanced',   label: 'Advanced Process Trainers',   enabled: true, children: advancedProcessTrainers },
    sep('pt-s2'),
    { id: 'nonlinear',  label: 'Non-Linear Process Trainers', enabled: true, children: nonLinearProcessTrainers },
    sep('pt-s3'),
    { id: 'common-exp', label: 'Common Experiments',          enabled: true, children: commonExperiments },
  ],
};

// ──────────────────────────────────────────────────────────────
// Process Simulators
// ──────────────────────────────────────────────────────────────
const processSimulators: TopLevelMenu = {
  id: 'process-simulators',
  label: 'Process Simulators',
  items: [
    { id: 'sim-two-pos',     label: 'Two Position & PID Simulator',   enabled: true },
    sep('sim-s1'),
    { id: 'sim-model',       label: 'Model Based Simulator',           enabled: true },
    sep('sim-s2'),
    { id: 'sim-pid-design',  label: 'Model Analysis & PID Design',     enabled: true },
    sep('sim-s3'),
    { id: 'sim-tuning',      label: 'Tuning of PID Controller',        enabled: true },
    sep('sim-s4'),
    { id: 'sim-math-model',  label: 'Mathematical Model Extraction',   enabled: false },
    sep('sim-s5'),
    { id: 'sim-cascade',     label: 'Cascade Control Simulator',       enabled: false },
    sep('sim-s6'),
    { id: 'sim-feedforward', label: 'Feedforward, Ratio Simulator',    enabled: false },
  ],
};

// ──────────────────────────────────────────────────────────────
// Instrumentation Systems
// ──────────────────────────────────────────────────────────────
const instrumentationSystems: TopLevelMenu = {
  id: 'instrumentation-systems',
  label: 'Instrumentation Systems',
  items: [
    { id: 'inst-placeholder', label: 'Instrumentation Modules (Coming Soon)', enabled: false },
  ],
};

// ──────────────────────────────────────────────────────────────
// Mechanical Systems
// ──────────────────────────────────────────────────────────────
const mechanicalSystems: TopLevelMenu = {
  id: 'mechanical-systems',
  label: 'Mechanical Systems',
  items: [
    { id: 'mech-placeholder', label: 'Mechanical Modules (Coming Soon)', enabled: false },
  ],
};

// ──────────────────────────────────────────────────────────────
// PLC Based Systems
// ──────────────────────────────────────────────────────────────
const plcBasedSystems: TopLevelMenu = {
  id: 'plc-based-systems',
  label: 'PLC Based Systems',
  items: [
    { id: 'plc-placeholder', label: 'PLC Modules (Coming Soon)', enabled: false },
  ],
};

// ──────────────────────────────────────────────────────────────
// About Us
// ──────────────────────────────────────────────────────────────
const aboutUs: TopLevelMenu = {
  id: 'about-us',
  label: 'About Us',
  items: [
    { id: 'about-company',  label: 'Company Information',  enabled: true, action: 'company-info' },
    sep('au-s1'),
    { id: 'about-software', label: 'Software Information', enabled: true, action: 'software-info' },
    sep('au-s2'),
    { id: 'about-version',  label: 'Version Information',  enabled: true, action: 'version-info' },
  ],
};

// ──────────────────────────────────────────────────────────────
// Full menu list (order matters — rendered left to right)
// ──────────────────────────────────────────────────────────────
export const menuConfig: TopLevelMenu[] = [
  processTrainers,
  processSimulators,
  instrumentationSystems,
  mechanicalSystems,
  plcBasedSystems,
  aboutUs,
];
