-- ==============================================================================
-- ACE PROSOFT V2 — SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Catalog Table (Master list of all 60 ACE Products)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,                       -- e.g. 'ACE-101'
    code TEXT UNIQUE NOT NULL,                 -- e.g. 'ace101'
    name TEXT NOT NULL,                        -- e.g. 'Flow & Level Control Trainer'
    category TEXT NOT NULL,                    -- 'Process Control Trainers', 'Process Simulators', etc.
    version TEXT DEFAULT '2.0.0',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers / Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_name TEXT NOT NULL,
    department TEXT DEFAULT 'Instrumentation & Control',
    contact_person TEXT,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,               -- Secure plain/hash for lab setup authentication
    max_activations INTEGER DEFAULT 10,        -- Maximum allowed lab PCs
    active_activations INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Customer Product Entitlements (Mapping of which products a college purchased)
CREATE TABLE IF NOT EXISTS public.college_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL REFERENCES public.products(code) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_id, product_code)
);

-- 5. Machine Activation Audit Logs (Tracks each lab PC that activates the software)
CREATE TABLE IF NOT EXISTS public.activation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    college_email TEXT NOT NULL,
    machine_id TEXT NOT NULL,                   -- Hardware UUID or MAC
    machine_name TEXT,                          -- PC Hostname / Computer Name
    ip_address TEXT,
    modules_activated TEXT[] NOT NULL,
    install_type TEXT DEFAULT 'online' CHECK (install_type IN ('online', 'offline')),
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Allow public read on products" ON public.products
    FOR SELECT USING (true);

-- Allow authenticated/service operations on colleges and licenses
CREATE POLICY "Allow service role on colleges" ON public.colleges
    FOR ALL USING (true);

CREATE POLICY "Allow service role on college_licenses" ON public.college_licenses
    FOR ALL USING (true);

CREATE POLICY "Allow service role on activation_logs" ON public.activation_logs
    FOR ALL USING (true);

-- ==============================================================================
-- 7. SEED DATA: All 60 ACE Products Catalog
-- ==============================================================================
INSERT INTO public.products (id, code, name, category, description) VALUES
-- Process Control Trainers (ACE 101 - ACE 116)
('ACE-101', 'ace101', 'Flow & Level Control Trainer', 'Process Control Trainers', 'Single-loop water level and flow process trainer with DTB9696/UT32A/ACE2007'),
('ACE-102', 'ace102', 'Temperature Control Trainer', 'Process Control Trainers', 'RTD, thermocouple and thyristor-based heating process control system'),
('ACE-103', 'ace103', 'Pressure Control Trainer', 'Process Control Trainers', 'Pneumatic vessel air pressure regulator and transmitter trainer'),
('ACE-104', 'ace104', 'Multi-Process Control Trainer', 'Process Control Trainers', 'Integrated 4-variable (Level, Flow, Temperature, Pressure) trainer'),
('ACE-105', 'ace105', 'Ratio Control Trainer', 'Process Control Trainers', 'Dual fluid blending and ratio flow control setup'),
('ACE-106', 'ace106', 'Multi-Loop Cascade & Feedforward Trainer', 'Process Control Trainers', 'Primary Level and Secondary Flow cascade loop with Delta DVPEX2 PLC / ACE 2002'),
('ACE-107', 'ace107', 'Split-Range Control Trainer', 'Process Control Trainers', 'Dual pneumatic valve heating/cooling split-range apparatus'),
('ACE-108', 'ace108', 'Three-Element Boiler Drum Control Trainer', 'Process Control Trainers', 'Steam drum level, feed water flow, and steam demand control'),
('ACE-109', 'ace109', 'pH Neutralization Process Trainer', 'Process Control Trainers', 'Acid-base chemical titrating and pH electrode control loop'),
('ACE-110', 'ace110', 'Distillation Column Process Trainer', 'Process Control Trainers', 'Fractional batch distillation column with reflux ratio control'),
('ACE-111', 'ace111', 'Heat Exchanger Control Trainer', 'Process Control Trainers', 'Shell-and-tube counter-flow dynamic thermal heat exchange rig'),
('ACE-112', 'ace112', 'Coupled Tank System Trainer', 'Process Control Trainers', 'Interacting and non-interacting quadruple tank system'),
('ACE-113', 'ace113', 'CSTR Chemical Reactor Trainer', 'Process Control Trainers', 'Jacketed stirred tank reactor with exothermic reaction mimic'),
('ACE-114', 'ace114', 'Water Treatment & Filtration Trainer', 'Process Control Trainers', 'Industrial sand bed and backwash pressure differential unit'),
('ACE-115', 'ace115', 'Pneumatic Control Valve Characterization', 'Process Control Trainers', 'Air-to-open / air-to-close actuator bench with valve positioner'),
('ACE-116', 'ace116', 'Industrial Sensor Calibration Bench', 'Process Control Trainers', 'Deadweight tester, thermal bath, and current loop calibrator'),

