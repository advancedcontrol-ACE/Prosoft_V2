import React, { useState, useMemo } from 'react';
import { College, Product } from '../types';
import { MASTER_PRODUCTS } from '../productsData';

interface CollegeModalProps {
  college: Partial<College> | null;
  products?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (college: Partial<College>) => Promise<void>;
}

export const CollegeModal: React.FC<CollegeModalProps> = ({
  college,
  products = [],
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(college?.id);
  const productList = products.length > 0 ? products : MASTER_PRODUCTS;

  const availableCategories = useMemo(() => {
    return Array.from(new Set(productList.map((p) => p.category)));
  }, [productList]);

  const [formData, setFormData] = useState<Partial<College>>({
    college_name: college?.college_name || '',
    department: college?.department || 'Instrumentation & Control',
    contact_person: college?.contact_person || '',
    phone: college?.phone || '',
    email: college?.email || '',
    password_hash: college?.password_hash || '',
    max_activations: college?.max_activations || 10,
    status: college?.status || 'active',
    notes: college?.notes || '',
    products: college?.products || [],
  });

  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchQuery =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [productList, productSearch, selectedCategory]);

  const toggleProduct = (code: string) => {
    const cur = formData.products || [];
    if (cur.includes(code)) {
      setFormData({ ...formData, products: cur.filter((c) => c !== code) });
    } else {
      setFormData({ ...formData, products: [...cur, code] });
    }
  };

  const handleSelectAllVisible = () => {
    const cur = new Set(formData.products || []);
    filteredProducts.forEach((p) => cur.add(p.code));
    setFormData({ ...formData, products: Array.from(cur) });
  };

  const handleClearAllVisible = () => {
    const visibleCodes = new Set(filteredProducts.map((p) => p.code));
    const cur = (formData.products || []).filter((c) => !visibleCodes.has(c));
    setFormData({ ...formData, products: cur });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.college_name?.trim()) {
      setErrorMsg('Please enter College / Institution Name.');
      return;
    }
    if (!formData.email?.trim()) {
      setErrorMsg('Please enter College Email ID.');
      return;
    }
    if (!formData.password_hash?.trim()) {
      setErrorMsg('Please provide a Password for the college lab PCs.');
      return;
    }
    if (!formData.products || formData.products.length === 0) {
      setErrorMsg('Please select at least 1 trainer or simulator product to license.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSave({
        ...college,
        ...formData,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save college details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEditing ? 'Edit Customer & Trainer Allocations' : 'Add New Customer / College'}
            </h2>
            <p className="modal-subtitle">
              Configure credentials and assign licensed trainers from the 60 ACE products catalog.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {errorMsg && <div className="modal-alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-sections-grid">
            {/* Left Column: College Details */}
            <div className="form-col">
              <h3 className="section-title">🏢 Customer & Account Information</h3>

              <div className="form-group">
                <label className="form-label">College / Institution Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. National Institute of Technology"
                  value={formData.college_name || ''}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Instrumentation & Control"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Lab PC Activations *</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className="form-input"
                    value={formData.max_activations || 10}
                    onChange={(e) => setFormData({ ...formData, max_activations: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person / HOD</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Ramanathan"
                    value={formData.contact_person || ''}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 98401 23456"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="credentials-box">
                <h4 className="credentials-title">🔑 Lab Installation Credentials</h4>
                <p className="credentials-hint">
                  The client lab will enter these exact credentials in the popup during installation.
                </p>

                <div className="form-group">
                  <label className="form-label">College Email ID (Login ID) *</label>
                  <input
                    type="email"
                    className="form-input mono"
                    placeholder="e.g. hod.ice@nitt.edu"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="Set a password for this college"
                    value={formData.password_hash || ''}
                    onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-select"
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">Active (Permitted to install)</option>
                    <option value="suspended">Suspended (Blocked from installs)</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes / Order Ref</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PO-2026-NIT-089"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: 60 Products Checklist */}
            <div className="form-col">
              <div className="products-selection-header">
                <div>
                  <h3 className="section-title">
                    📦 Licensed Trainers & Simulators ({formData.products?.length || 0} / 60 Selected)
                  </h3>
                  <p className="products-hint">
                    Check the trainers supplied to this customer. Only these will be installed on their PCs.
                  </p>
                </div>
              </div>

              {/* Category Filter Pills & Search */}
              <div className="product-filter-bar">
                <input
                  type="text"
                  placeholder="🔍 Search product name or code (e.g. ACE-101, 403)..."
                  className="product-search-input"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />

                <div className="category-pills">
                  <button
                    type="button"
                    className={`cat-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('All')}
                  >
                    All ({productList.length})
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="quick-action-buttons">
                  <button type="button" className="btn-secondary-sm" onClick={handleSelectAllVisible}>
                    ✓ Select All in View
                  </button>
                  <button type="button" className="btn-secondary-sm" onClick={handleClearAllVisible}>
                    ✕ Clear in View
                  </button>
                </div>
              </div>

              {/* Scrollable Products List */}
              <div className="products-checklist-scroll">
                {filteredProducts.map((p) => {
                  const isChecked = (formData.products || []).includes(p.code);
                  return (
                    <label
                      key={p.id}
                      className={`product-checkbox-card ${isChecked ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.code)}
                      />
                      <div className="product-card-body">
                        <div className="product-card-top">
                          <span className="product-badge-id">{p.id}</span>
                          <span className="product-card-title">{p.name}</span>
                        </div>
                        <p className="product-card-desc">{p.description}</p>
                        <span className="product-card-cat">{p.category}</span>
                      </div>
                    </label>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="no-products-found">
                    No products matching "{productSearch}" in {selectedCategory}.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Customer' : 'Create & Allocate Products'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
