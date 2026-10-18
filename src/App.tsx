import React, { useState, useEffect } from 'react';
import MenuBar from './components/MenuBar/MenuBar';
import HomePage from './components/HomePage/HomePage';
import PlaceholderPage from './components/PlaceholderPage/PlaceholderPage';
import { TrainerACE101 } from './components/TrainerACE101/TrainerACE101';
import './styles/global.css';
import './App.css';

/**
 * App — root component.
 */
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<{ action: string; label: string } | null>(null);

  useEffect(() => {
    const lockMaximized = () => {
      if (
        window.innerWidth < window.screen.availWidth ||
        window.innerHeight < window.screen.availHeight
      ) {
        try {
          window.moveTo(0, 0);
          window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        } catch {}
      }
    };

    window.addEventListener('resize', lockMaximized);
    return () => window.removeEventListener('resize', lockMaximized);
  }, []);

  // Disable right-click context menu across the application except strictly on the trend graph canvas
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest('#ace101-trend-canvas') ||
          target.closest('.trend-canvas'))
      ) {
        return; // Allow context menu ONLY strictly on the canvas itself
      }
      e.preventDefault(); // Disable right-click everywhere else (space right of graph, legends, etc.)
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  const handleAction = (action: string, label: string) => {
    if (action === 'home') {
      setCurrentPage(null);
    } else {
      setCurrentPage({ action, label });
    }
  };

  const isTrainerScreen = currentPage?.action === 'ace101-dtb9696';

  return (
    <div className="app-shell">

      {/* When in the Level Trainer screen, the trainer has its own dedicated menu bar (COM Port | Experiment) */}
      {!isTrainerScreen && <MenuBar onAction={handleAction} />}

      {/* Main content area — directly rendered without any overlays */}
      {currentPage === null ? (
        <HomePage />
      ) : isTrainerScreen ? (
        <TrainerACE101 onHome={() => setCurrentPage(null)} />
      ) : (
        <PlaceholderPage label={currentPage.label} />
      )}
    </div>
  );
};

export default App;
