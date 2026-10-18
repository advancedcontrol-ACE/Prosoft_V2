import React, { useState, useRef, useCallback, useEffect } from 'react';
import { menuConfig } from '../../config/menuData';
import type { MenuItem, TopLevelMenu } from '../../config/menuData';
import './MenuBar.css';

// ── Types ──────────────────────────────────────────────────────
interface MenuBarProps {
  onAction?: (action: string, label: string) => void;
}

// ── CascadeMenu — recursive sub-menu renderer ──────────────────
interface CascadeMenuProps {
  items: MenuItem[];
  depth: number;
  onAction?: (action: string, label: string) => void;
  onClose: () => void;
}

const CascadeMenu: React.FC<CascadeMenuProps> = ({ items, depth, onAction, onClose }) => {
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (item: MenuItem) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (item.children) {
      setActiveChild(item.id);
    } else {
      timerRef.current = setTimeout(() => {
        setActiveChild(null);
      }, 150);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveChild(null);
    }, 350);
  };

  const handleClick = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (!item.enabled || item.type === 'separator') return;
    if (item.children) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setActiveChild(item.id);
    } else {
      onAction?.(item.action ?? item.id, item.label);
      onClose();
    }
  };

  return (
    <ul className={`cascade-menu depth-${depth}`} role="menu" onClick={(e) => e.stopPropagation()}>
      {items.map((item) => {
        // ── Render separator ──────────────────────────────────
        if (item.type === 'separator') {
          return <li key={item.id} className="menu-separator" role="separator" />;
        }

        // ── Render normal item ────────────────────────────────
        return (
          <li
            key={item.id}
            className={[
              'cascade-item',
              !item.enabled ? 'disabled' : '',
              activeChild === item.id ? 'open' : '',
            ].join(' ')}
            role="menuitem"
            aria-disabled={!item.enabled}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => handleClick(e, item)}
          >
            <span className="item-label">{item.label}</span>
            {item.children && <span className="arrow">▶</span>}

            {/* Child submenu */}
            {item.children && activeChild === item.id && (
              <div className="submenu-wrapper" onClick={(e) => e.stopPropagation()}>
                <CascadeMenu
                  items={item.children}
                  depth={depth + 1}
                  onAction={onAction}
                  onClose={onClose}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// ── TopLevelItem — one button in the menu bar ──────────────────
interface TopLevelItemProps {
  menu: TopLevelMenu;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAction?: (action: string, label: string) => void;
}

const TopLevelItem: React.FC<TopLevelItemProps> = ({
  menu, isOpen, onOpen, onClose, onAction,
}) => {
  const btnRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={btnRef}
      className={`top-menu-item ${isOpen ? 'active' : ''}`}
      onMouseEnter={onOpen}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      role="menuitem"
      aria-haspopup="true"
      aria-expanded={isOpen}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
    >
      <span>{menu.label}</span>

      {isOpen && (
        <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
          <CascadeMenu
            items={menu.items}
            depth={0}
            onAction={onAction}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
};

// ── MenuBar — main export ──────────────────────────────────────
const MenuBar: React.FC<MenuBarProps> = ({ onAction }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenMenu(null), []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!openMenu) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) close();
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [openMenu, close]);

  return (
    <nav className="menu-bar" ref={barRef} role="menubar">
      {menuConfig.map((menu) => (
        <TopLevelItem
          key={menu.id}
          menu={menu}
          isOpen={openMenu === menu.id}
          onOpen={() => setOpenMenu(menu.id)}
          onClose={close}
          onAction={onAction}
        />
      ))}
    </nav>
  );
};

export default MenuBar;
