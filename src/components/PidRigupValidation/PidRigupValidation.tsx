import React, { useState, useCallback } from 'react';
import { PidRigupHeader } from './PidRigupHeader';
import { PidLibraryPanel } from './PidLibraryPanel';
import { PidCanvasWorkspace } from './PidCanvasWorkspace';
import { PidProcessLoopsPanel } from './PidProcessLoopsPanel';
import { StopConfirmModal } from '../common/StopConfirmModal';
import {
  PROCESS_LOOPS,
  LIBRARY_COMPONENTS,
  validateRigup,
  type ProcessLoopDef,
  type LibraryComponentDef,
  type PlacedComponent,
  type WireConnection,
  type ValidationResult,
} from './pidRigupData';
import './PidRigupValidation.css';

interface PidRigupValidationProps {
  onHome: () => void;
}

export const PidRigupValidation: React.FC<PidRigupValidationProps> = ({ onHome }) => {
  const [viewMode, setViewMode] = useState<'figure' | 'symbol'>('figure');
  const [selectedLoop, setSelectedLoop] = useState<ProcessLoopDef>(PROCESS_LOOPS[0]);
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [wires, setWires] = useState<WireConnection[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Clear workspace confirmation modal state (Matches Figure 2)
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);

  // Panel visibility toggles (Request 1)
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Add component by clicking in library
  const handleAddComponent = useCallback(
    (def: LibraryComponentDef) => {
      // Cascade placement slightly so they don't stack directly on top
      const offset = (placedComponents.length * 30) % 180;
      const newComp: PlacedComponent = {
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        typeId: def.typeId,
        tag: `${def.tag}${placedComponents.filter((c) => c.typeId === def.typeId).length > 0 ? `-${placedComponents.filter((c) => c.typeId === def.typeId).length + 1}` : ''}`,
        x: 60 + offset,
        y: 60 + offset,
        width: def.defaultWidth,
        height: def.defaultHeight,
      };

      setPlacedComponents((prev) => [...prev, newComp]);
      setValidationResult(null); // Invalidate previous result
    },
    [placedComponents]
  );

  // Add component by dragging & dropping from library onto canvas
  const handleDropFromLibrary = useCallback((typeId: string, x: number, y: number) => {
    const def = LIBRARY_COMPONENTS.find((l) => l.typeId === typeId);
    if (!def) return;

    setPlacedComponents((prev) => {
      const existingCount = prev.filter((c) => c.typeId === typeId).length;
      const newComp: PlacedComponent = {
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        typeId: def.typeId,
        tag: `${def.tag}${existingCount > 0 ? `-${existingCount + 1}` : ''}`,
        x,
        y,
        width: def.defaultWidth,
        height: def.defaultHeight,
      };
      return [...prev, newComp];
    });
    setValidationResult(null);
  }, []);

  // Update component position
  const handleUpdatePosition = useCallback((id: string, x: number, y: number) => {
    setPlacedComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  }, []);

  // Update component size / scaling
  const handleUpdateComponentSize = useCallback(
    (id: string, width: number, height: number, scale?: number) => {
      setPlacedComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, width, height, scale: scale ?? c.scale } : c))
      );
    },
    []
  );

  // Update wire color override
  const handleUpdateWireColor = useCallback((wireId: string, color: string) => {
    setWires((prev) =>
      prev.map((w) => (w.id === wireId ? { ...w, color } : w))
    );
  }, []);

  // Update wire waypoint mid-offset (move pipeline piece, Request 3)
  const handleUpdateWireMidOffset = useCallback((wireId: string, midOffset: number) => {
    setWires((prev) =>
      prev.map((w) => (w.id === wireId ? { ...w, midOffset, midOffsetX: midOffset } : w))
    );
  }, []);

  // Update wire routing or properties
  const handleUpdateWire = useCallback((wireId: string, updates: Partial<WireConnection>) => {
    setWires((prev) =>
      prev.map((w) => (w.id === wireId ? { ...w, ...updates } : w))
    );
  }, []);

  // Remove component (and any connected wires)
  const handleRemoveComponent = useCallback((id: string) => {
    setPlacedComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) => prev.filter((w) => w.fromCompId !== id && w.toCompId !== id));
    setValidationResult(null);
  }, []);

  // Add wire
  const handleAddWire = useCallback((wire: WireConnection) => {
    setWires((prev) => [...prev, wire]);
    setValidationResult(null);
  }, []);

  // Remove wire
  const handleRemoveWire = useCallback((wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    setValidationResult(null);
  }, []);

  // Clear workspace request (opens custom modal matching Figure 2)
  const handleClearWorkspace = useCallback(() => {
    if (placedComponents.length === 0 && wires.length === 0) return;
    setIsClearModalOpen(true);
  }, [placedComponents, wires]);

  // Confirm clear workspace
  const handleConfirmClear = useCallback(() => {
    setPlacedComponents([]);
    setWires([]);
    setValidationResult(null);
    setIsClearModalOpen(false);
  }, []);

  // Run validation
  const handleRunValidation = useCallback(() => {
    const res = validateRigup(selectedLoop, placedComponents, wires);
    setValidationResult(res);
    setShowRightPanel(true);
  }, [selectedLoop, placedComponents, wires]);

  return (
    <div className="pid-rigup-screen">
      {/* ── Top Header & Toolbar (Matches Figure 2) ── */}
      <PidRigupHeader
        onHome={onHome}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onClearCanvas={handleClearWorkspace}
        onValidate={handleRunValidation}
        showLeftPanel={showLeftPanel}
        showRightPanel={showRightPanel}
        onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
        onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
      />

      {/* ── Main 3-Pane Body Layout ── */}
      <div className="pid-rigup-body">
        {/* Left: Component Library */}
        {showLeftPanel && (
          <PidLibraryPanel
            viewMode={viewMode}
            onAddComponent={handleAddComponent}
            onToggleCollapse={() => setShowLeftPanel(false)}
          />
        )}

        {/* Collapsed Left Panel Opener Tab */}
        {!showLeftPanel && (
          <button
            type="button"
            className="pane-reopen-tab reopen-left"
            onClick={() => setShowLeftPanel(true)}
            title="Expand Symbol Factory (Left)"
          >
            <span>🏭 Symbol Factory ▶</span>
          </button>
        )}

        {/* Center: Canvas Workspace */}
        <PidCanvasWorkspace
          viewMode={viewMode}
          placedComponents={placedComponents}
          wires={wires}
          onUpdateComponentPosition={handleUpdatePosition}
          onUpdateComponentSize={handleUpdateComponentSize}
          onRemoveComponent={handleRemoveComponent}
          onAddWire={handleAddWire}
          onUpdateWireColor={handleUpdateWireColor}
          onUpdateWireMidOffset={handleUpdateWireMidOffset}
          onUpdateWire={handleUpdateWire}
          onRemoveWire={handleRemoveWire}
          onDropComponentFromLibrary={handleDropFromLibrary}
        />

        {/* Collapsed Right Panel Opener Tab */}
        {!showRightPanel && (
          <button
            type="button"
            className="pane-reopen-tab reopen-right"
            onClick={() => setShowRightPanel(true)}
            title="Expand Process Loops & Validation (Right)"
          >
            <span>◀ 📋 Process Loops</span>
          </button>
        )}

        {/* Right: Process Loops & Validation Checklist */}
        {showRightPanel && (
          <PidProcessLoopsPanel
            selectedLoop={selectedLoop}
            onSelectLoop={(loop) => {
              setSelectedLoop(loop);
              setValidationResult(null);
            }}
            validationResult={validationResult}
            onRunValidation={handleRunValidation}
            placedComponents={placedComponents}
            onToggleCollapse={() => setShowRightPanel(false)}
          />
        )}
      </div>

      {/* ── Clear Workspace Confirmation Modal (Matches Figure 2) ── */}
      <StopConfirmModal
        isOpen={isClearModalOpen}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
        title="Clear Workspace"
        message="All components and connections will be cleared from the P&ID workspace. Do you want to continue?"
        confirmText="Yes"
        cancelText="Cancel"
      />
    </div>
  );
};
