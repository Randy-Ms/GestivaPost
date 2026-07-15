import { useState, useRef } from 'react';
import type { Layer } from '../types';

export interface SnapLine { axis: 'x' | 'y'; position: number; }

export function useTransformEngine({
  selectedLayerIds,
  scale,
  totalWidth,
  globalSettingsHeight,
  updateLayers,
  layerNodesRef
}: {
  layers: Layer[];
  selectedLayerIds: string[];
  scale: number;
  totalWidth: number;
  globalSettingsHeight: number;
  updateLayers: (updates: { id: string; updates: Partial<Layer> }[], overwriteHistory?: boolean) => void;
  layerNodesRef: React.MutableRefObject<Record<string, HTMLElement | null>>;
}) {
  // Dragging
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{x: number, y: number} | null>(null);
  const layerStartPos = useRef<{ [id: string]: {x: number, y: number} }>({});
  
  // Resizing
  const [resizingLayerId, setResizingLayerId] = useState<string | null>(null);
  const resizeStart = useRef<{x: number, y: number} | null>(null);
  const layerStartSize = useRef<{width: number, height: number, x: number, y: number, fontSize?: number} | null>(null);
  const resizeHandle = useRef<string | null>(null);

  // Rotation
  const [isRotating, setIsRotating] = useState(false);
  const [rotatingLayerId, setRotatingLayerId] = useState<string | null>(null);
  const rotateStart = useRef<{ angle: number, initialRotation: number } | null>(null);

  // Snapping
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);

  // Ephemeral State values to push on PointerUp
  const dragUpdatesQueue = useRef<{ [id: string]: Partial<Layer> }>({});

  const startDrag = (e: React.PointerEvent, currentSelectedIds: string[], currentLayers: Layer[]) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    const startPos: { [id: string]: {x: number, y: number} } = {};
    currentSelectedIds.forEach(id => {
      const layer = currentLayers.find(l => l.id === id);
      if (layer) {
        startPos[id] = { x: layer.x, y: layer.y };
        // Reset transforms
        const node = layerNodesRef.current[id];
        if (node) {
          node.style.transform = `rotate(${layer.rotation || 0}deg) translate(0px, 0px)`;
        }
      }
    });
    layerStartPos.current = startPos;
    dragUpdatesQueue.current = {};
  };

  const startResize = (e: React.PointerEvent, layer: Layer, handle: string) => {
    setResizingLayerId(layer.id);
    resizeHandle.current = handle;
    resizeStart.current = { x: e.clientX, y: e.clientY };
    layerStartSize.current = { 
      width: layer.width || 100, 
      height: layer.height || 50, 
      x: layer.x, 
      y: layer.y,
      fontSize: layer.fontSize 
    };
    dragUpdatesQueue.current = {};
  };

  const startRotate = (e: React.PointerEvent, layer: Layer) => {
    setIsRotating(true);
    setRotatingLayerId(layer.id);
    
    const node = layerNodesRef.current[layer.id];
    if (node) {
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      
      rotateStart.current = {
        angle: startAngle,
        initialRotation: layer.rotation || 0
      };
      dragUpdatesQueue.current = {};
    }
  };

  const handlePointerMove = (e: PointerEvent, currentLayers: Layer[]) => {
    // 1. Dragging
    if (isDragging && dragStart.current) {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      
      const snapLinesLocal: SnapLine[] = [];
      const snapThreshold = 10;
      const canvasCenterX = totalWidth / 2;
      const canvasCenterY = globalSettingsHeight / 2;

      selectedLayerIds.forEach(id => {
        const start = layerStartPos.current[id];
        if (!start) return;

        let newX = start.x + dx;
        let newY = start.y + dy;

        if (selectedLayerIds.length === 1) {
          const layer = currentLayers.find(l => l.id === id);
          const lWidth = layer?.width || 100;
          const lHeight = layer?.height || 50;
          
          if (Math.abs((newX + lWidth / 2) - canvasCenterX) < snapThreshold) {
            newX = canvasCenterX - lWidth / 2;
            snapLinesLocal.push({ axis: 'x', position: canvasCenterX });
          }
          if (Math.abs((newY + lHeight / 2) - canvasCenterY) < snapThreshold) {
            newY = canvasCenterY - lHeight / 2;
            snapLinesLocal.push({ axis: 'y', position: canvasCenterY });
          }
        }

        const deltaX = Math.round(newX) - start.x;
        const deltaY = Math.round(newY) - start.y;

        const node = layerNodesRef.current[id];
        if (node) {
          const layer = currentLayers.find(l => l.id === id);
          node.style.transform = `rotate(${layer?.rotation || 0}deg) translate(${deltaX}px, ${deltaY}px)`;
        }

        dragUpdatesQueue.current[id] = { x: Math.round(newX), y: Math.round(newY) };
      });

      setSnapLines(snapLinesLocal);
    }

    // 2. Resizing
    if (resizingLayerId && resizeStart.current && layerStartSize.current && resizeHandle.current) {
      const dx = (e.clientX - resizeStart.current.x) / scale;
      const dy = (e.clientY - resizeStart.current.y) / scale;
      
      let newWidth = layerStartSize.current.width;
      let newHeight = layerStartSize.current.height;
      let newX = layerStartSize.current.x;
      let newY = layerStartSize.current.y;
      let newFontSize = layerStartSize.current.fontSize;

      if (resizeHandle.current.includes('e')) newWidth = Math.max(10, layerStartSize.current.width + dx);
      if (resizeHandle.current.includes('s')) newHeight = Math.max(10, layerStartSize.current.height + dy);
      if (resizeHandle.current.includes('w')) {
        const possibleWidth = layerStartSize.current.width - dx;
        if (possibleWidth > 10) {
          newWidth = possibleWidth;
          newX = layerStartSize.current.x + dx;
        }
      }
      if (resizeHandle.current.includes('n')) {
        const possibleHeight = layerStartSize.current.height - dy;
        if (possibleHeight > 10) {
          newHeight = possibleHeight;
          newY = layerStartSize.current.y + dy;
        }
      }

      const layer = currentLayers.find(l => l.id === resizingLayerId);
      if (layer?.type === 'text') {
         if (resizeHandle.current.includes('e') || resizeHandle.current.includes('w')) {
           const scaleRatio = newWidth / layerStartSize.current.width;
           if (layerStartSize.current.fontSize) {
             newFontSize = Math.round(layerStartSize.current.fontSize * scaleRatio);
           }
         } else {
           const scaleRatio = newHeight / layerStartSize.current.height;
           if (layerStartSize.current.fontSize) {
             newFontSize = Math.round(layerStartSize.current.fontSize * scaleRatio);
           }
         }
      }

      const node = layerNodesRef.current[resizingLayerId];
      if (node) {
        node.style.width = `${Math.round(newWidth)}px`;
        node.style.height = `${Math.round(newHeight)}px`;
        if (newFontSize) node.style.fontSize = `${newFontSize}px`;
        
        const deltaX = Math.round(newX) - layerStartSize.current.x;
        const deltaY = Math.round(newY) - layerStartSize.current.y;
        node.style.transform = `rotate(${layer?.rotation || 0}deg) translate(${deltaX}px, ${deltaY}px)`;
      }

      dragUpdatesQueue.current[resizingLayerId] = { 
        width: Math.round(newWidth), 
        height: Math.round(newHeight), 
        x: Math.round(newX), 
        y: Math.round(newY),
        ...(newFontSize ? { fontSize: newFontSize } : {})
      };
    }

    // 3. Rotating
    if (isRotating && rotatingLayerId && rotateStart.current) {
      const node = layerNodesRef.current[rotatingLayerId];
      if (node) {
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        
        const deltaAngle = currentAngle - rotateStart.current.angle;
        let newRotation = rotateStart.current.initialRotation + deltaAngle;
        
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        
        newRotation = newRotation % 360;
        if (newRotation < 0) newRotation += 360;

        node.style.transform = `rotate(${Math.round(newRotation)}deg)`;
        dragUpdatesQueue.current[rotatingLayerId] = { rotation: Math.round(newRotation) };
      }
    }
  };

  const handlePointerUp = () => {
    // Flush updates to Zustand
    const updates = Object.keys(dragUpdatesQueue.current).map(id => ({
      id,
      updates: dragUpdatesQueue.current[id]
    }));

    if (updates.length > 0) {
      updateLayers(updates, false); // false = create history snapshot!
    }

    // Reset styles
    Object.keys(dragUpdatesQueue.current).forEach(id => {
      const node = layerNodesRef.current[id];
      if (node) {
        node.style.transform = '';
        node.style.width = '';
        node.style.height = '';
        node.style.fontSize = '';
      }
    });

    dragUpdatesQueue.current = {};

    setIsDragging(false);
    dragStart.current = null;
    layerStartPos.current = {};
    
    setResizingLayerId(null);
    resizeStart.current = null;
    layerStartSize.current = null;
    resizeHandle.current = null;

    setIsRotating(false);
    setRotatingLayerId(null);
    rotateStart.current = null;

    setSnapLines([]);
  };

  return {
    isDragging, startDrag,
    resizingLayerId, startResize,
    isRotating, rotatingLayerId, startRotate,
    snapLines,
    handleTransformPointerMove: handlePointerMove,
    handleTransformPointerUp: handlePointerUp
  };
}
