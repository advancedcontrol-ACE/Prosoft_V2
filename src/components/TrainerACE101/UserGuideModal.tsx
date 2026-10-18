import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { GUIDE_PAGES, type GuidePageItem } from './guideData/guidePages';
import './UserGuideModal.css';

interface NavChapter {
  id: string;
  title: string;
  badge?: string;
  pages: { id: string; title: string; sectionNumber: string }[];
}

const NAV_CHAPTERS: NavChapter[] = [
  {
    id: 'intro',
    title: 'ACE 101 Overview',
    badge: 'Intro',
    pages: [
      { id: 'sec-overview', title: 'ACE 101 Level Process Trainer Overview', sectionNumber: 'Intro' },
    ],
  },
  {
    id: 'ch1',
    title: '1. Product Details',
    badge: 'Ch. 1',
    pages: [
      { id: 'sec-1-1', title: '1.1 System Description', sectionNumber: '1.1' },
      { id: 'sec-1-2', title: '1.2 Specification Details', sectionNumber: '1.2' },
      { id: 'sec-1-3', title: '1.3 P&I Diagram & Flow Arrangement', sectionNumber: '1.3' },
      { id: 'sec-1-4', title: '1.4 Hardware & Component Overview', sectionNumber: '1.4' },
      { id: 'sec-1-5', title: '1.5 Electrical & Utility Requirements', sectionNumber: '1.5' },
      { id: 'sec-1-6', title: '1.6 Warranty Details', sectionNumber: '1.6' },
    ],
  },
  {
    id: 'ch2',
    title: '2. Process Control Principles',
    badge: 'Ch. 2',
    pages: [
      { id: 'sec-2-1', title: '2.1 Essentials of Process Control', sectionNumber: '2.1' },
      { id: 'sec-2-2', title: '2.2 Feedback Control Architecture', sectionNumber: '2.2' },
      { id: 'sec-2-3-onoff', title: '2.3.1 On / Off Control Mode', sectionNumber: '2.3.1' },
      { id: 'sec-2-3-p', title: '2.3.2 Proportional Mode (P Mode)', sectionNumber: '2.3.2' },
      { id: 'sec-2-3-pi', title: '2.3.3 Proportional-Integral (PI Mode)', sectionNumber: '2.3.3' },
      { id: 'sec-2-3-pd', title: '2.3.4 Proportional-Derivative (PD Mode)', sectionNumber: '2.3.4' },
      { id: 'sec-2-3-pid', title: '2.3.5 Three-Mode Controller (PID Mode)', sectionNumber: '2.3.5' },
      { id: 'sec-2-4', title: '2.4 Test Inputs & Transient Response', sectionNumber: '2.4' },
      { id: 'sec-2-5-1', title: '2.5.1 Open Loop Tuning (Reaction Curve)', sectionNumber: '2.5.1' },
      { id: 'sec-2-5-2', title: '2.5.2 Closed Loop Tuning (Ultimate Gain)', sectionNumber: '2.5.2' },
      { id: 'sec-2-6', title: '2.6 Stability Analysis & Bode Plots', sectionNumber: '2.6' },
      { id: 'sec-2-7', title: '2.7 Mathematical Modeling of Tank Level', sectionNumber: '2.7' },
    ],
  },
  {
    id: 'ch3',
    title: '3. Software Interface & Features',
    badge: 'Ch. 3',
    pages: [
      { id: 'sec-3-1', title: '3.1 Hardware & COM Port Connection', sectionNumber: '3.1' },
      { id: 'sec-3-2', title: '3.2 Dashboard Navigation & Features', sectionNumber: '3.2' },
      { id: 'sec-3-3', title: '3.3 Remote Lab, Firebase Cloud Sync & MQTT Telemetry', sectionNumber: '3.3' },
    ],
  },
  {
    id: 'ch4',
    title: '4. Experiments & Procedures',
    badge: 'Ch. 4',
    pages: [
      { id: 'sec-4-1', title: '4.1 Level Transmitter Calibration', sectionNumber: '4.1' },
      { id: 'sec-4-2', title: '4.2 General Operating Procedure (Prosoft V2 Navigation)', sectionNumber: '4.2' },
      { id: 'sec-4-2-1', title: '4.2.1 Open Loop Experiment', sectionNumber: '4.2.1' },
      { id: 'sec-4-2-2', title: '4.2.2 On / Off Control Experiment', sectionNumber: '4.2.2' },
      { id: 'sec-4-2-3', title: '4.2.3 P Mode Control Experiment', sectionNumber: '4.2.3' },
      { id: 'sec-4-2-4', title: '4.2.4 PI Mode Control Experiment', sectionNumber: '4.2.4' },
      { id: 'sec-4-2-5', title: '4.2.5 PD Mode Control Experiment', sectionNumber: '4.2.5' },
      { id: 'sec-4-2-6', title: '4.2.6 PID Mode Control Experiment', sectionNumber: '4.2.6' },
      { id: 'sec-4-2-7', title: '4.2.7 Open Loop Tuning Experiment', sectionNumber: '4.2.7' },
      { id: 'sec-4-2-8', title: '4.2.8 Closed Loop Tuning Experiment', sectionNumber: '4.2.8' },
      { id: 'sec-4-3', title: '4.3 Empirical Model Estimation (FOPDT)', sectionNumber: '4.3' },
    ],
  },
  {
    id: 'ch5',
    title: '5. Component Specifications',
    badge: 'Ch. 5',
    pages: [
      { id: 'sec-5-1', title: '5.1 WIKA A-10 Pressure Transmitter', sectionNumber: '5.1' },
      { id: 'sec-5-2', title: '5.2 Delta DTB9696 Controller & Terminals', sectionNumber: '5.2' },
      { id: 'sec-5-3', title: '5.3 Control Air Type 500 I/P Converter', sectionNumber: '5.3' },
      { id: 'sec-5-4', title: '5.4 Pneucon Pneumatic Control Valve', sectionNumber: '5.4' },
      { id: 'sec-5-5', title: '5.5 Eureka Industrial Rotameter', sectionNumber: '5.5' },
    ],
  },
  {
    id: 'ch6',
    title: '6. Controller Settings & Modbus Map',
    badge: 'Ch. 6',
    pages: [
      { id: 'sec-6-1', title: '6.1 Default Regulation Settings', sectionNumber: '6.1' },
      { id: 'sec-6-2', title: '6.2 Modbus Address Map (Registers 4096-4114)', sectionNumber: '6.2' },
    ],
  },
  {
    id: 'ch7',
    title: '7. Technical Support & Manufacturer',
    badge: 'Ch. 7',
    pages: [
      { id: 'sec-7-1', title: '7.1 Introduction & 7.2 Vision and Values', sectionNumber: '7.1' },
      { id: 'sec-7-3', title: '7.3 Product Range Across All Series', sectionNumber: '7.3' },
      { id: 'sec-7-4', title: '7.4 Customer List & Technical Support', sectionNumber: '7.4' },
    ],
  },
];

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  // Current active page state
  const [currentPageId, setCurrentPageId] = useState<string>('sec-overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    intro: true,
    ch1: true,
    ch2: true,
    ch3: true,
    ch4: true,
    ch5: true,
    ch6: true,
    ch7: true,
  });

  const readerAreaRef = useRef<HTMLDivElement>(null);

  // Close on Escape key and support Arrow keys for page flipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && (e.altKey || e.ctrlKey)) {
        // Next page
        const idx = GUIDE_PAGES.findIndex((p) => p.id === currentPageId);
        if (idx >= 0 && idx < GUIDE_PAGES.length - 1) {
          goToPage(GUIDE_PAGES[idx + 1].id);
        }
      } else if (e.key === 'ArrowLeft' && (e.altKey || e.ctrlKey)) {
        // Prev page
        const idx = GUIDE_PAGES.findIndex((p) => p.id === currentPageId);
        if (idx > 0) {
          goToPage(GUIDE_PAGES[idx - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentPageId]);

  // Navigate to a page and scroll reader to top
  const goToPage = useCallback((pageId: string) => {
    setCurrentPageId(pageId);
    if (readerAreaRef.current) {
      readerAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Automatically expand the parent chapter in the sidebar
    for (const ch of NAV_CHAPTERS) {
      if (ch.pages.some((p) => p.id === pageId)) {
        setExpandedChapters((prev) => ({ ...prev, [ch.id]: true }));
        break;
      }
    }
  }, []);

  // Find active, previous, and next page objects
  const activePageIndex = useMemo(() => {
    const idx = GUIDE_PAGES.findIndex((p) => p.id === currentPageId);
    return idx >= 0 ? idx : 1; // default to overview
  }, [currentPageId]);

  const currentPage: GuidePageItem = GUIDE_PAGES[activePageIndex] || GUIDE_PAGES[1];
  const prevPage: GuidePageItem | null = activePageIndex > 0 ? GUIDE_PAGES[activePageIndex - 1] : null;
  const nextPage: GuidePageItem | null =
    activePageIndex < GUIDE_PAGES.length - 1 ? GUIDE_PAGES[activePageIndex + 1] : null;

  // Toggle chapter expansion in sidebar
  const toggleChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Expand or collapse all chapters
  const setAllChapters = (expand: boolean) => {
    const all: Record<string, boolean> = {};
    NAV_CHAPTERS.forEach((ch) => {
      all[ch.id] = expand;
    });
    setExpandedChapters(all);
  };

  // Filtered navigation list based on search query
  const filteredNavChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NAV_CHAPTERS;

    return NAV_CHAPTERS.map((ch) => {
      const matchChapter = ch.title.toLowerCase().includes(q);
      const matchedPages = ch.pages.filter(
        (p) => p.title.toLowerCase().includes(q) || p.sectionNumber.toLowerCase().includes(q)
      );

      if (matchChapter || matchedPages.length > 0) {
        return {
          ...ch,
          pages: matchedPages.length > 0 ? matchedPages : ch.pages,
        };
      }
      return null;
    }).filter(Boolean) as NavChapter[];
  }, [searchQuery]);

  if (!isOpen) return null;

  const isQuickRef = currentPageId === 'quick-ref';

  return (
    <div
      className={`userguide-modal-backdrop ${isFullScreen ? 'is-fullscreen' : ''}`}
      onClick={isFullScreen ? undefined : onClose}
    >
      <div
        className={`userguide-modal-window ${isFullScreen ? 'is-fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Title Bar ────────────────────────────────────────── */}
        <div className="userguide-modal-titlebar">
          <div className="titlebar-left">
            <img src="/images/user_guide_icon.png" alt="User Guide" className="titlebar-icon-img" />
            <span className="titlebar-title">ACE 101 Level Process Trainer — Technical Manual</span>
            <span className="titlebar-badge">
              {isQuickRef ? '⚡ Quick Reference' : `Page ${currentPage.pageNumber} of ${GUIDE_PAGES.length}`}
            </span>
          </div>

          <div className="titlebar-center">
            {/* Quick Breadcrumb in Titlebar */}
            <span className="titlebar-breadcrumb">
              {currentPage.chapterTitle} &rsaquo; <strong>{currentPage.title}</strong>
            </span>
          </div>

          <div className="titlebar-actions">
            {/* Toggle Quick Reference Button (As done in first iteration) */}
            <button
              type="button"
              className={`view-mode-btn ${isQuickRef ? 'active' : ''}`}
              onClick={() => goToPage(isQuickRef ? 'sec-overview' : 'quick-ref')}
              title={isQuickRef ? 'Return to full manual' : 'View quick reference & register cheat sheet'}
            >
              {isQuickRef ? '📘 Full Manual' : '⚡ Quick Reference'}
            </button>

            {/* Quick Prev / Next Page Buttons in Title Bar */}
            <div className="titlebar-nav-buttons">
              <button
                type="button"
                className="nav-icon-btn"
                disabled={!prevPage}
                onClick={() => prevPage && goToPage(prevPage.id)}
                title={prevPage ? `Previous Page: ${prevPage.title}` : 'First Page'}
              >
                ◀ Prev
              </button>
              <button
                type="button"
                className="nav-icon-btn"
                disabled={!nextPage}
                onClick={() => nextPage && goToPage(nextPage.id)}
                title={nextPage ? `Next Page: ${nextPage.title}` : 'Last Page'}
              >
                Next ▶
              </button>
            </div>

            {/* Download PDF Button */}
            <a
              href="/docs/ACE101.pdf"
              download="ACE101_User_Guide.pdf"
              className="action-btn download-btn"
              title="Download original offline PDF (64 pages)"
            >
              📥 PDF
            </a>

            {/* Full Frame / Windowed Toggle Button */}
            <button
              type="button"
              className="titlebar-window-btn"
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? 'Restore Window Size' : 'Fit to Entire Frame'}
            >
              {isFullScreen ? '🗗' : '🗖'}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              title="Close User Guide (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Modal Body: Split Navigation + Single-Page Reader ─── */}
        <div className="userguide-modal-body">
          {/* Left Sidebar: Interactive Outline Tree */}
          <aside className="userguide-sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">📑 Table of Contents</span>
              <div className="sidebar-tools">
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setAllChapters(true)}
                  title="Expand all chapters"
                >
                  Expand
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setAllChapters(false)}
                  title="Collapse all chapters"
                >
                  Collapse
                </button>
              </div>
            </div>

            {/* Search Filter Box */}
            <div className="sidebar-search">
              <input
                type="text"
                placeholder="🔍 Search topics, PID, registers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Reference Button at top of sidebar */}
            <div className="sidebar-quickref-container">
              <div
                className={`sidebar-quickref-btn ${isQuickRef ? 'active' : ''}`}
                onClick={() => goToPage('quick-ref')}
              >
                <span className="quickref-icon">⚡</span>
                <span className="quickref-label">Quick Reference Cheat Sheet</span>
                <span className="quickref-chip">SOP</span>
              </div>
            </div>

            {/* Navigation Outline Tree */}
            <nav className="toc-tree" aria-label="Table of Contents">
              {filteredNavChapters.map((ch) => {
                const isExpanded = expandedChapters[ch.id] || !!searchQuery;
                const isAnyPageActive = ch.pages.some((p) => p.id === currentPageId);

                return (
                  <div key={ch.id} className="toc-chapter-block">
                    <div
                      className={`toc-chapter-header ${isAnyPageActive ? 'chapter-has-active' : ''}`}
                      onClick={(e) => toggleChapter(ch.id, e)}
                    >
                      <button
                        type="button"
                        className="toc-toggle-btn"
                        onClick={(e) => toggleChapter(ch.id, e)}
                      >
                        {isExpanded ? '▼' : '►'}
                      </button>
                      <span className="toc-chapter-title">{ch.title}</span>
                      {ch.badge && <span className="toc-chapter-chip">{ch.badge}</span>}
                    </div>

                    {isExpanded && (
                      <div className="toc-pages-list">
                        {ch.pages.map((p) => {
                          const isPageActive = currentPageId === p.id;
                          return (
                            <div
                              key={p.id}
                              className={`toc-page-row ${isPageActive ? 'active' : ''}`}
                              onClick={() => goToPage(p.id)}
                            >
                              <span className="toc-page-bullet">{isPageActive ? '●' : '▫'}</span>
                              <span className="toc-page-text">{p.title}</span>
                              <span className="toc-page-num">{p.sectionNumber}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Right Reader Area: Single Sub-Topic Page View with Centered Figures */}
          <main className="userguide-reader" ref={readerAreaRef}>
            <div className="doc-page-container">
              {/* ── Page Header Card (Breadcrumb & Page Indicator) ── */}
              <div className="page-header-card">
                <div className="page-header-meta">
                  <span className="page-chapter-tag">{currentPage.chapterTitle}</span>
                  <span className="page-number-tag">
                    Page {currentPage.pageNumber} of {GUIDE_PAGES.length}
                  </span>
                </div>
                <h1 className="page-title">{currentPage.title}</h1>
              </div>

              {/* ── Page Content Body (Rendered independently per subtopic) ── */}
              <div className="page-content-wrapper">{currentPage.render()}</div>

              {/* ── Bottom Page Navigation Footer: Explicit Next Topic Transition ── */}
              <div className="page-nav-footer">
                {prevPage ? (
                  <button
                    type="button"
                    className="nav-card-btn prev-card"
                    onClick={() => goToPage(prevPage.id)}
                    title={`Go back to ${prevPage.title}`}
                  >
                    <span className="nav-card-sub">← Previous Topic</span>
                    <span className="nav-card-title">{prevPage.title}</span>
                  </button>
                ) : (
                  <div className="nav-card-placeholder" />
                )}

                {nextPage ? (
                  <button
                    type="button"
                    className="nav-card-btn next-card"
                    onClick={() => goToPage(nextPage.id)}
                    title={`Continue to ${nextPage.title}`}
                  >
                    <div className="next-card-content">
                      <span className="nav-card-sub">Next Topic is going to &rarr;</span>
                      <span className="nav-card-title">{nextPage.title}</span>
                      <span className="nav-card-hint">Click to continue to the next page ➔</span>
                    </div>
                  </button>
                ) : (
                  <div className="nav-card-placeholder" />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
