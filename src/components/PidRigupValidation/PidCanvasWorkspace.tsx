import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  LIBRARY_COMPONENTS,
  type PlacedComponent,
  type WireConnection,
  type ComponentPort,
} from './pidRigupData';
import { ComponentVisual } from './pidSymbols';
import './PidCanvasWorkspace.css';

interface DraggingWireState {
  fromCompId: string;
  fromPort: ComponentPort;
  fromX: number;
  fromY: number;
  currentX: number;
  currentY: number;
}

type ResizeHandleType = 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 's' | 'n';

interface PidCanvasWorkspaceProps {
  viewMode: 'figure' | 'symbol';
  placedComponents: PlacedComponent[];
  wires: WireConnection[];
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onUpdateComponentSize: (id: string, width: number, height: number, scale?: number) => void;
  onRemoveComponent: (id: string) => void;
  onAddWire: (wire: WireConnection) => void;
  onUpdateWireColor: (wireId: string, color: string) => void;
  onUpdateWireMidOffset: (wireId: string, midOffset: number) => void;
  onUpdateWire?: (wireId: string, updates: Partial<WireConnection>) => void;
  onRemoveWire: (id: string) => void;
  onDropComponentFromLibrary: (typeId: string, x: number, y: number) => void;
}

// ── Color Presets (Request 5: Blue for Fluid, White for Pneumatic, Orange for Electric) ──
const WIRE_COLOR_PRESETS = [
  { id: 'auto', label: 'Auto (By Signal)', color: 'auto' },
  { id: 'fluid', label: 'Process Line (Blue)', color: '#0284c7' },
  { id: 'pneumatic', label: 'Pneumatic Line (White)', color: '#ffffff' },
  { id: 'electrical', label: '4-20mA Signal (Orange)', color: '#f97316' },
  { id: 'alarm', label: 'Alarm / Power (Red)', color: '#ef4444' },
  { id: 'drain', label: 'Drain / Return (Dark)', color: '#334155' },
];