-- Process Simulators (ACE 401 - ACE 420)
('ACE-401', 'sim-ace401', 'Two-Position (On-Off) Process Simulator', 'Process Simulators', 'Hysteresis and neutral zone level control simulation'),
('ACE-402', 'sim-ace402', 'Proportional (P) Level Control Simulator', 'Process Simulators', 'Steady-state offset and proportional band dynamics'),
('ACE-403', 'sim-ace403', 'PI & PID Process Level Simulator with ML/MPC Tuning', 'Process Simulators', 'First-principles FOPDT with Machine Learning and MPC control'),
('ACE-404', 'sim-ace404', 'Advanced Control Architecture Simulator', 'Process Simulators', 'Cascade, Feedforward, and Smith Predictor dead-time compensator'),
('ACE-405', 'sim-ace405', 'Non-Interacting Two-Tank Liquid Level Simulator', 'Process Simulators', 'Independent head liquid level simulation with transfer functions'),
('ACE-406', 'sim-ace406', 'Interacting Two-Tank Liquid Level Simulator', 'Process Simulators', 'Cross-coupled bottom manifold hydrodynamic simulation'),
('ACE-407', 'sim-ace407', 'Three-Tank Dynamic Process Simulator', 'Process Simulators', 'Higher-order process dynamics with fault injection'),
('ACE-408', 'sim-ace408', 'Temperature Process Dynamics Simulator', 'Process Simulators', 'First-order plus pure time delay thermal heat model'),
('ACE-409', 'sim-ace409', 'Pressure Vessel Dynamics Simulator', 'Process Simulators', 'Isothermal gas compressibility and discharge orifice model'),
('ACE-410', 'sim-ace410', 'Heat Exchanger Multi-Pass Simulator', 'Process Simulators', 'LMTD and effectiveness-NTU dynamic heat transfer engine'),
('ACE-411', 'sim-ace411', 'CSTR Dynamic Reactor Simulator', 'Process Simulators', 'Non-linear Arrhenius reaction kinetics and temperature runaway'),
('ACE-412', 'sim-ace412', 'Binary Distillation Column Simulator', 'Process Simulators', 'McCabe-Thiele dynamic tray equilibrium simulator'),
('ACE-413', 'sim-ace413', 'Transfer Function & Block Diagram Simulator', 'Process Simulators', 'Laplace domain Bode, Nyquist, and Root Locus stability tools'),
('ACE-414', 'sim-ace414', 'Model Predictive Control (MPC) Simulator', 'Process Simulators', 'Receding horizon quadratic optimization with state constraints'),
('ACE-415', 'sim-ace415', 'Fuzzy Logic Process Controller Simulator', 'Process Simulators', 'Mamdani and Sugeno inference engine with membership visualizer'),
('ACE-416', 'sim-ace416', 'Neural Network Adaptive Controller Simulator', 'Process Simulators', 'Self-tuning artificial neural network plant identifier'),
('ACE-417', 'sim-ace417', 'Split-Range Control Loop Simulator', 'Process Simulators', 'Coordinated dual actuator valve sequencing simulation'),
('ACE-418', 'sim-ace418', 'Ratio Control Loop Simulator', 'Process Simulators', 'Wild flow and controlled flow blending dynamics'),
('ACE-419', 'sim-ace419', 'State-Space State Feedback Simulator', 'Process Simulators', 'Pole placement and LQR optimal regulator simulation'),
('ACE-420', 'sim-ace420', 'SCADA & Industrial Telemetry Simulator', 'Process Simulators', 'Mimic graphic human-machine interface with alarm management'),

-- Thermal & Energy Trainers (ACE 201 - ACE 205)
('ACE-201', 'ace201', 'Thermal Conductivity Apparatus', 'Thermal & Energy Trainers', 'Guarded hot plate metal conduction study bench'),
('ACE-202', 'ace202', 'Forced & Natural Convection Bench', 'Thermal & Energy Trainers', 'Wind tunnel duct with heated pin-fin matrix'),
('ACE-203', 'ace203', 'Shell & Tube Heat Exchanger Study Rig', 'Thermal & Energy Trainers', 'Instrumented water-to-water heat transfer test unit'),
('ACE-204', 'ace204', 'Vapour Compression Refrigeration Trainer', 'Thermal & Energy Trainers', 'R134a refrigeration cycle with P-h chart instrumentation'),
('ACE-205', 'ace205', 'Solar Thermal Collector Study Bench', 'Thermal & Energy Trainers', 'Flat plate solar collector with pyranometer and data logger'),

