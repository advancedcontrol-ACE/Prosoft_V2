// ==============================================================================
// ACE PROSOFT V2 — ADMIN PORTAL COLLEGES MANAGEMENT API
// Vercel Serverless Function: /api/colleges
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase configuration missing on server.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── GET: List all colleges with their assigned product codes ──────────────────
  if (req.method === 'GET') {
    try {
      const { data: colleges, error: colError } = await supabase
        .from('colleges')
        .select('*')
        .order('created_at', { ascending: false });

      if (colError) throw colError;

      const { data: licenses, error: licError } = await supabase
        .from('college_licenses')
        .select('college_id, product_code');

      if (licError) throw licError;

      // Group products by college_id
      const licMap = {};
      (licenses || []).forEach((l) => {
        if (!licMap[l.college_id]) licMap[l.college_id] = [];
        licMap[l.college_id].push(l.product_code);
      });

      const enriched = (colleges || []).map((c) => ({
        ...c,
        products: licMap[c.id] || [],
      }));

      return res.status(200).json({ success: true, colleges: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── POST: Create a new college and assign products ─────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        college_name,
        department,
        contact_person,
        phone,
        email,
        password_hash,
        max_activations = 10,
        status = 'active',
        notes = '',
        products = [],
      } = req.body;

      if (!college_name || !email || !password_hash) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      }

      // Insert College
      const { data: newCollege, error: insertError } = await supabase
        .from('colleges')
        .insert({
          college_name,
          department,
          contact_person,
          phone,
          email: email.trim().toLowerCase(),
          password_hash: password_hash.trim(),
          max_activations: Number(max_activations) || 10,
          status,
          notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert Product Entitlements
      if (products.length > 0) {
        const rows = products.map((code) => ({
          college_id: newCollege.id,
          product_code: code,
        }));
        const { error: licError } = await supabase.from('college_licenses').insert(rows);
        if (licError) console.error('Error inserting licenses:', licError);
      }

      return res.status(201).json({
        success: true,
        college: { ...newCollege, products },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── PUT: Update college details and product entitlements ───────────────────────
  if (req.method === 'PUT') {
    try {
      const {
        id,
        college_name,
        department,
        contact_person,
        phone,
        email,
        password_hash,
        max_activations,
        status,
        notes,
        products,
      } = req.body;

      if (!id) return res.status(400).json({ success: false, error: 'College ID is required.' });

      // Update college row
      const updates = { updated_at: new Date().toISOString() };
      if (college_name !== undefined) updates.college_name = college_name;
      if (department !== undefined) updates.department = department;
      if (contact_person !== undefined) updates.contact_person = contact_person;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email.trim().toLowerCase();
      if (password_hash !== undefined) updates.password_hash = password_hash.trim();
      if (max_activations !== undefined) updates.max_activations = Number(max_activations);
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;

      const { data: updatedCollege, error: updateError } = await supabase
        .from('colleges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // If products list passed, replace existing licenses
      if (Array.isArray(products)) {
        await supabase.from('college_licenses').delete().eq('college_id', id);
        if (products.length > 0) {
          const rows = products.map((code) => ({
            college_id: id,
            product_code: code,
          }));
          await supabase.from('college_licenses').insert(rows);
        }
      }

      return res.status(200).json({
        success: true,
        college: { ...updatedCollege, products },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── DELETE: Delete college ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'ID is required.' });

      const { error } = await supabase.from('colleges').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'College deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
