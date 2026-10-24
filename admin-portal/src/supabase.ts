import { createClient } from '@supabase/supabase-js';
import { College, Product, ActivationLog } from './types';
import { MASTER_PRODUCTS } from './productsData';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Fallback for Development and Instant Testing
const STORAGE_KEY_COLLEGES = 'ace_prosoft_admin_colleges';
const STORAGE_KEY_LOGS = 'ace_prosoft_admin_logs';

const DEFAULT_SAMPLE_COLLEGES: College[] = [
  {
    id: 'sample-col-manipal',
    college_name: 'Manipal Institute of Technology (MAHE)',
    department: 'Instrumentation & Control Engineering',
    contact_person: 'Dr. Meena Sundar',
    phone: '+91 820 292 5000',
    email: 'meena.sundar@manipal.edu',
    password_hash: 'Manipal@2026',
    max_activations: 15,
    active_activations: 0,
    status: 'active',
    notes: 'Primary Evaluation & Testing Lab License',
    created_at: new Date().toISOString(),
    products: ['ace101', 'sim-ace401', 'sim-ace403'],
  },
  {
    id: 'sample-col-1',
    college_name: 'National Institute of Technology, Trichy',
    department: 'Instrumentation & Control Engineering',
    contact_person: 'Dr. K. Ramanathan',
    phone: '+91 98401 23456',
    email: 'hod.ice@nitt.edu',
    password_hash: 'nitt1234',
    max_activations: 15,
    active_activations: 3,
    status: 'active',
    notes: 'Order Ref: PO-2026-NITT-089. Process lab upgrade.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    products: ['ace101', 'sim-ace401', 'sim-ace403'],
  },
  {
    id: 'sample-col-2',
    college_name: 'PSG College of Technology, Coimbatore',
    department: 'Mechatronics & Automation',
    contact_person: 'Prof. S. Suresh',
    phone: '+91 94432 78901',
    email: 'hod.mech@psgtech.edu',
    password_hash: 'psgpass2026',
    max_activations: 10,
    active_activations: 1,
    status: 'active',
    notes: 'Supplied ACE 101 with DTB9696 and ACE 401 simulator.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    products: ['ace101', 'sim-ace401'],
  },
];

export async function fetchColleges(): Promise<College[]> {
  if (supabase) {
    try {
      const res = await fetch('/api/colleges');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.colleges) return json.colleges;
      }
    } catch {
      // Fall through to direct Supabase query
    }

    try {
      const { data, error } = await supabase.from('colleges').select('*');
      if (!error && data) {
        const { data: licenses } = await supabase.from('college_licenses').select('college_id, product_code');
        const map: Record<string, string[]> = {};
        (licenses || []).forEach((l) => {
          if (!map[l.college_id]) map[l.college_id] = [];
          map[l.college_id].push(l.product_code);
        });
        return data.map((c) => ({ ...c, products: map[c.id] || [] }));
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local store:', e);
    }
  }

  // Fallback to local storage
  const stored = localStorage.getItem(STORAGE_KEY_COLLEGES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_COLLEGES, JSON.stringify(DEFAULT_SAMPLE_COLLEGES));
    return DEFAULT_SAMPLE_COLLEGES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SAMPLE_COLLEGES;
  }
}

export async function saveCollege(college: Partial<College>): Promise<College> {
  if (supabase) {
    try {
      const method = college.id ? 'PUT' : 'POST';
      const res = await fetch('/api/colleges', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(college),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.college) return json.college;
      }
    } catch {
      // Fallback
    }
  }

  // Local fallback
  const list = await fetchColleges();
  let saved: College;
  if (college.id) {
    const idx = list.findIndex((c) => c.id === college.id);
    if (idx >= 0) {
      saved = { ...list[idx], ...college } as College;
      list[idx] = saved;
    } else {
      saved = college as College;
      list.push(saved);
    }
  } else {
    saved = {
      id: 'col_' + Date.now().toString(36),
      college_name: college.college_name || '',
      department: college.department || 'Instrumentation',
      contact_person: college.contact_person || '',
      phone: college.phone || '',
      email: college.email || '',
      password_hash: college.password_hash || '',
      max_activations: college.max_activations || 10,
      active_activations: 0,
      status: college.status || 'active',
      notes: college.notes || '',
      created_at: new Date().toISOString(),
      products: college.products || [],
    };
    list.unshift(saved);
  }
  localStorage.setItem(STORAGE_KEY_COLLEGES, JSON.stringify(list));
  return saved;
}

