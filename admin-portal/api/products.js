// ==============================================================================
// ACE PROSOFT V2 — PRODUCT CATALOG CRUD API
// Vercel Serverless Function: /api/products
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

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase configuration missing.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── GET: Fetch all products ───────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, count: products.length, products });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── POST: Add a new product ───────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { id, code, name, category, version = '2.0.0', description = '', is_active = true } = req.body || {};

      if (!id || !code || !name || !category) {
        return res.status(400).json({
          success: false,
          error: 'Product ID (e.g. ACE-117), Code (e.g. ace117), Name, and Category are required.',
        });
      }

      const cleanCode = code.trim().toLowerCase();
      const cleanId = id.trim().toUpperCase();

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          id: cleanId,
          code: cleanCode,
          name: name.trim(),
          category: category.trim(),
          version: version.trim(),
          description: description.trim(),
          is_active: Boolean(is_active),
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── PUT: Update an existing product ───────────────────────────────────────
  if (req.method === 'PUT') {
    try {
      const { id, code, name, category, version, description, is_active } = req.body || {};

      if (!id) {
        return res.status(400).json({ success: false, error: 'Product ID is required for updating.' });
      }

      const updates = {};
      if (code !== undefined) updates.code = code.trim().toLowerCase();
      if (name !== undefined) updates.name = name.trim();
      if (category !== undefined) updates.category = category.trim();
      if (version !== undefined) updates.version = version.trim();
      if (description !== undefined) updates.description = description.trim();
      if (is_active !== undefined) updates.is_active = Boolean(is_active);

      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, product: updatedProduct });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── DELETE: Remove a product from catalog ─────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'Product ID is required.' });

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: `Product ${id} deleted successfully.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