export const PidCanvasWorkspace: React.FC<PidCanvasWorkspaceProps> = ({
  viewMode,
  placedComponents,
  wires,
  onUpdateComponentPosition,
  onUpdateComponentSize,
  onRemoveComponent,
  onAddWire,
  onUpdateWireColor,
  onUpdateWireMidOffset,
  onUpdateWire,
  onRemoveWire,
  onDropComponentFromLibrary,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Multi-Component Selection (Request 2) ──
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Marquee Drag Selection Box state
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);

  // Interaction flag: prevents canvas click from deselecting when drag, box-select, or resize finishes
  const isInteractingRef = useRef<boolean>(false);

  // Multi-component dragging references
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const dragStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOriginsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Freehand drag-wire state
  const [activeDragWire, setActiveDragWire] = useState<DraggingWireState | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ compId: string; portId: string } | null>(null);

  // Active wire color mode for drawing
  const [activeWireColor, setActiveWireColor] = useState<string>('auto');

  // Canvas zoom level (Unconstrained: 15% to 400%+)
  const [canvasZoom, setCanvasZoom] = useState<number>(1);

  // Auto-select newly added component
  const prevCountRef = useRef(placedComponents.length);
  useEffect(() => {
    if (placedComponents.length > prevCountRef.current) {
      const latest = placedComponents[placedComponents.length - 1];
      if (latest) {
        setSelectedCompIds([latest.id]);
      }
    }
    prevCountRef.current = placedComponents.length;
  }, [placedComponents]);

  // Calculate absolute pixel position of a port on the canvas
  const getPortAbsolutePos = useCallback(
    (compId: string, portId: string): { x: number; y: number; port: ComponentPort } | null => {
      const comp = placedComponents.find((c) => c.id === compId);
      if (!comp) return null;
      const def = LIBRARY_COMPONENTS.find((l) => l.typeId === comp.typeId);
      if (!def) return null;
      const port = def.ports.find((p) => p.id === portId);
      if (!port) return null;

      const px = comp.x + (port.x / 100) * comp.width;
      const py = comp.y + (port.y / 100) * comp.height;
      return { x: px, y: py, port };
    },
    [placedComponents]
  );

  // ── Multi-Component Dragging (Request 2) ──
  const handleComponentMouseDown = (e: React.MouseEvent, comp: PlacedComponent) => {
    // Only if clicking on component body (not port, resize handle, or delete button)
    if ((e.target as HTMLElement).closest('.component-port-node')) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    if ((e.target as HTMLElement).closest('.component-delete-btn')) return;

    e.stopPropagation();
    setSelectedWireId(null);

    // Multi-select with Shift or Ctrl
    let newSelection = selectedCompIds;
    if (e.shiftKey || e.ctrlKey) {
      if (selectedCompIds.includes(comp.id)) {
        newSelection = selectedCompIds.filter((id) => id !== comp.id);
      } else {
        newSelection = [...selectedCompIds, comp.id];
      }
      setSelectedCompIds(newSelection);
    } else {
      if (!selectedCompIds.includes(comp.id)) {
        newSelection = [comp.id];
        setSelectedCompIds(newSelection);
      }
    }

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / canvasZoom;
    const mouseY = (e.clientY - canvasRect.top) / canvasZoom;

    // Record origins of all selected items for synchronized group move
    const origins: Record<string, { x: number; y: number }> = {};
    newSelection.forEach((id) => {
      const c = placedComponents.find((p) => p.id === id);
      if (c) {
        origins[id] = { x: c.x, y: c.y };
      }
    });

    dragOriginsRef.current = origins;
    dragStartMouseRef.current = { x: mouseX, y: mouseY };
    setDraggingCompId(comp.id);
  };

  // ── Canvas Mouse Down: Start Marquee Box Selection ──
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Ignore clicks on components, wires, or toolbars
    if (
      (e.target as HTMLElement).closest('.canvas-placed-component') ||
      (e.target as HTMLElement).closest('.placed-wire-group') ||
      (e.target as HTMLElement).closest('.canvas-floating-toolbar') ||
      (e.target as HTMLElement).closest('.canvas-top-right-legend')
    ) {
      return;
    }

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startX = (e.clientX - canvasRect.left) / canvasZoom;
    const startY = (e.clientY - canvasRect.top) / canvasZoom;

    setSelectionBox({ startX, startY, curX: startX, curY: startY });

    if (!e.shiftKey && !e.ctrlKey) {
      setSelectedCompIds([]);
    }
    setSelectedWireId(null);
  };

  // ── 8-Point Freeform Resizing ──
  const handleResizeHandlePointerDown = (
    e: React.PointerEvent,
    comp: PlacedComponent,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isInteractingRef.current = true;
    setSelectedCompIds([comp.id]);
    setSelectedWireId(null);

    const initialWidth = comp.width;
    const initialHeight = comp.height;
    const initialCompX = comp.x;
    const initialCompY = comp.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const handlePointerMove = (moveEv: PointerEvent) => {
      isInteractingRef.current = true;
      const dx = (moveEv.clientX - startMouseX) / canvasZoom;
      const dy = (moveEv.clientY - startMouseY) / canvasZoom;

      let newW = initialWidth;
      let newH = initialHeight;
      let newX = initialCompX;
      let newY = initialCompY;

      if (handle === 'e') {
        newW = Math.max(20, initialWidth + dx);
      } else if (handle === 'w') {
        const delta = Math.min(dx, initialWidth - 20);
        newW = initialWidth - delta;
        newX = initialCompX + delta;
      } else if (handle === 's') {
        newH = Math.max(20, initialHeight + dy);
      } else if (handle === 'n') {
        const delta = Math.min(dy, initialHeight - 20);
        newH = initialHeight - delta;
        newY = initialCompY + delta;
      } else if (handle === 'se') {
        newW = Math.max(20, initialWidth + dx);
        newH = Math.max(20, initialHeight + dy);
      } else if (handle === 'sw') {
        const deltaX = Math.min(dx, initialWidth - 20);
        newW = initialWidth - deltaX;
        newX = initialCompX + deltaX;
        newH = Math.max(20, initialHeight + dy);
      } else if (handle === 'ne') {
        newW = Math.max(20, initialWidth + dx);
        const deltaY = Math.min(dy, initialHeight - 20);
        newH = initialHeight - deltaY;
        newY = initialCompY + deltaY;
      } else if (handle === 'nw') {
        const deltaX = Math.min(dx, initialWidth - 20);
        const deltaY = Math.min(dy, initialHeight - 20);
        newW = initialWidth - deltaX;
        newX = initialCompX + deltaX;
        newH = initialHeight - deltaY;
        newY = initialCompY + deltaY;
      }

      onUpdateComponentPosition(comp.id, Math.round(newX), Math.round(newY));
      onUpdateComponentSize(comp.id, Math.round(newW), Math.round(newH));
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 60);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // ── Adjustable Line Segments (Request 4 & Request 6) ──
  const handleSegmentPointerDown = (
    e: React.PointerEvent,
    wire: WireConnection,
    axis: 'x' | 'y'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isInteractingRef.current = true;
    setSelectedWireId(wire.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initOffsetX = wire.midOffsetX ?? wire.midOffset ?? 0;
    const initOffsetY = wire.midOffsetY ?? 0;

    const handlePointerMove = (moveEv: PointerEvent) => {
      isInteractingRef.current = true;
      const dx = (moveEv.clientX - startX) / canvasZoom;
      const dy = (moveEv.clientY - startY) / canvasZoom;

      if (axis === 'x') {
        const newOffsetX = Math.round(initOffsetX + dx);
        onUpdateWireMidOffset(wire.id, newOffsetX);
        onUpdateWire?.(wire.id, { midOffsetX: newOffsetX, midOffset: newOffsetX });
      } else {
        const newOffsetY = Math.round(initOffsetY + dy);
        onUpdateWire?.(wire.id, { midOffsetY: newOffsetY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 60);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Start freehand drag-wire from a port node
  const handlePortMouseDown = (
    e: React.MouseEvent,
    comp: PlacedComponent,
    port: ComponentPort
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isInteractingRef.current = true;

    const pos = getPortAbsolutePos(comp.id, port.id);
    if (!pos) return;

    setActiveDragWire({
      fromCompId: comp.id,
      fromPort: port,
      fromX: pos.x,
      fromY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    });
  };

  // Canvas Mouse Move (updates marquee box selection, multi-component dragging, or active freehand wire)
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const curX = (e.clientX - canvasRect.left) / canvasZoom;
    const curY = (e.clientY - canvasRect.top) / canvasZoom;

    // 1. Marquee box selection update
    if (selectionBox) {
      isInteractingRef.current = true;
      const minX = Math.min(selectionBox.startX, curX);
      const maxX = Math.max(selectionBox.startX, curX);
      const minY = Math.min(selectionBox.startY, curY);
      const maxY = Math.max(selectionBox.startY, curY);

      setSelectionBox((prev) => (prev ? { ...prev, curX, curY } : null));

      // Check which components intersect
      const intersected = placedComponents
        .filter((comp) => {
          return (
            comp.x < maxX &&
            comp.x + comp.width > minX &&
            comp.y < maxY &&
            comp.y + comp.height > minY
          );
        })
        .map((c) => c.id);

      setSelectedCompIds(intersected);
      return;
    }

    // 2. Multi-component synchronized dragging
    if (draggingCompId) {
      isInteractingRef.current = true;
      const dx = curX - dragStartMouseRef.current.x;
      const dy = curY - dragStartMouseRef.current.y;

      Object.entries(dragOriginsRef.current).forEach(([id, origin]) => {
        const comp = placedComponents.find((c) => c.id === id);
        const compW = comp?.width || 80;
        const compH = comp?.height || 80;
        const newX = Math.max(5, Math.min(canvasRect.width / canvasZoom - compW, origin.x + dx));
        const newY = Math.max(5, Math.min(canvasRect.height / canvasZoom - compH, origin.y + dy));
        onUpdateComponentPosition(id, Math.round(newX), Math.round(newY));
      });
      return;
    }

    // 3. Active freehand wire
    if (activeDragWire) {
      setActiveDragWire((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));
    }
  };

  // Mouse Up: drop components, finish box selection, or complete wire connection
  const handleCanvasMouseUp = () => {
    if (selectionBox) {
      setSelectionBox(null);
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 60);
    }

    if (draggingCompId) {
      setDraggingCompId(null);
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 60);
    }

    if (activeDragWire) {
      if (hoveredPort && hoveredPort.compId !== activeDragWire.fromCompId) {
        const targetComp = placedComponents.find((c) => c.id === hoveredPort.compId);
        const targetDef = targetComp ? LIBRARY_COMPONENTS.find((l) => l.typeId === targetComp.typeId) : null;
        const targetPort = targetDef ? targetDef.ports.find((p) => p.id === hoveredPort.portId) : null;

        if (targetPort && targetComp) {
          const exists = wires.some(
            (w) =>
              (w.fromCompId === activeDragWire.fromCompId &&
                w.fromPortId === activeDragWire.fromPort.id &&
                w.toCompId === targetComp.id &&
                w.toPortId === targetPort.id) ||
              (w.toCompId === activeDragWire.fromCompId &&
                w.toPortId === activeDragWire.fromPort.id &&
                w.fromCompId === targetComp.id &&
                w.fromPortId === targetPort.id)
          );

          if (!exists) {
            onAddWire({
              id: `wire-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fromCompId: activeDragWire.fromCompId,
              fromPortId: activeDragWire.fromPort.id,
              toCompId: targetComp.id,
              toPortId: targetPort.id,
              type: activeDragWire.fromPort.type,
              color: activeWireColor !== 'auto' ? activeWireColor : undefined,
              midOffset: 0,
              midOffsetX: 0,
              midOffsetY: 0,
              routeStyle: 'orthogonal-h',
            });
          }
        }
      }
      setActiveDragWire(null);
      setHoveredPort(null);
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 60);
    }
  };

  // Drag and drop from Library onto canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(10, (e.clientX - canvasRect.left) / canvasZoom - 40);
    const y = Math.max(10, (e.clientY - canvasRect.top) / canvasZoom - 40);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.typeId) {
          onDropComponentFromLibrary(data.typeId, Math.round(x), Math.round(y));
        }
      }
    } catch (_) {}
  };

  // Mouse wheel zoom support with Ctrl key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setCanvasZoom((z) => Math.max(0.2, Math.min(4.0, Math.round((z + delta) * 100) / 100)));
    }
  };

  // ── Multi-Segment Adjustable Orthogonal Route Generator (Requests 4 & 6: Clean Straight Segments) ──
  const getWirePath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    midOffsetX: number = 0,
    midOffsetY: number = 0,
    routeStyle: 'orthogonal-h' | 'orthogonal-v' | 'curved' = 'orthogonal-h'
  ) => {
    // Both midX and midY are adjustable independently
    const midX = (x1 + x2) / 2 + midOffsetX;
    const midY = (y1 + y2) / 2 + midOffsetY;

    const minY = Math.min(y1, y2, midY);
    const actionX = (x1 + x2) / 2;
    const actionY = Math.max(30, minY - 24);

    if (routeStyle === 'orthogonal-v') {
      // Vertical-First route:
      // (x1, y1) -> (x1, midY) -> (midX, midY) -> (midX, y2) -> (x2, y2)
      return {
        d: `M ${x1},${y1} L ${x1},${midY} L ${midX},${midY} L ${midX},${y2} L ${x2},${y2}`,
        vertGripX: midX,
        vertGripY: (midY + y2) / 2,
        horizGripX: (x1 + midX) / 2,
        horizGripY: midY,
        actionX,
        actionY,
        style: 'orthogonal-v' as const,
      };
    } else {
      // Horizontal-First route (standard P&ID):
      // (x1, y1) -> (midX, y1) -> (midX, midY) -> (x2, midY) -> (x2, y2)
      return {
        d: `M ${x1},${y1} L ${midX},${y1} L ${midX},${midY} L ${x2},${midY} L ${x2},${y2}`,
        vertGripX: midX,
        vertGripY: (y1 + midY) / 2,
        horizGripX: (midX + x2) / 2,
        horizGripY: midY,
        actionX,
        actionY,
        style: 'orthogonal-h' as const,
      };
    }
  };

  // Primary selected component (for 8-point resize handles)
  const primarySelectedComp =
    selectedCompIds.length === 1
      ? placedComponents.find((c) => c.id === selectedCompIds[0]) || null
      : null;

  return (
    <main
      ref={canvasRef}
      className="pid-canvas-workspace"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onWheel={handleWheel}
      onClick={(e) => {
        if (isInteractingRef.current) {
          isInteractingRef.current = false;
          return;
        }
        if (
          (e.target as HTMLElement).closest('.canvas-placed-component') ||
          (e.target as HTMLElement).closest('.placed-wire-group') ||
          (e.target as HTMLElement).closest('.canvas-floating-toolbar') ||
          (e.target as HTMLElement).closest('.canvas-top-right-legend')
        ) {
          return;
        }
        setSelectedCompIds([]);
        setSelectedWireId(null);
      }}
    >
      {/* ── Top Canvas Floating Toolbar ── */}
      <div className="canvas-floating-toolbar" onClick={(e) => e.stopPropagation()}>
        {/* Line / Wire Color Palette */}
        <div className="toolbar-section">
          <span className="toolbar-label">Line Style:</span>
          <div className="wire-color-swatches">
            {WIRE_COLOR_PRESETS.map((p) => {
              const isSelected = activeWireColor === p.color;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setActiveWireColor(p.color);
                    if (selectedWireId && p.color !== 'auto') {
                      onUpdateWireColor(selectedWireId, p.color);
                    }
                  }}
                  title={p.label}
                  style={p.color !== 'auto' ? { backgroundColor: p.color } : undefined}
                >
                  {p.color === 'auto' ? '⚙️' : ''}
                </button>
              );
            })}
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Unconstrained Canvas Zoom Controls */}
        <div className="toolbar-section">
          <span className="toolbar-label">Zoom:</span>
          <button
            type="button"
            className="zoom-tool-btn"
            onClick={() => setCanvasZoom((z) => Math.max(0.15, Math.round((z - 0.15) * 100) / 100))}
            title="Zoom Out (or Ctrl + Wheel Down)"
          >
            －
          </button>
          <span className="zoom-value-label">{Math.round(canvasZoom * 100)}%</span>
          <button
            type="button"
            className="zoom-tool-btn"
            onClick={() => setCanvasZoom((z) => Math.min(4.0, Math.round((z + 0.15) * 100) / 100))}
            title="Zoom In (or Ctrl + Wheel Up)"
          >
            ＋
          </button>
          {canvasZoom !== 1 && (
            <button
              type="button"
              className="zoom-reset-btn"
              onClick={() => setCanvasZoom(1)}
              title="Reset Zoom to 100%"
            >
              1:1
            </button>
          )}
        </div>
      </div>

      {/* ── Top-Right Technical Line Legend (Request 1) ── */}
      <div className="canvas-top-right-legend" onClick={(e) => e.stopPropagation()}>
        <div className="legend-header">
          <span className="legend-title">Line Legend</span>
        </div>
        <div className="legend-items">
          {/* Fluid Process Line */}
          <div className="legend-row">
            <svg width="38" height="12" className="legend-sample">
              <line x1="2" y1="6" x2="36" y2="6" stroke="#0369a1" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="2" y1="6" x2="36" y2="6" stroke="#0284c7" strokeWidth="3.2" strokeLinecap="round" />
              <line x1="2" y1="6" x2="36" y2="6" stroke="#7dd3fc" strokeWidth="1" strokeOpacity="0.8" />
            </svg>
            <span className="legend-text">Process Line (Blue)</span>
          </div>

          {/* Pneumatic Line */}
          <div className="legend-row">
            <svg width="38" height="12" className="legend-sample">
              <line x1="2" y1="6" x2="36" y2="6" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
              <line x1="2" y1="6" x2="36" y2="6" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
            <span className="legend-text">Pneumatic Line (White)</span>
          </div>

          {/* Electrical Line */}
          <div className="legend-row">
            <svg width="38" height="12" className="legend-sample">
              <line x1="2" y1="6" x2="36" y2="6" stroke="#431407" strokeWidth="3.4" strokeLinecap="round" />
              <line x1="2" y1="6" x2="36" y2="6" stroke="#f97316" strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round" />
            </svg>
            <span className="legend-text">Electrical (Orange 4–20mA)</span>
          </div>
        </div>
      </div>

      {/* Grid Background Pattern */}
      <div className="canvas-grid-pattern" />

      {/* ── Marquee Box Drag Selection (Request 2) ── */}
      {selectionBox && (
        <div
          className="canvas-selection-box"
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.curX) * canvasZoom}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.curY) * canvasZoom}px`,
            width: `${Math.abs(selectionBox.curX - selectionBox.startX) * canvasZoom}px`,
            height: `${Math.abs(selectionBox.curY - selectionBox.startY) * canvasZoom}px`,
          }}
        />
      )}

      {/* SVG Wiring & Lines Layer */}
      <svg
        className="canvas-wires-svg-layer"
        style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'top left' }}
      >
        {/* Existing Placed Wires */}
        {wires.map((w) => {
          const fromPos = getPortAbsolutePos(w.fromCompId, w.fromPortId);
          const toPos = getPortAbsolutePos(w.toCompId, w.toPortId);
          if (!fromPos || !toPos) return null;

          const isSelected = selectedWireId === w.id;
          const midOffsetX = w.midOffsetX ?? w.midOffset ?? 0;
          const midOffsetY = w.midOffsetY ?? 0;
          const routeStyle = w.routeStyle ?? 'orthogonal-h';

          const {
            d: pathD,
            vertGripX,
            vertGripY,
            horizGripX,
            horizGripY,
            actionX,
            actionY,
            style: currentStyle,
          } = getWirePath(fromPos.x, fromPos.y, toPos.x, toPos.y, midOffsetX, midOffsetY, routeStyle);

          const customColor = w.color;

          return (
            <g
              key={w.id}
              className={`placed-wire-group type-${w.type} ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWireId(w.id);
                setSelectedCompIds([]);
              }}
            >
              {/* Invisible wide stroke for easy clicking without losing selection */}
              <path d={pathD} fill="none" stroke="transparent" strokeWidth="24" className="wire-hitbox" />

              {/* Selection Halo (No CSS filter drop-shadow to eliminate flickering completely) */}
              {isSelected && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="11"
                  strokeOpacity="0.32"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="wire-selected-halo"
                />
              )}

              {/* Wire Styling based on Type (Request 5: Blue for Fluid, White for Pneumatic, Orange for Electrical) */}
              {customColor ? (
                <>
                  <path d={pathD} fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathD} fill="none" stroke={customColor} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <>
                  {w.type === 'fluid' && (
                    <>
                      {/* Process Fluid Line: Industrial Deep Blue */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth="7.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#7dd3fc"
                        strokeWidth="1.2"
                        strokeOpacity="0.85"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {w.type === 'pneumatic' && (
                    <>
                      {/* Pneumatic Line: Crisp Solid White with Dark Protective Casing */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {w.type === 'electrical' && (
                    <>
                      {/* Electrical Line: Bright Orange 4–20 mA Current Loop */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#431407"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.2"
                        strokeDasharray="6 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}
                </>
              )}

              {/* Terminal Connection Rings at both ends */}
              <circle cx={fromPos.x} cy={fromPos.y} r="3.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
              <circle cx={toPos.x} cy={toPos.y} r="3.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />

              {/* ── Segment Waypoint Grips (Requests 4 & 6: Each Segment can be Adjusted) ── */}
              {isSelected && (
                <>
                  {/* Vertical Segment Adjustment Grip (Drag Left / Right) */}
                  <g
                    className="wire-waypoint-grip"
                    onPointerDown={(e) => handleSegmentPointerDown(e, w, 'x')}
                    style={{ cursor: 'ew-resize' }}
                  >
                    <circle cx={vertGripX} cy={vertGripY} r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <line x1={vertGripX - 3} y1={vertGripY} x2={vertGripX + 3} y2={vertGripY} stroke="#ffffff" strokeWidth="1.5" />
                    <title>Drag left/right to move vertical pipe segment</title>
                  </g>

                  {/* Horizontal Segment Adjustment Grip (Drag Up / Down) */}
                  <g
                    className="wire-waypoint-grip"
                    onPointerDown={(e) => handleSegmentPointerDown(e, w, 'y')}
                    style={{ cursor: 'ns-resize' }}
                  >
                    <circle cx={horizGripX} cy={horizGripY} r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <line x1={horizGripX} y1={horizGripY - 3} x2={horizGripX} y2={horizGripY + 3} stroke="#ffffff" strokeWidth="1.5" />
                    <title>Drag up/down to move horizontal pipe segment</title>
                  </g>

                  {/* ── Floating Rerouting & Control Action Bar for Selected Wire (Flicker-Free) ── */}
                  <g
                    className="wire-action-toolbar"
                    transform={`translate(${actionX}, ${actionY})`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <rect
                      x="-55"
                      y="-12"
                      width="110"
                      height="24"
                      rx="12"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />

                    {/* Flip Routing Direction (H-First vs V-First) */}
                    <g
                      className="wire-tool-btn"
                      transform="translate(-30, 0)"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStyle =
                          currentStyle === 'orthogonal-h' ? 'orthogonal-v' : 'orthogonal-h';
                        onUpdateWire?.(w.id, {
                          routeStyle: nextStyle,
                          midOffsetX: 0,
                          midOffsetY: 0,
                          midOffset: 0,
                        });
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="0" cy="0" r="8.5" fill="#1e293b" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="10" fill="#38bdf8">
                        {currentStyle === 'orthogonal-h' ? '⇄' : '⇅'}
                      </text>
                      <title>{currentStyle === 'orthogonal-h' ? 'Flip to Vertical-First bend' : 'Flip to Horizontal-First bend'}</title>
                    </g>

                    {/* Reset Offsets Button */}
                    <g
                      className="wire-tool-btn"
                      transform="translate(0, 0)"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateWireMidOffset(w.id, 0);
                        onUpdateWire?.(w.id, { midOffsetX: 0, midOffsetY: 0, midOffset: 0 });
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="0" cy="0" r="8.5" fill="#1e293b" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="10" fill="#94a3b8">
                        ↺
                      </text>
                      <title>Reset pipe bends to center</title>
                    </g>

                    {/* Delete Wire Button */}
                    <g
                      className="wire-tool-btn"
                      transform="translate(30, 0)"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWire(w.id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="0" cy="0" r="8.5" fill="#ef4444" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">
                        ✕
                      </text>
                      <title>Delete connection</title>
                    </g>
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Active Freehand Drag-Wire (Rubberband) */}
        {activeDragWire && (
          <g className={`active-rubberband-wire type-${activeDragWire.fromPort.type}`}>
            <path
              d={
                getWirePath(
                  activeDragWire.fromX,
                  activeDragWire.fromY,
                  activeDragWire.currentX,
                  activeDragWire.currentY
                ).d
              }
              fill="none"
              stroke={
                activeDragWire.fromPort.type === 'fluid'
                  ? '#0284c7'
                  : activeDragWire.fromPort.type === 'pneumatic'
                  ? '#ffffff'
                  : '#f97316'
              }
              strokeWidth="4"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
            {/* Rubberband Target Ring */}
            <circle
              cx={activeDragWire.currentX}
              cy={activeDragWire.currentY}
              r="7.5"
              fill={
                activeDragWire.fromPort.type === 'fluid'
                  ? '#0284c7'
                  : activeDragWire.fromPort.type === 'pneumatic'
                  ? '#ffffff'
                  : '#f97316'
              }
              stroke="#0f172a"
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>

      {/* Placed Components Layer */}
      <div
        className="canvas-components-layer"
        style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'top left' }}
      >
        {placedComponents.map((comp) => {
          const def = LIBRARY_COMPONENTS.find((l) => l.typeId === comp.typeId);
          if (!def) return null;

          const isSelected = selectedCompIds.includes(comp.id);
          const isDraggingThis = draggingCompId === comp.id;
          const showResizeHandles = primarySelectedComp?.id === comp.id;

          return (
            <div
              key={comp.id}
              className={`canvas-placed-component ${isSelected ? 'is-selected' : ''} ${
                isDraggingThis ? 'is-dragging' : ''
              }`}
              style={{
                left: `${comp.x}px`,
                top: `${comp.y}px`,
                width: `${comp.width}px`,
                height: `${comp.height}px`,
              }}
              onMouseDown={(e) => handleComponentMouseDown(e, comp)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clean Minimal Titlebar */}
              <div className="component-titlebar">
                <span className="component-tag">{comp.tag}</span>
                <button
                  type="button"
                  className="component-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveComponent(comp.id);
                  }}
                  title="Remove component"
                >
                  ✕
                </button>
              </div>

              {/* Visual Figure or Symbol (Unconstrained aspect ratio SVG) */}
              <div className="component-figure-wrap">
                <ComponentVisual
                  def={def}
                  mode={viewMode}
                  width={comp.width - 6}
                  height={comp.height - 22}
                />
              </div>

              {/* ── 8-Point Freeform Resize Handles (Shown on primary selected item) ── */}
              {showResizeHandles && (
                <>
                  {/* Corner Handles */}
                  <div
                    className="resize-handle handle-se"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'se')}
                    title="Drag to resize freeform"
                  >
                    <span className="resize-grip-icon">⤡</span>
                  </div>
                  <div
                    className="resize-handle handle-sw"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'sw')}
                    title="Drag to resize freeform"
                  />
                  <div
                    className="resize-handle handle-ne"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'ne')}
                    title="Drag to resize freeform"
                  />
                  <div
                    className="resize-handle handle-nw"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'nw')}
                    title="Drag to resize freeform"
                  />

                  {/* Edge Handles */}
                  <div
                    className="resize-handle handle-e"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'e')}
                    title="Drag to stretch width"
                  />
                  <div
                    className="resize-handle handle-w"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'w')}
                    title="Drag to stretch width"
                  />
                  <div
                    className="resize-handle handle-s"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 's')}
                    title="Drag to stretch height"
                  />
                  <div
                    className="resize-handle handle-n"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, comp, 'n')}
                    title="Drag to stretch height"
                  />
                </>
              )}

              {/* Colored Connection Port Nodes */}
              {def.ports.map((port) => {
                const isHovered =
                  hoveredPort?.compId === comp.id && hoveredPort?.portId === port.id;
                const isDraggingFromHere =
                  activeDragWire?.fromCompId === comp.id && activeDragWire?.fromPort.id === port.id;

                const portIcon = port.type === 'fluid' ? '💧' : port.type === 'pneumatic' ? '💨' : '⚡';

                return (
                  <div
                    key={port.id}
                    className={`component-port-node port-${port.type} dir-${port.direction} ${
                      isHovered ? 'hovered' : ''
                    } ${isDraggingFromHere ? 'dragging' : ''}`}
                    style={{
                      left: `${port.x}%`,
                      top: `${port.y}%`,
                    }}
                    onMouseDown={(e) => handlePortMouseDown(e, comp, port)}
                    onMouseEnter={() => {
                      if (activeDragWire && activeDragWire.fromCompId !== comp.id) {
                        setHoveredPort({ compId: comp.id, portId: port.id });
                      }
                    }}
                    onMouseLeave={() => {
                      if (hoveredPort?.compId === comp.id && hoveredPort?.portId === port.id) {
                        setHoveredPort(null);
                      }
                    }}
                    title={`${port.name} (${port.type.toUpperCase()}) — Click & drag to connect`}
                  >
                    <span className="port-dot" />
                    {/* Tooltip on hover */}
                    <div className="port-tooltip">
                      <span>
                        {portIcon} {port.name}
                      </span>
                      {port.signalType && <span className="tooltip-sub">{port.signalType}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Empty Canvas Helpful Guide Watermark */}
      {placedComponents.length === 0 && (
        <div className="workspace-empty-watermark">
          <div className="watermark-icon">🏭</div>
          <h3>P&amp;ID Rigup &amp; Process Flow Canvas</h3>
          <p>
            Drag components from the <strong>Symbol Factory (Left Pane)</strong> onto this canvas.
          </p>
          <div className="watermark-hints">
            <span>• Drag on empty canvas to marquee-select multiple items</span>
            <span>• Drag colored ports to draw process pipelines, pneumatic lines, and 4-20mA signals</span>
            <span>• Select any line to adjust each segment independently or flip bends</span>
          </div>
        </div>
      )}
    </main>
  );
};
