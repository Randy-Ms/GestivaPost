import { useState, useRef } from 'react';
import type { RefObject } from 'react';
import type { Layer } from '../types';

export function useDrawingEngine({
  layers,
  updateLayer,
  addLayer,
  selectLayer,
  scale,
  totalWidth,
  globalSettingsHeight,
  activeTool,
  cardRef
}: {
  layers: Layer[];
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  addLayer: (layer: Layer) => void;
  selectLayer: (ids: string[]) => void;
  scale: number;
  totalWidth: number;
  globalSettingsHeight: number;
  activeTool: string;
  setActiveTool: (tool: any) => void;
  cardRef: RefObject<HTMLElement>;
}) {
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);
  const [currentPathStart, setCurrentPathStart] = useState<{x: number, y: number} | null>(null);
  
  const [penState, setPenState] = useState<'idle' | 'clicking' | 'dragging'>('idle');
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
  
  const freehandPathRef = useRef<string>('M 0 0');

  const generatePathData = (nodes: any[]) => {
    if (!nodes || nodes.length === 0) return 'M 0 0';
    let path = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      if (prev.handleOut || curr.handleIn) {
        const h1 = prev.handleOut || { x: prev.x, y: prev.y };
        const h2 = curr.handleIn || { x: curr.x, y: curr.y };
        path += ` C ${h1.x} ${h1.y}, ${h2.x} ${h2.y}, ${curr.x} ${curr.y}`;
      } else {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    return path;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool !== 'pen_freehand' && activeTool !== 'pen_bezier') return;

    const cardRect = cardRef.current?.getBoundingClientRect();
    const layerX = cardRect ? (e.clientX - cardRect.left) / scale : 0;
    const layerY = cardRect ? (e.clientY - cardRect.top) / scale : 0;

    if (activeTool === 'pen_freehand') {
      const id = crypto.randomUUID();
      freehandPathRef.current = 'M 0 0';
      addLayer({
        id,
        type: 'path',
        name: 'Trazo',
        x: Math.round(layerX),
        y: Math.round(layerY),
        width: 100,
        height: 100,
        pathData: 'M 0 0',
        layerColor: '#000000',
        strokeWidth: 2,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false
      });
      setIsDrawingPath(true);
      setCurrentPathId(id);
      setCurrentPathStart({ x: layerX, y: layerY });
    } else if (activeTool === 'pen_bezier') {
      if (!currentPathId) {
        const id = crypto.randomUUID();
        addLayer({
          id,
          type: 'path',
          name: 'Vector',
          x: 0,
          y: 0,
          width: totalWidth,
          height: globalSettingsHeight,
          pathData: `M ${layerX} ${layerY}`,
          nodes: [{ x: layerX, y: layerY }],
          layerColor: '#000000',
          strokeWidth: 2,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false
        });
        setCurrentPathId(id);
        setPenState('clicking');
        selectLayer([id]);
      } else {
        const layer = layers.find(l => l.id === currentPathId);
        if (layer && layer.nodes) {
          const firstNode = layer.nodes[0];
          const dist = Math.hypot(layerX - firstNode.x, layerY - firstNode.y);
          if (dist < 10) {
            const newNodes = [...layer.nodes];
            updateLayer(currentPathId, {
              nodes: newNodes,
              pathData: generatePathData(newNodes) + ' Z'
            });
            setCurrentPathId(null);
            setPenState('idle');
          } else {
            const newNodes = [...layer.nodes, { x: layerX, y: layerY }];
            updateLayer(currentPathId, {
              nodes: newNodes,
              pathData: generatePathData(newNodes)
            });
            setPenState('clicking');
          }
        }
      }
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (activeTool !== 'pen_freehand' && activeTool !== 'pen_bezier') return;

    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!cardRect) return;

    const layerX = (e.clientX - cardRect.left) / scale;
    const layerY = (e.clientY - cardRect.top) / scale;

    if (activeTool === 'pen_freehand' && isDrawingPath && currentPathId && currentPathStart) {
      const dx = layerX - currentPathStart.x;
      const dy = layerY - currentPathStart.y;
      
      freehandPathRef.current = `${freehandPathRef.current} L ${dx} ${dy}`;
      
      updateLayer(currentPathId, {
        pathData: freehandPathRef.current
      });
    }

    if (activeTool === 'pen_bezier' && currentPathId) {
      if (penState === 'idle') {
        setCursorPos({ x: layerX, y: layerY });
      }
      
      const layer = layers.find(l => l.id === currentPathId);
      if (layer && layer.nodes) {
        const newNodes = [...layer.nodes];
        const lastNodeIndex = newNodes.length - 1;
        const lastNode = { ...newNodes[lastNodeIndex] };
        
        if (penState === 'clicking' || penState === 'dragging') {
           if (penState === 'clicking') setPenState('dragging');
           lastNode.handleOut = { x: layerX, y: layerY };
           lastNode.handleIn = {
             x: lastNode.x - (layerX - lastNode.x),
             y: lastNode.y - (layerY - lastNode.y)
           };
        }
        newNodes[lastNodeIndex] = lastNode;
        
        if (penState !== 'idle') {
          updateLayer(currentPathId, {
            nodes: newNodes,
            pathData: generatePathData(newNodes)
          });
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (isDrawingPath) setIsDrawingPath(false);

    if (activeTool === 'pen_bezier') {
      if (penState === 'clicking' || penState === 'dragging') {
        setPenState('idle');
      }
    } else if (activeTool === 'pen_freehand') {
      setCurrentPathId(null);
      setCurrentPathStart(null);
      setPenState('idle');
    }
  };

  const resetDrawingState = () => {
    setCurrentPathId(null);
    setPenState('idle');
  };

  return {
    isDrawingPath,
    currentPathId,
    penState,
    cursorPos,
    handleDrawingPointerDown: handlePointerDown,
    handleDrawingPointerMove: handlePointerMove,
    handleDrawingPointerUp: handlePointerUp,
    resetDrawingState,
    generatePathData
  };
}