export async function deleteCollege(id: string): Promise<void> {
  if (supabase) {
    try {
      await fetch(`/api/colleges?id=${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
  }

  const list = await fetchColleges();
  const filtered = list.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY_COLLEGES, JSON.stringify(filtered));
}

// ── PRODUCT CATALOG CRUD ──────────────────────────────────────────────────
const STORAGE_KEY_PRODUCTS = 'ace_prosoft_admin_products';

export async function fetchProducts(): Promise<Product[]> {
  if (supabase) {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.products) return json.products;
      }
    } catch {
      // Fallback to Supabase direct query
    }

    try {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase products fetch failed:', e);
    }
  }

  // Fallback to local storage or MASTER_PRODUCTS
  const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(MASTER_PRODUCTS));
    return MASTER_PRODUCTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return MASTER_PRODUCTS;
  }
}

export async function saveProduct(product: Partial<Product>, isEdit: boolean): Promise<Product> {
  if (supabase) {
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.product) return json.product;
      }
    } catch {
      // Fallback
    }

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('products')
          .update(product)
          .eq('id', product.id)
          .select()
          .single();
        if (!error && data) return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(product)
          .select()
          .single();
        if (!error && data) return data;
      }
    } catch (e) {
      console.warn('Supabase product save failed:', e);
    }
  }

  // Local fallback
  const list = await fetchProducts();
  let saved: Product;
  if (isEdit) {
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      saved = { ...list[idx], ...product } as Product;
      list[idx] = saved;
    } else {
      saved = product as Product;
      list.push(saved);
    }
  } else {
    saved = {
      id: product.id || `ACE-${Math.floor(100 + Math.random() * 900)}`,
      code: product.code || (product.id || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: product.name || '',
      category: product.category || 'Process Control Trainers',
      version: product.version || '2.0.0',
      description: product.description || '',
    };
    list.push(saved);
  }
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
  return saved;
}

export async function deleteProduct(id: string): Promise<void> {
  if (supabase) {
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }

    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase product delete failed:', e);
    }
  }

  const list = await fetchProducts();
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(filtered));
}

export async function renameCategory(oldCategory: string, newCategory: string): Promise<void> {
  const trimmedOld = oldCategory.trim();
  const trimmedNew = newCategory.trim();
  if (!trimmedNew || trimmedNew === trimmedOld) return;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category: trimmedNew })
        .eq('category', trimmedOld);
      if (error) console.warn('Supabase rename category error:', error.message);
    } catch (e) {
      console.warn('Supabase rename category exception:', e);
    }
  }

  // Update local storage fallback as well
  const list = await fetchProducts();
  let updated = false;
  list.forEach((p) => {
    if (p.category === trimmedOld) {
      p.category = trimmedNew;
      updated = true;
    }
  });
  if (updated) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
  }
}

export async function deleteCategory(categoryToDelete: string, targetCategory?: string): Promise<void> {
  const trimmed = categoryToDelete.trim();
  if (!trimmed) return;
  const target = (targetCategory || 'Basic Process Trainers').trim();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category: target })
        .eq('category', trimmed);
      if (error) console.warn('Supabase delete category error:', error.message);
    } catch (e) {
      console.warn('Supabase delete category exception:', e);
    }
  }

  const list = await fetchProducts();
  let updated = false;
  list.forEach((p) => {
    if (p.category === trimmed) {
      p.category = target;
      updated = true;
    }
  });
  if (updated) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
  }
}


