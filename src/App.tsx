import React, { useState, useEffect } from 'react';
import MenuBar from './components/MenuBar/MenuBar';
import HomePage from './components/HomePage/HomePage';
import PlaceholderPage from './components/PlaceholderPage/PlaceholderPage';
import { TrainerACE101 } from './components/TrainerACE101/TrainerACE101';
import { SimulatorACE401 } from './components/SimulatorACE401/SimulatorACE401';
import { SimulatorACE402 } from './components/SimulatorACE402/SimulatorACE402';
import { SimulatorACE403 } from './components/SimulatorACE403/SimulatorACE403';
import { SimulatorACE404 } from './components/SimulatorACE404/SimulatorACE404';
import { SimulatorACE405 } from './components/SimulatorACE405/SimulatorACE405';
import { SimulatorACE406 } from './components/SimulatorACE406/SimulatorACE406';
import { SimulatorACE407 } from './components/SimulatorACE407/SimulatorACE407';
import { SimulatorACE408 } from './components/SimulatorACE408/SimulatorACE408';
import { SimulatorACE409 } from './components/SimulatorACE409/SimulatorACE409';
import { SimulatorACE410 } from './components/SimulatorACE410/SimulatorACE410';
import { SimulatorACE411 } from './components/SimulatorACE411/SimulatorACE411';
import { SimulatorACE412 } from './components/SimulatorACE412/SimulatorACE412';
import { SimulatorACE413 } from './components/SimulatorACE413/SimulatorACE413';
import { SimulatorACE414 } from './components/SimulatorACE414/SimulatorACE403';
import type { BlockDiagramModel } from './components/SimulatorACE413/SimACE413Header';
import { ActivationModal } from './components/common/ActivationModal';
import './styles/global.css';
import './App.css';

/**
 * App — root component.
 */
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<{ action: string; label: string } | null>(null);
  const [isActivationOpen, setIsActivationOpen] = useState(false);

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
    } else if (action === 'activate-license') {
      setIsActivationOpen(true);
    } else {
      setCurrentPage({ action, label });
    }
  };

  const isTrainerScreen = currentPage?.action === 'ace101-dtb9696';
  const isSimACE401 = currentPage?.action === 'sim-ace401' || currentPage?.action === 'sim-two-pos';
  const isSimACE402 = currentPage?.action === 'sim-ace402';
  const isSimACE403 = currentPage?.action === 'sim-ace403';
  const isSimACE404 = currentPage?.action?.startsWith('sim-ace404');
  const isSimACE405 = currentPage?.action === 'sim-ace405';
  const isSimACE406 = currentPage?.action === 'sim-ace406';
  const isSimACE407 = currentPage?.action === 'sim-ace407';
  const isSimACE408 = currentPage?.action === 'sim-ace408';
  const isSimACE409 = currentPage?.action === 'sim-ace409';
  const isSimACE410 = currentPage?.action === 'sim-ace410';
  const isSimACE411 = currentPage?.action === 'sim-ace411';
  const isSimACE412 = currentPage?.action === 'sim-ace412';
  const isSimACE413 = currentPage?.action === 'sim-ace413';
  const isSimACE414 = currentPage?.action === 'sim-ace414';

  const getSim404Model = (action?: string): BlockDiagramModel => {
    if (action === 'sim-ace404-two-interacting') return 'two-interacting';
    if (action === 'sim-ace404-three-interacting') return 'three-interacting';
    if (action === 'sim-ace404-two-non-interacting') return 'two-non-interacting';
    if (action === 'sim-ace404-cascade') return 'cascade';
    if (action === 'sim-ace404-feedforward') return 'feedforward';
    if (action === 'sim-ace404-smith') return 'smith';
    return 'fopdt';
  };

  const isFullScreenApp =
    isTrainerScreen ||
    isSimACE401 ||
    isSimACE402 ||
    isSimACE403 ||
    isSimACE404 ||
    isSimACE405 ||
    isSimACE406 ||
    isSimACE407 ||
    isSimACE408 ||
    isSimACE409 ||
    isSimACE410 ||
    isSimACE411 ||
    isSimACE412 ||
    isSimACE413 ||
    isSimACE414;

  return (
    <div className="app-shell">

      {/* When in the Level Trainer screen or Simulator screen, menu bar is hidden */}
      {!isFullScreenApp && <MenuBar onAction={handleAction} />}

      {/* Main content area — directly rendered without any overlays */}
      {currentPage === null ? (
        <HomePage />
      ) : isTrainerScreen ? (
        <TrainerACE101 onHome={() => setCurrentPage(null)} />
      ) : isSimACE401 ? (
        <SimulatorACE401 onHome={() => setCurrentPage(null)} />
      ) : isSimACE402 ? (
        <SimulatorACE402 onHome={() => setCurrentPage(null)} />
      ) : isSimACE403 ? (
        <SimulatorACE403 onHome={() => setCurrentPage(null)} />
      ) : isSimACE404 ? (
        <SimulatorACE413
          initialModel={getSim404Model(currentPage?.action)}
          onHome={() => setCurrentPage(null)}
        />
      ) : isSimACE405 ? (
        <SimulatorACE404 onHome={() => setCurrentPage(null)} />
      ) : isSimACE406 ? (
        <SimulatorACE405 onHome={() => setCurrentPage(null)} />
      ) : isSimACE407 ? (
        <SimulatorACE406 onHome={() => setCurrentPage(null)} />
      ) : isSimACE408 ? (
        <SimulatorACE407 onHome={() => setCurrentPage(null)} />
      ) : isSimACE409 ? (
        <SimulatorACE408 onHome={() => setCurrentPage(null)} />
      ) : isSimACE410 ? (
        <SimulatorACE409 onHome={() => setCurrentPage(null)} />
      ) : isSimACE411 ? (
        <SimulatorACE410 onHome={() => setCurrentPage(null)} />
      ) : isSimACE412 ? (
        <SimulatorACE411 onHome={() => setCurrentPage(null)} />
      ) : isSimACE413 ? (
        <SimulatorACE412 onHome={() => setCurrentPage(null)} />
      ) : isSimACE414 ? (
        <SimulatorACE414 onHome={() => setCurrentPage(null)} />
      ) : (
        <PlaceholderPage label={currentPage.label} />
      )}

      {/* In-app License Activation Modal */}
      <ActivationModal isOpen={isActivationOpen} onClose={() => setIsActivationOpen(false)} />
    </div>
  );
};

export default App;
