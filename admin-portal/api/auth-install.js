// ==============================================================================
// ACE PROSOFT V2 — CLIENT INSTALLATION AUTHENTICATION API
// Vercel Serverless Function: /api/auth-install
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://iqyzchpsnjylhnsdgtlp.supabase.co';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeXpjaHBzbmp5bGhuc2RndGxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjcyNTYxOSwiZXhwIjoyMTA4MzAxNjE5fQ.aUiE7dKQU8juK5aOk9aJsJOUHEHark-Y07NOZi4Z4t4';

export default async function handler(req, res) {
  // CORS Headers for client installer requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { email, password, machineId = 'UNKNOWN_ID', machineName = 'LAB_PC' } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required credentials. Both College Email and Password are required.',
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase environment variables not configured.',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch college by email
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id, college_name, department, email, password_hash, max_activations, active_activations, status')
      .ilike('email', email.trim())
      .single();

    if (collegeError || !college) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or college account not found.',
      });
    }

    // 2. Validate Password
    if (college.password_hash !== password.trim()) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please contact your ACE administrator.',
      });
    }

    // 3. Verify Account Status
    if (college.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `College account is currently ${college.status}. Please contact ACE support.`,
      });
    }

    // 4. Fetch Licensed Products for this college
    const { data: licenses, error: licError } = await supabase
      .from('college_licenses')
      .select('product_code')
      .eq('college_id', college.id);

    if (licError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve licensed product list.',
      });
    }

    const allowedModules = (licenses || []).map((l) => l.product_code);

    if (allowedModules.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'No active trainer or simulator modules are assigned to this college account.',
      });
    }

    // 5. Check if this machine is already registered or if activations quota exceeded
    const { data: existingLogs } = await supabase
      .from('activation_logs')
      .select('id')
      .eq('college_id', college.id)
      .eq('machine_id', machineId)
      .limit(1);

    const isExistingMachine = existingLogs && existingLogs.length > 0;

    if (!isExistingMachine && college.active_activations >= college.max_activations) {
      return res.status(403).json({
        success: false,
        error: `Activation limit exceeded. Maximum ${college.max_activations} lab PCs allowed for this license.`,
      });
    }

    // 6. Log activation
    await supabase.from('activation_logs').insert({
      college_id: college.id,
      college_email: college.email,
      machine_id: machineId,
      machine_name: machineName,
      ip_address: (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || 'unknown',
      modules_activated: allowedModules,
      install_type: 'online',
    });

    // Increment active activations if new machine
    if (!isExistingMachine) {
      await supabase
        .from('colleges')
        .update({ active_activations: (college.active_activations || 0) + 1 })
        .eq('id', college.id);
    }

    return res.status(200).json({
      success: true,
      collegeName: college.college_name,
      department: college.department,
      allowedModules,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('API Error in /api/auth-install:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing authentication: ' + (err?.message || String(err)),
    });
  }
}
