import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../productsData';
import { CategoryManagerModal } from './CategoryManagerModal';

interface ProductCatalogModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: Partial<Product>, isEdit: boolean) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onRenameCategory?: (oldCat: string, newCat: string) => Promise<void>;
  onDeleteCategory?: (cat: string, targetCat?: string) => Promise<void>;
}

const DEFAULT_NEW_PRODUCT: Partial<Product> = {
  id: '',
  code: '',
  name: '',
  category: 'Basic Process Trainers',
  version: '2.0.0',
  description: '',
};

const STORAGE_KEY_CUSTOM_CATS = 'ace_prosoft_custom_categories';

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  products,
  isOpen,
  onClose,
  onSaveProduct,
  onDeleteProduct,
  onRenameCategory,
  onDeleteCategory,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formData, setFormData] = useState<Partial<Product>>(DEFAULT_NEW_PRODUCT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Category management state
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_CATS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [inlineCategoryInput, setInlineCategoryInput] = useState('');

  // Persist custom categories
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_CATS, JSON.stringify(customCategories));
    } catch (e) {
      console.warn('Failed to save custom categories:', e);
    }
  }, [customCategories]);

  // Combined unique list of categories (Default + Products categories + Custom categories)
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    PRODUCT_CATEGORIES.forEach((c) => set.add(c));
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    customCategories.forEach((c) => set.add(c));
    return Array.from(set);
  }, [products, customCategories]);

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleStartAdd = () => {
    setFormData(DEFAULT_NEW_PRODUCT);
    setIsEditMode(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddingCategoryInline(false);
  };

  const handleStartEdit = (p: Product) => {
    setFormData({ ...p });
    setIsEditMode(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddingCategoryInline(false);
  };

  const handleCancelForm = () => {
    setFormData(DEFAULT_NEW_PRODUCT);
    setIsEditMode(false);
    setErrorMsg('');
    setIsAddingCategoryInline(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${id} - ${name}" from the master product catalog?`)) {
      try {
        await onDeleteProduct(id);
        if (formData.id === id) {
          handleCancelForm();
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  // Add Category Handler (both modal and inline)
  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setFormData((prev) => ({ ...prev, category: trimmed }));
  };

  const handleConfirmInlineAdd = () => {
    const trimmed = inlineCategoryInput.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }
    handleAddCategory(trimmed);
    setInlineCategoryInput('');
    setIsAddingCategoryInline(false);
    setErrorMsg('');
    setSuccessMsg(`Category "${trimmed}" added and selected.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Rename Category Handler (updates in Supabase & local state)
  const handleRenameCategory = async (oldCat: string, newCat: string) => {
    if (onRenameCategory) {
      await onRenameCategory(oldCat, newCat);
    }
    // Update custom categories list if present
    setCustomCategories((prev) =>
      prev.map((c) => (c === oldCat ? newCat : c))
    );
    // If current editing product had this category, update it
    if (formData.category === oldCat) {
      setFormData((prev) => ({ ...prev, category: newCat }));
    }
    if (selectedCategory === oldCat) {
      setSelectedCategory(newCat);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (cat: string, targetCat?: string) => {
    if (onDeleteCategory) {
      await onDeleteCategory(cat, targetCat);
    }
    setCustomCategories((prev) => prev.filter((c) => c !== cat));
    if (formData.category === cat) {
      setFormData((prev) => ({ ...prev, category: targetCat || 'Basic Process Trainers' }));
    }
    if (selectedCategory === cat) {
      setSelectedCategory('All');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData?.id?.trim()) {
      setErrorMsg('Product ID (e.g. ACE-117) is required.');
      return;
    }
    if (!formData?.code?.trim()) {
      setErrorMsg('Internal Code (e.g. ace117) is required.');
      return;
    }
    if (!formData?.name?.trim()) {
      setErrorMsg('Product Name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const exists = products.some((p) => p.id === formData.id);
      await onSaveProduct(formData, exists || isEditMode);

      setSuccessMsg(`Product "${formData.id}" successfully saved!`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset form to ready state
      setFormData(DEFAULT_NEW_PRODUCT);
      setIsEditMode(false);
      setIsAddingCategoryInline(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <div className="modal-card catalog-modal-card-fullscreen">
          {/* Modal Top Header */}
          <div className="modal-header catalog-fullscreen-header">
            <div className="catalog-header-left">
              <h2 className="modal-title">📖 Advanced Control Equipments — Master Product Catalog</h2>
              <p className="modal-subtitle">
                Manage all trainers, simulators, and instrumentation systems ({products.length} Products in Database).
              </p>
            </div>
            <div className="catalog-header-right">
              <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          {/* Two-Halves Split Screen Body */}
          <div className="catalog-split-container">
            {/* ============================================================== */}
            {/* LEFT HALF: Product Entry / Edit Form (Matching User Figure)   */}
            {/* ============================================================== */}
            <div className="catalog-split-lhs">
              <div className={`catalog-figure-panel ${isEditMode ? 'mode-edit' : 'mode-add'}`}>
                {/* Green Card Header */}
                <div className="catalog-figure-header">
                  <div className="catalog-figure-title-wrap">
                    <h3 className="catalog-figure-title">
                      {isEditMode ? (
                        <>
                          <span className="figure-icon">✏️</span> Edit Product Details: <span className="mono-title">{formData.id}</span>
                        </>
                      ) : (
                        <>
                          <span className="figure-icon">+</span> Add New Product to Catalog
                        </>
                      )}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn-figure-cancel"
                    onClick={handleCancelForm}
                  >
                    {isEditMode ? 'Cancel Edit' : 'Cancel'}
                  </button>
                </div>

                {/* Feedback Alerts */}
                {errorMsg && <div className="modal-alert-error figure-alert">{errorMsg}</div>}
                {successMsg && <div className="modal-alert-success figure-alert">{successMsg}</div>}

                {/* Form Body matching the figure */}
                <form onSubmit={handleSave} className="catalog-figure-form">
                  {/* Row 1: Product ID & Internal Code */}
                  <div className="figure-row">
                    <div className="figure-group">
                      <label className="figure-label">Product ID * (e.g. ACE-117)</label>
                      <input
                        type="text"
                        className="figure-input mono"
                        placeholder="ACE-117"
                        value={formData.id || ''}
                        onChange={(e) => {
                          const idVal = e.target.value.toUpperCase();
                          const codeVal = idVal.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setFormData({
                            ...formData,
                            id: idVal,
                            code: formData.code ? formData.code : codeVal,
                          });
                        }}
                        required
                      />
                    </div>

                    <div className="figure-group">
                      <label className="figure-label">Internal Code * (e.g. ace117)</label>
                      <input
                        type="text"
                        className="figure-input mono"
                        placeholder="ace117"
                        value={formData.code || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toLowerCase() })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Full Product Name & Category with Edit/Add Options */}
                  <div className="figure-row">
                    <div className="figure-group">
                      <label className="figure-label">Full Product Name *</label>
                      <input
                        type="text"
                        className="figure-input"
                        placeholder="e.g. Bioreactor Temperature & pH Control Trainer"
                        value={formData.name || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    {/* Category Selection with Edit & Add Provision */}
                    <div className="figure-group">
                      <div className="figure-label-row">
                        <label className="figure-label">Category *</label>
                        <div className="category-label-actions">
                          <button
                            type="button"
                            className="btn-label-link"
                            onClick={() => setIsAddingCategoryInline(!isAddingCategoryInline)}
                            title="Add a new category"
                          >
                            {isAddingCategoryInline ? '✕ Select' : '+ Add'}
                          </button>
                          <button
                            type="button"
                            className="btn-label-link edit-link"
                            onClick={() => setIsCategoryManagerOpen(true)}
                            title="Edit and rename all categories"
                          >
                            ✏️ Edit Categories
                          </button>
                        </div>
                      </div>

                      {/* Inline Category Quick Add Input */}
                      {isAddingCategoryInline ? (
                        <div className="category-inline-add-row">
                          <input
                            type="text"
                            className="figure-input"
                            placeholder="Type new category name..."
                            value={inlineCategoryInput}
                            onChange={(e) => setInlineCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmInlineAdd();
                              } else if (e.key === 'Escape') {
                                setIsAddingCategoryInline(false);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-inline-confirm"
                            onClick={handleConfirmInlineAdd}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            className="btn-inline-cancel"
                            onClick={() => setIsAddingCategoryInline(false)}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <select
                          className="figure-select"
                          value={formData.category || (allCategories[0] || 'Basic Process Trainers')}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsAddingCategoryInline(true);
                            } else {
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }}
                        >
                          {allCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__ADD_NEW__">✨ + Add New Category...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Product Description */}
                  <div className="figure-group">
                    <label className="figure-label">Product Description / Technical Specifications</label>
                    <textarea
                      className="figure-textarea"
                      rows={4}
                      placeholder="Describe the trainer loop, hardware sensors, PLC/controller, and experiments supported..."
                      value={formData.description || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  {/* Row 4: Action Buttons */}
                  <div className="figure-actions">
                    <button
                      type="button"
                      className="btn-figure-action-cancel"
                      onClick={handleCancelForm}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-figure-action-save"
                      disabled={isSaving}
                    >
                      {isSaving
                        ? 'Saving...'
                        : isEditMode
                        ? 'Save Changes to Catalog'
                        : 'Save Product to Catalog'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Reference & Helpful Guidance Box */}
              <div className="catalog-guidelines-box">
                <div className="guideline-header">
                  <span className="guideline-icon">ℹ️</span>
                  <strong>Catalog Architecture & Entitlement Notes</strong>
                </div>
                <ul className="guideline-list">
                  <li>
                    <strong>Product ID:</strong> Customer-facing model number (e.g. <code>ACE-101</code>, <code>ACE-403</code>).
                  </li>
                  <li>
                    <strong>Internal Code:</strong> Lowercase identifier used by installer and database license entitlement (e.g. <code>ace101</code>, <code>sim-ace403</code>).
                  </li>
                  <li>
                    <strong>Category Customization:</strong> Use <strong>"+ Add"</strong> to enter a custom category or <strong>"✏️ Edit Categories"</strong> to rename or organize series.
                  </li>
                </ul>
                {isEditMode && (
                  <div className="guideline-edit-notice">
                    Currently editing <strong>{formData.id}</strong>.{' '}
                    <button type="button" className="btn-link-action" onClick={handleStartAdd}>
                      Switch back to adding a new product
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT HALF: List and Search Option                             */}
            {/* ============================================================== */}
            <div className="catalog-split-rhs">
              {/* Search Input Bar */}
              <div className="rhs-search-box">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by product ID, name, code, or description..."
                    className="search-input-rhs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills (Dynamically reflects all updated/added categories) */}
              <div className="rhs-category-pills">
                <button
                  type="button"
                  className={`cat-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('All')}
                >
                  All ({products.length})
                </button>
                {allCategories.map((cat) => {
                  const count = products.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* List Status Summary */}
              <div className="rhs-status-bar">
                <span className="rhs-count-text">
                  Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> Products
                  {selectedCategory !== 'All' && <span> in <em>{selectedCategory}</em></span>}
                  {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
                </span>
                <div className="rhs-status-actions">
                  <button
                    type="button"
                    className="btn-edit-cats-link"
                    onClick={() => setIsCategoryManagerOpen(true)}
                    title="Edit and manage all categories"
                  >
                    🏷️ Edit Categories
                  </button>
                  <button
                    type="button"
                    className="btn-refresh-add"
                    onClick={handleStartAdd}
                    title="Prepare form to add a new product"
                  >
                    + New Product
                  </button>
                </div>
              </div>

              {/* Scrollable Products List */}
              <div className="rhs-products-scroll-list">
                {filteredProducts.map((p) => {
                  const isCurrentlySelected = isEditMode && formData.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`rhs-product-card ${isCurrentlySelected ? 'is-active-edit' : ''}`}
                    >
                      <div className="rhs-card-header">
                        <div className="rhs-card-title-group">
                          <span className="catalog-id-badge">{p.id}</span>
                          <h4 className="rhs-card-name">{p.name}</h4>
                          <span className="catalog-cat-badge">{p.category}</span>
                          {isCurrentlySelected && (
                            <span className="badge-currently-editing">Currently Editing</span>
                          )}
                        </div>

                        <div className="rhs-card-actions">
                          <button
                            type="button"
                            className="btn-action-icon btn-edit"
                            title="Edit this product in the left form"
                            onClick={() => handleStartEdit(p)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon btn-delete"
                            title="Delete product"
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <p className="rhs-card-desc">
                        {p.description || 'No detailed technical specifications provided.'}
                      </p>

                      <div className="rhs-card-footer">
                        <span className="rhs-code-tag mono">Code: {p.code}</span>
                        {p.version && <span className="rhs-code-tag mono">• Ver: {p.version}</span>}
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="no-products-found-card">
                    <div className="no-products-icon">🔎</div>
                    <h4>No matching products found</h4>
                    <p>
                      No products found matching "<strong>{searchQuery}</strong>" in{' '}
                      <em>{selectedCategory}</em>.
                    </p>
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Bottom Footer */}
          <div className="modal-footer catalog-fullscreen-footer">
            <div className="footer-stats">
              <span>
                Master Catalog: <strong>{products.length} Products Registered</strong> across <strong>{allCategories.length} Categories</strong>
              </span>
            </div>
            <button className="btn-primary" onClick={onClose}>
              Close Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={allCategories}
        products={products}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </>
  );
};
