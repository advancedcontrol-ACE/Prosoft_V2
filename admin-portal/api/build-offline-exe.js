// ==============================================================================
// ACE PROSOFT V2 — OFFLINE INSTALLER CONFIG GENERATOR
// Vercel Serverless Function: /api/build-offline-exe
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SECRET_SALT = process.env.ACE_LICENSE_SECRET || 'ACE_PROSOFT_INDUSTRIAL_SECRET_2026';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { collegeId } = req.body || {};
  if (!collegeId) {
    return res.status(400).json({ error: 'collegeId is required.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch college
    const { data: college, error: colError } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .single();

    if (colError || !college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    // 2. Fetch products
    const { data: licenses } = await supabase
      .from('college_licenses')
      .select('product_code')
      .eq('college_id', college.id);

    const allowedModules = (licenses || []).map((l) => l.product_code);

    // 3. Build offline configuration payload
    const payload = {
      licenseType: 'OFFLINE_STANDALONE',
      collegeId: college.id,
      collegeName: college.college_name,
      department: college.department,
      email: college.email,
      maxActivations: college.max_activations,
      allowedModules,
      issuedAt: new Date().toISOString(),
    };

    // 4. Create integrity signature
    const signature = crypto
      .createHmac('sha256', SECRET_SALT)
      .update(JSON.stringify(payload))
      .digest('hex');

    const offlinePackage = {
      ...payload,
      signature,
      instructions: 'Place this file as installed_modules.json in the ACE Prosoft app directory or installer package.',
    };

    // Log offline generation
    await supabase.from('activation_logs').insert({
      college_id: college.id,
      college_email: college.email,
      machine_id: 'OFFLINE_BUNDLE_GENERATED',
      machine_name: 'OFFLINE_SETUP_EXE',
      modules_activated: allowedModules,
      install_type: 'offline',
    });

    return res.status(200).json({
      success: true,
      collegeName: college.college_name,
      allowedModules,
      filename: `ACE_Prosoft_Offline_${college.email.replace(/[@.]/g, '_')}.json`,
      offlinePackage,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