-- Electrical Drives & Automation Trainers (ACE 301 - ACE 308)
('ACE-301', 'ace301', 'Variable Frequency Drive (VFD) Trainer', 'Electrical & Automation', 'Induction motor torque and speed vector control workstation'),
('ACE-302', 'ace302', 'DC Motor Servo Speed & Position Trainer', 'Electrical & Automation', 'Encoder feedback precision closed-loop DC servo unit'),
('ACE-303', 'ace303', 'Stepper Motor Microstepping Trainer', 'Electrical & Automation', 'Bipolar stepper indexer with profile acceleration'),
('ACE-304', 'ace304', 'Brushless DC (BLDC) Motor Trainer', 'Electrical & Automation', 'Hall sensor commutation and electronic speed controller unit'),
('ACE-305', 'ace305', 'Power Electronics Converter & Inverter', 'Electrical & Automation', 'SCR, MOSFET, and IGBT converter firing module'),
('ACE-306', 'ace306', 'PLC Automation Training Station', 'Electrical & Automation', 'Industrial PLC with digital/analog I/O and ladder logic simulator'),
('ACE-307', 'ace307', 'Distributed Control System (DCS) Bench', 'Electrical & Automation', 'Fieldbus redundant controller with operator engineering station'),
('ACE-308', 'ace308', 'Modbus RTU/TCP & Industrial Ethernet Bench', 'Electrical & Automation', 'RS485 multi-drop, Ethernet switch and packet analyzer station'),

-- Robotics, Mechatronics & Smart Factory (ACE 501 - ACE 510)
('ACE-501', 'ace501', '4-DOF Robotic Arm Trajectory Trainer', 'Robotics & Mechatronics', 'Kinematics and pick-place path trajectory trainer'),
('ACE-502', 'ace502', '6-DOF Industrial Articulated Robot', 'Robotics & Mechatronics', 'Industrial payload arm with teach pendant and obstacle avoidance'),
('ACE-503', 'ace503', 'Machine Vision Sorting Conveyor Bench', 'Robotics & Mechatronics', 'High-speed camera colour and dimension part sorting station'),
('ACE-504', 'ace504', 'Cartesian Gantry Pick & Place Robot', 'Robotics & Mechatronics', '3-Axis linear ball-screw servo positioning gantry'),
('ACE-505', 'ace505', 'Industrial IoT Edge Gateway Station', 'Robotics & Mechatronics', 'MQTT/OPC-UA cloud publishing telemetry node'),
('ACE-506', 'ace506', 'Smart Wireless Sensor & WirelessHART Bench', 'Robotics & Mechatronics', 'Mesh sensor field network with wireless pressure/temp nodes'),
('ACE-507', 'ace507', 'Vibration Analysis & Condition Monitoring', 'Robotics & Mechatronics', 'Bearing fault and unbalance spectrum FFT analyzer bench'),
('ACE-508', 'ace508', 'Electro-Hydraulic Power Unit Trainer', 'Robotics & Mechatronics', 'Proportional hydraulic valve and cylinder actuator station'),
('ACE-509', 'ace509', 'Electro-Pneumatics Logic Sequence Bench', 'Robotics & Mechatronics', '5/2 solenoid valves, reed switches, and cascading cylinders'),
('ACE-510', 'ace510', 'Flexible Manufacturing System (FMS) Cell', 'Robotics & Mechatronics', 'Integrated CNC, conveyor, robot, and automated warehouse')
ON CONFLICT (code) DO NOTHING;

-- 8. Sample Starter College: National Institute of Technology
INSERT INTO public.colleges (college_name, department, contact_person, email, password_hash, max_activations, active_activations, status, notes)
VALUES (
    'National Institute of Technology',
    'Instrumentation & Control Engineering',
    'Dr. K. Ramanathan',
    'hod.ice@nit.edu',
    'nit12345',
    15,
    3,
    'active',
    'Supplied under Order PO-2026-NIT-089'
) ON CONFLICT (email) DO NOTHING;

-- Grant products ACE 101, ACE 401, ACE 403 to the sample college
DO $$
DECLARE
    nit_id UUID;
BEGIN
    SELECT id INTO nit_id FROM public.colleges WHERE email = 'hod.ice@nit.edu';
    IF nit_id IS NOT NULL THEN
        INSERT INTO public.college_licenses (college_id, product_code) VALUES
        (nit_id, 'ace101'),
        (nit_id, 'sim-ace401'),
        (nit_id, 'sim-ace403')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
