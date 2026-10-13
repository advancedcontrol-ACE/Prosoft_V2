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
