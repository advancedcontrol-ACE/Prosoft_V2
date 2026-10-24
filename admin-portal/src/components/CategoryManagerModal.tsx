import React, { useState } from 'react';
import { Product } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  products: Product[];
  onAddCategory: (categoryName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string, targetCategory?: string) => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  if (!isOpen) return null;

  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingInput, setEditingInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Category name cannot be empty.' });
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setStatusMsg({ type: 'error', text: `Category "${trimmed}" already exists.` });
      return;
    }

    onAddCategory(trimmed);
    setNewCatName('');
    setStatusMsg({ type: 'success', text: `Category "${trimmed}" successfully added!` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const startRename = (cat: string) => {
    setEditingCat(cat);
    setEditingInput(cat);
    setStatusMsg(null);
  };

  const cancelRename = () => {
    setEditingCat(null);
    setEditingInput('');
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmedNew = editingInput.trim();
    if (!trimmedNew) {
      setStatusMsg({ type: 'error', text: 'New category name cannot be empty.' });
      return;
    }
    if (trimmedNew === oldName) {
      cancelRename();
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmedNew.toLowerCase() && c !== oldName)) {
      setStatusMsg({ type: 'error', text: `Category "${trimmedNew}" already exists.` });
      return;
    }

    try {
      setIsProcessing(true);
      await onRenameCategory(oldName, trimmedNew);
      setStatusMsg({
        type: 'success',
        text: `Renamed "${oldName}" to "${trimmedNew}" across all associated products!`,
      });
      cancelRename();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to rename category.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (cat: string) => {
    const count = products.filter((p) => p.category === cat).length;
    let targetCat: string | undefined = undefined;

    if (count > 0) {
      const fallback = categories.find((c) => c !== cat) || 'Basic Process Trainers';
      const confirmed = window.confirm(
        `Category "${cat}" currently contains ${count} products.\n\nDeleting this category will reassign all ${count} products to "${fallback}".\n\nDo you want to proceed?`
      );
      if (!confirmed) return;
      targetCat = fallback;
    } else {
      const confirmed = window.confirm(`Are you sure you want to delete category "${cat}"?`);
      if (!confirmed) return;
    }

    try {
      setIsProcessing(true);
      await onDeleteCategory(cat, targetCat);
      setStatusMsg({
        type: 'success',
        text: `Category "${cat}" deleted successfully!`,
      });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete category.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-card category-manager-card">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">🏷️ Manage Product Categories</h2>
            <p className="modal-subtitle">
              Add new categories or edit/rename existing categories across the catalog.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMsg && (
          <div className={statusMsg.type === 'error' ? 'modal-alert-error' : 'modal-alert-success figure-alert'}>
            {statusMsg.text}
          </div>
        )}

        {/* Content Body */}
        <div className="category-manager-body">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="add-category-bar">
            <input
              type="text"
              className="figure-input"
              placeholder="Enter new category name (e.g. Optical Systems & Sensors)..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              disabled={isProcessing}
            />
            <button type="submit" className="btn-primary" disabled={isProcessing || !newCatName.trim()}>
              + Add Category
            </button>
          </form>

          {/* Categories List */}
          <div className="category-items-list">
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              const isEditing = editingCat === cat;

              return (
                <div key={cat} className={`cat-manager-row ${isEditing ? 'is-editing' : ''}`}>
                  {isEditing ? (
                    <div className="cat-inline-edit-form">
                      <input
                        type="text"
                        className="figure-input cat-edit-input"
                        value={editingInput}
                        onChange={(e) => setEditingInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveRename(cat);
                          } else if (e.key === 'Escape') {
                            cancelRename();
                          }
                        }}
                        autoFocus
                      />
                      <div className="cat-edit-actions">
                        <button
                          type="button"
                          className="btn-primary-sm"
                          onClick={() => handleSaveRename(cat)}
                          disabled={isProcessing}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-sm"
                          onClick={cancelRename}
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="cat-row-info">
                        <span className="cat-row-name">{cat}</span>
                        <span className="cat-row-count-badge">
                          {count} {count === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>

                      <div className="cat-row-actions">
                        <button
                          type="button"
                          className="btn-action-icon btn-edit"
                          onClick={() => startRename(cat)}
                          title="Rename this category"
                          disabled={isProcessing}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon btn-delete"
                          onClick={() => handleDelete(cat)}
                          title="Delete category"
                          disabled={isProcessing}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-stats">
            Total Categories: <strong>{categories.length}</strong>
          </div>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
