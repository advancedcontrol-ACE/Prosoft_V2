import React, { useState, useEffect, useMemo } from 'react';
import { College, Product } from './types';
import {
  fetchColleges,
  saveCollege,
  deleteCollege,
  fetchProducts,
  saveProduct,
  deleteProduct,
  renameCategory,
  deleteCategory,
  isSupabaseConfigured,
} from './supabase';
import { CollegeModal } from './components/CollegeModal';
import { OfflineModal } from './components/OfflineModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { ClientInstallPage } from './components/ClientInstallPage';
import './App.css';

export const App: React.FC = () => {
  // Direct client install route check
  const isInstallRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/install' ||
      window.location.pathname === '/activate' ||
      window.location.pathname === '/setup' ||
      window.location.search.includes('install'));

  if (isInstallRoute) {
    return <ClientInstallPage />;
  }

  const [colleges, setColleges] = useState<College[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedCollege, setSelectedCollege] = useState<Partial<College> | null>(null);
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [offlineCollege, setOfflineCollege] = useState<College | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Load colleges and products
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [colList, prodList] = await Promise.all([
        fetchColleges(),
        fetchProducts(),
      ]);
      setColleges(colList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered colleges
  const filteredColleges = useMemo(() => {
    return colleges.filter((c) => {
      const matchesSearch =
        c.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.products?.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [colleges, searchQuery, statusFilter]);

  // Statistics
  const totalActivations = useMemo(() => {
    return colleges.reduce((sum, c) => sum + (c.active_activations || 0), 0);
  }, [colleges]);

  const totalLicensedDeployments = useMemo(() => {
    return colleges.reduce((sum, c) => sum + (c.products?.length || 0), 0);
  }, [colleges]);

  const handleOpenAdd = () => {
    setSelectedCollege(null);
    setIsCollegeModalOpen(true);
  };

  const handleOpenEdit = (col: College) => {
    setSelectedCollege(col);
    setIsCollegeModalOpen(true);
  };

  const handleOpenOffline = (col: College) => {
    setOfflineCollege(col);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will revoke their lab PC access.`)) {
      await deleteCollege(id);
      const colList = await fetchColleges();
      setColleges(colList);
    }
  };

  const handleSaveCollege = async (data: Partial<College>) => {
    await saveCollege(data);
    const colList = await fetchColleges();
    setColleges(colList);
  };

  const handleSaveProduct = async (product: Partial<Product>, isEdit: boolean) => {
    await saveProduct(product, isEdit);
    const prodList = await fetchProducts();
    setProducts(prodList);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    const prodList = await fetchProducts();
    setProducts(prodList);
  };

  const handleRenameCategory = async (oldCat: string, newCat: string) => {
    await renameCategory(oldCat, newCat);
    const prodList = await fetchProducts();
    setProducts(prodList);
  };

  const handleDeleteCategory = async (cat: string, targetCat?: string) => {
    await deleteCategory(cat, targetCat);
    const prodList = await fetchProducts();
    setProducts(prodList);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="admin-root">
      {/* Top Navbar with ACE Logo and Full Company Name */}
      <header className="admin-header">
        <div className="header-brand">
          <div className="header-logo-container">
            <img
              src="/images/ace_logo.png"
              alt="Advanced Control Equipments Logo"
              className="header-logo-img"
              onError={(e) => {
                // Fallback to text badge if logo file missing
                const target = e.currentTarget as HTMLElement;
                target.style.display = 'none';
                const fallback = document.getElementById('ace-logo-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div id="ace-logo-fallback" className="header-logo-badge" style={{ display: 'none' }}>
              ACE
            </div>
          </div>

          <div className="header-brand-titles">
            <div className="header-company-name">ADVANCED CONTROL EQUIPMENTS</div>
            <h1 className="header-title">ACE Prosoft V2.0 — Enterprise Admin Portal</h1>
            <p className="header-tagline">Customer Entitlement & Master Product Catalog Management Center</p>
          </div>
        </div>

        <div className="header-actions">
          <a
            href="/install"
            target="_blank"
            rel="noreferrer"
            className="btn-install-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#10b981',
              color: '#fff',
              padding: '9px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.86rem',
              fontWeight: '600',
            }}
          >
            🚀 Open Client Setup Portal
          </a>
          <button className="btn-catalog" onClick={() => setShowCatalogModal(true)}>
            📦 Manage Product Catalog ({products.length})
          </button>
          <button className="btn-add-college" onClick={handleOpenAdd}>
            + Add Customer / College
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-container">
        {/* Status / Notice Banner */}
        <div className="system-status-banner">
          <span className="status-indicator online"></span>
          <span>
            {isSupabaseConfigured
              ? 'Connected to Supabase PostgreSQL Database (Production Active)'
              : 'Running in Local Storage Sandbox (Configure VITE_SUPABASE_URL in .env to sync with Supabase)'}
          </span>
        </div>

        {/* Metric Cards Bar */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Registered Customers</span>
            <span className="stat-number">{colleges.length}</span>
            <span className="stat-sub">Colleges & Universities</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Lab PC Installs</span>
            <span className="stat-number">{totalActivations}</span>
            <span className="stat-sub">Authenticated Machines</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Allocated Trainers</span>
            <span className="stat-number">{totalLicensedDeployments}</span>
            <span className="stat-sub">Across All Customer Labs</span>
          </div>
          <div className="stat-card stat-card-clickable" onClick={() => setShowCatalogModal(true)}>
            <div className="stat-card-header">
              <span className="stat-label">Master Catalog</span>
              <span className="stat-edit-link">Edit ⚙️</span>
            </div>
            <span className="stat-number">{products.length}</span>
            <span className="stat-sub">Trainers, Simulators & Cells</span>
          </div>
        </div>

        {/* Table Controls / Filter Toolbar */}
        <div className="toolbar-card">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by college name, email, department, or product code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Colleges List Table */}
        <div className="table-card">
          {isLoading ? (
            <div className="loading-state">Loading customers and product allocations...</div>
          ) : filteredColleges.length === 0 ? (
            <div className="empty-state">
              <p>No customers found matching your criteria.</p>
              <button className="btn-secondary" onClick={handleOpenAdd}>
                Add Your First Customer
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer / Institution</th>
                    <th>Lab Login ID (Email)</th>
                    <th>Password</th>
                    <th>Supplied Trainers & Simulators</th>
                    <th>Lab PCs</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColleges.map((c) => {
                    const isPassVisible = Boolean(showPasswordMap[c.id]);
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="college-cell-main">
                            <span className="college-name-text">{c.college_name}</span>
                            <span className="college-dept-text">{c.department || 'Process Lab'}</span>
                            {c.contact_person && (
                              <span className="college-contact-text">👤 {c.contact_person}</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="email-cell mono">{c.email}</span>
                        </td>

                        <td>
                          <div className="password-cell">
                            <span className="mono">
                              {isPassVisible ? c.password_hash : '••••••••'}
                            </span>
                            <button
                              type="button"
                              className="btn-eye"
                              onClick={() => togglePasswordVisibility(c.id)}
                              title={isPassVisible ? 'Hide password' : 'Show password'}
                            >
                              {isPassVisible ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="products-tag-list">
                            {(c.products || []).slice(0, 4).map((code) => (
                              <span key={code} className="product-tag">
                                {code.toUpperCase()}
                              </span>
                            ))}
                            {(c.products?.length || 0) > 4 && (
                              <span className="product-tag-more">
                                +{(c.products?.length || 0) - 4} more
                              </span>
                            )}
                            {(!c.products || c.products.length === 0) && (
                              <span className="no-products-tag">None Assigned</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="activations-count">
                            <strong>{c.active_activations || 0}</strong> / {c.max_activations || 10}
                          </span>
                        </td>

                        <td>
                          <span className={`status-pill ${c.status || 'active'}`}>
                            {c.status || 'active'}
                          </span>
                        </td>

                        <td>
                          <div className="actions-cell">
                            <button
                              className="btn-action btn-offline"
                              title="Generate Tailored Offline Installer"
                              onClick={() => handleOpenOffline(c)}
                            >
                              ⚡ Offline Setup
                            </button>
                            <button
                              className="btn-action btn-edit"
                              title="Edit Customer"
                              onClick={() => handleOpenEdit(c)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-action btn-delete"
                              title="Delete Customer"
                              onClick={() => handleDelete(c.id, c.college_name)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* College Add/Edit Modal */}
      <CollegeModal
        college={selectedCollege}
        products={products}
        isOpen={isCollegeModalOpen}
        onClose={() => setIsCollegeModalOpen(false)}
        onSave={handleSaveCollege}
      />

      {/* Offline Installer Generator Modal */}
      <OfflineModal
        college={offlineCollege}
        isOpen={Boolean(offlineCollege)}
        onClose={() => setOfflineCollege(null)}
      />

      {/* Comprehensive Product Catalog CRUD Modal */}
      <ProductCatalogModal
        products={products}
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};
