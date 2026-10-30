import React, { useState, useMemo } from 'react';
import { LIBRARY_COMPONENTS, type LibraryComponentDef } from './pidRigupData';
import { ComponentVisual } from './pidSymbols';
import './PidLibraryPanel.css';

interface PidLibraryPanelProps {
  viewMode: 'figure' | 'symbol';
  onAddComponent: (def: LibraryComponentDef) => void;
  onToggleCollapse?: () => void;
}

interface CategoryFolder {
  id: string;
  name: string;
  icon: string;
  categoryKeys: string[];
}

const CATEGORY_FOLDERS: CategoryFolder[] = [
  { id: 'all', name: 'All Symbols', icon: '📦', categoryKeys: ['tanks', 'pumps', 'valves', 'controllers', 'transmitters', 'accessories'] },
  { id: 'pipes', name: 'Pipes & Fittings', icon: '🪠', categoryKeys: ['valves'] },
  { id: 'tanks', name: 'Tanks & Vessels', icon: '🛢️', categoryKeys: ['tanks'] },
  { id: 'pumps', name: 'Pumps & Motors', icon: '⚙️', categoryKeys: ['pumps'] },
  { id: 'valves', name: 'Valves & Actuators', icon: '🚰', categoryKeys: ['valves'] },
  { id: 'converters', name: 'Signal Converters', icon: '⚡', categoryKeys: ['controllers'] },
  { id: 'air', name: 'Air Supply', icon: '💨', categoryKeys: ['accessories'] },
  { id: 'transmitters', name: 'Transmitters & Sensors', icon: '📡', categoryKeys: ['transmitters'] },
  { id: 'controllers', name: 'Controllers & Indicators', icon: '🎛️', categoryKeys: ['controllers'] },
];

export const PidLibraryPanel: React.FC<PidLibraryPanelProps> = ({
  viewMode,
  onAddComponent,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Filter components
  const filteredComponents = useMemo(() => {
    let list = LIBRARY_COMPONENTS;

    if (activeFolderId !== 'all') {
      if (activeFolderId === 'converters') {
        list = list.filter((c) => c.typeId === 'ip-converter');
      } else if (activeFolderId === 'air') {
        list = list.filter((c) => c.typeId === 'air-source');
      } else if (activeFolderId === 'controllers') {
        list = list.filter((c) => c.category === 'controllers' && c.typeId !== 'ip-converter');
      } else {
        const folder = CATEGORY_FOLDERS.find((f) => f.id === activeFolderId);
        if (folder) {
          list = list.filter((c) => folder.categoryKeys.includes(c.category));
        }
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tag.toLowerCase().includes(q) ||
          c.typeId.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeFolderId, searchQuery]);

  const handleDragStart = (e: React.DragEvent, def: LibraryComponentDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ typeId: def.typeId }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="pid-library-panel">
      {/* ── Symbol Factory Header ── */}
      <div className="library-header">
        <div className="library-brand-row">
          <span className="library-logo-icon">🏭</span>
          <div style={{ flex: '1 1 auto' }}>
            <h1 className="library-title">Symbol Factory</h1>
            <span className="library-subtitle">Process &amp; P&amp;ID Library</span>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              className="pane-collapse-btn"
              onClick={onToggleCollapse}
              title="Hide Symbol Library"
            >
              ◀
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="library-search-box">
          <input
            type="text"
            className="library-search-input"
            placeholder="Search symbols, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category Folders / Tree (Figure 2 Style) ── */}
      <div className="library-category-bar">
        <button
          type="button"
          className="category-accordion-toggle"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        >
          <span>Categories ({CATEGORY_FOLDERS.length - 1})</span>
          <span className="accordion-arrow">{isAccordionOpen ? '▼' : '▶'}</span>
        </button>

        {isAccordionOpen && (
          <div className="category-folders-list">
            {CATEGORY_FOLDERS.map((folder) => {
              const count =
                folder.id === 'all'
                  ? LIBRARY_COMPONENTS.length
                  : folder.id === 'converters'
                  ? LIBRARY_COMPONENTS.filter((c) => c.typeId === 'ip-converter').length
                  : folder.id === 'air'
                  ? LIBRARY_COMPONENTS.filter((c) => c.typeId === 'air-source').length
                  : folder.id === 'controllers'
                  ? LIBRARY_COMPONENTS.filter((c) => c.category === 'controllers' && c.typeId !== 'ip-converter').length
                  : LIBRARY_COMPONENTS.filter((c) => folder.categoryKeys.includes(c.category)).length;

              const isActive = activeFolderId === folder.id;

              return (
                <button
                  key={folder.id}
                  type="button"
                  className={`category-folder-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveFolderId(folder.id)}
                >
                  <span className="folder-icon">{folder.icon}</span>
                  <span className="folder-name">{folder.name}</span>
                  <span className="folder-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Compact Symbol Grid (Figure 2 Style: Clean Grid of Icons) ── */}
      <div className="library-symbols-grid-container">
        <div className="symbols-section-banner">
          <span className="banner-label">
            {CATEGORY_FOLDERS.find((f) => f.id === activeFolderId)?.name || 'Symbols'}
          </span>
          <span className="banner-count">{filteredComponents.length} items</span>
        </div>

        <div className="library-symbols-grid">
          {filteredComponents.map((def) => {
            const fluidCount = def.ports.filter((p) => p.type === 'fluid').length;
            const pneuCount = def.ports.filter((p) => p.type === 'pneumatic').length;
            const elecCount = def.ports.filter((p) => p.type === 'electrical').length;

            return (
              <div
                key={def.typeId}
                className="symbol-factory-card"
                draggable
                onDragStart={(e) => handleDragStart(e, def)}
                onClick={() => onAddComponent(def)}
                title={`${def.name} (${def.tag})\nPorts: ${fluidCount > 0 ? `💧 ${fluidCount} Fluid ` : ''}${pneuCount > 0 ? `💨 ${pneuCount} Air ` : ''}${elecCount > 0 ? `⚡ ${elecCount} Electrical` : ''}\nClick or drag to place onto canvas`}
              >
                {/* Standard Sized Vector Icon Container */}
                <div className="symbol-thumb-container">
                  <ComponentVisual def={def} mode={viewMode} width={42} height={42} />
                </div>

                {/* 2-line Compact Description / Title */}
                <span className="symbol-card-name">
                  {def.name}
                </span>
              </div>
            );
          })}
        </div>

        {filteredComponents.length === 0 && (
          <div className="library-empty-search">
            <span className="empty-icon">🔍</span>
            <span>No symbols found for "{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* ── Footer Legend / Info ── */}
      <div className="library-footer-legend">
        <div className="legend-item">
          <span className="legend-dot dot-fluid" />
          <span>Fluid</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-pneumatic" />
          <span>Air</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-electrical" />
          <span>4-20mA</span>
        </div>
      </div>
    </aside>
  );
};
