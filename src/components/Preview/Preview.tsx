import { useRef, useEffect, useState } from 'react';
import { Undo, Redo, Maximize, Trash2, Star, Smile, Zap, Camera, Bell, Search, Mail, Phone, MapPin, Settings, User, Heart as HeartIcon, ThumbsUp, MessageCircle, Share2, Bookmark, Home, Globe } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import ContextMenu from './ContextMenu';
import styles from './Preview.module.css';


export default function Preview() {
  const { globalSettings, layers, selectedLayerIds, selectLayer, updateLayer, updateLayers, toggleLayerSelection, setGlobalSettings, isExporting, addLayer, undo, redo, showResetConfirm, setShowResetConfirm, resetDesign, activeTool, setActiveTool, selectedShapeType } = useEditorStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Infinite Canvas State
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  // Dragging State (Multi-drag)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [layerStartPos, setLayerStartPos] = useState<{ [id: string]: {x: number, y: number} }>({});
  

  // Resizing State (Single layer)
  const [resizingLayerId, setResizingLayerId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{x: number, y: number} | null>(null);
  const [layerStartSize, setLayerStartSize] = useState<{width: number, height: number, x: number, y: number, fontSize?: number} | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Marquee Selection State
  const [marquee, setMarquee] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);

  // Rotation State
  const [isRotating, setIsRotating] = useState(false);
  const [rotatingLayerId, setRotatingLayerId] = useState<string | null>(null);
  const [rotateStart, setRotateStart] = useState<{ angle: number, initialRotation: number } | null>(null);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas Resizing State
  const [resizingCanvas, setResizingCanvas] = useState<{ startX: number, startY: number, startW: number, startH: number } | null>(null);
  const [canvasResizeHandle, setCanvasResizeHandle] = useState<string | null>(null);

  interface SnapLine { axis: 'x' | 'y'; position: number; }
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);

  // Drawing State
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);
  const [currentPathStart, setCurrentPathStart] = useState<{x: number, y: number} | null>(null);

  const totalWidth = globalSettings.isCarousel ? globalSettings.width * globalSettings.carouselSlides : globalSettings.width;

  const [isAnimatingLayout, setIsAnimatingLayout] = useState(false);
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fitToScreen = () => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      
      const fitScale = Math.min((cw - 100) / totalWidth, (ch - 100) / globalSettings.height, 1);
      
      // Enable CSS transitions temporarily
      setIsAnimatingLayout(true);
      if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = setTimeout(() => setIsAnimatingLayout(false), 500);

      setScale(fitScale);
      
      const fitPanX = (cw - (totalWidth * fitScale)) / 2;
      const fitPanY = (ch - (globalSettings.height * fitScale)) / 2;
      setPan({ x: fitPanX, y: fitPanY });
    }
  };

  // Auto fit-to-screen when changing formats or window resize
  useEffect(() => {
    fitToScreen();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [globalSettings.format, globalSettings.carouselSlides, globalSettings.isCarousel, globalSettings.carouselOrientation]);

  const rAFRef = useRef<number | null>(null);

  useEffect(() => {
    if (isExporting) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);

      rAFRef.current = requestAnimationFrame(() => {
      // 0. Canvas Panning
      if (isCanvasPanning && panStart) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
        return;
      }

      // 1. Dragging Layers
      if (isDragging && dragStart) {
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;
        
        const updates: { id: string; updates: any }[] = [];
        const snapLinesLocal: SnapLine[] = [];
        const snapThreshold = 10;
        const canvasCenterX = totalWidth / 2;
        const canvasCenterY = globalSettings.height / 2;

        selectedLayerIds.forEach(id => {
          const start = layerStartPos[id];
          if (!start) return;

          let newX = start.x + dx;
          let newY = start.y + dy;

          if (selectedLayerIds.length === 1) {
            const layer = layers.find(l => l.id === id);
            const lWidth = layer?.width || 100;
            const lHeight = layer?.height || 50;
            
            // 1. Center of canvas snapping
            if (Math.abs((newX + lWidth / 2) - canvasCenterX) < snapThreshold) {
              newX = canvasCenterX - lWidth / 2;
              snapLinesLocal.push({ axis: 'x', position: canvasCenterX });
            }
            if (Math.abs((newY + lHeight / 2) - canvasCenterY) < snapThreshold) {
              newY = canvasCenterY - lHeight / 2;
              snapLinesLocal.push({ axis: 'y', position: canvasCenterY });
            }
            
            // 2. Layer to Layer snapping
            layers.forEach(otherLayer => {
              if (otherLayer.id === id || otherLayer.hidden) return;
              
              const oLeft = otherLayer.x;
              const oRight = otherLayer.x + (otherLayer.width || 100);
              const oTop = otherLayer.y;
              const oBottom = otherLayer.y + (otherLayer.height || 50);
              const oCenterX = otherLayer.x + (otherLayer.width || 100) / 2;
              const oCenterY = otherLayer.y + (otherLayer.height || 50) / 2;

              // Snap Left
              if (Math.abs(newX - oLeft) < snapThreshold) { newX = oLeft; snapLinesLocal.push({ axis: 'x', position: oLeft }); }
              // Snap Right
              if (Math.abs((newX + lWidth) - oRight) < snapThreshold) { newX = oRight - lWidth; snapLinesLocal.push({ axis: 'x', position: oRight }); }
              // Snap Center X
              if (Math.abs((newX + lWidth / 2) - oCenterX) < snapThreshold) { newX = oCenterX - lWidth / 2; snapLinesLocal.push({ axis: 'x', position: oCenterX }); }
              
              // Snap Top
              if (Math.abs(newY - oTop) < snapThreshold) { newY = oTop; snapLinesLocal.push({ axis: 'y', position: oTop }); }
              // Snap Bottom
              if (Math.abs((newY + lHeight) - oBottom) < snapThreshold) { newY = oBottom - lHeight; snapLinesLocal.push({ axis: 'y', position: oBottom }); }
              // Snap Center Y
              if (Math.abs((newY + lHeight / 2) - oCenterY) < snapThreshold) { newY = oCenterY - lHeight / 2; snapLinesLocal.push({ axis: 'y', position: oCenterY }); }
            });
          }

          updates.push({ id, updates: { x: Math.round(newX), y: Math.round(newY) } });
        });

        setSnapLines(snapLinesLocal);

        if (updates.length > 0) updateLayers(updates, true);
      }

      // 2. Resizing Layer
      if (resizingLayerId && resizeStart && layerStartSize && resizeHandle) {
        const dx = (e.clientX - resizeStart.x) / scale;
        const dy = (e.clientY - resizeStart.y) / scale;
        
        let newWidth = layerStartSize.width;
        let newHeight = layerStartSize.height;
        let newX = layerStartSize.x;
        let newY = layerStartSize.y;

        if (resizeHandle.includes('e')) newWidth = Math.max(10, layerStartSize.width + dx);
        if (resizeHandle.includes('s')) newHeight = Math.max(10, layerStartSize.height + dy);
        if (resizeHandle.includes('w')) {
          const possibleWidth = layerStartSize.width - dx;
          if (possibleWidth > 10) {
            newWidth = possibleWidth;
            newX = layerStartSize.x + dx;
          }
        }
        if (resizeHandle.includes('n')) {
          const possibleHeight = layerStartSize.height - dy;
          if (possibleHeight > 10) {
            newHeight = possibleHeight;
            newY = layerStartSize.y + dy;
          }
        }

        const layer = layers.find(l => l.id === resizingLayerId);
        const updates: any = {
          width: Math.max(20, Math.round(newWidth)),
          height: Math.max(20, Math.round(newHeight)),
          x: Math.round(newX),
          y: Math.round(newY)
        };

        if (layer?.type === 'text') {
          if (resizeHandle.length === 2) {
            // Corner handles -> Scale font
            const scaleRatio = updates.width / layerStartSize.width;
            updates.fontSize = Math.max(8, Math.round((layerStartSize.fontSize || 32) * scaleRatio));
            // Keep proportion for height
            updates.height = Math.max(20, Math.round(layerStartSize.height * scaleRatio));
            if (resizeHandle.includes('n')) {
              updates.y = layerStartSize.y + (layerStartSize.height - updates.height);
            }
          } else if (resizeHandle === 'e' || resizeHandle === 'w') {
            // Edge handles -> Text wrap (keep height & fontSize)
            updates.height = layerStartSize.height;
            updates.y = layerStartSize.y;
          }
        }

        updateLayer(resizingLayerId, updates);
        return;
      }

      if (isRotating && rotatingLayerId && rotateStart && cardRef.current) {
        const layer = layers.find(l => l.id === rotatingLayerId);
        if (!layer) return;

        const cardRect = cardRef.current.getBoundingClientRect();
        const layerCenterX = cardRect.left + (layer.x + layer.width / 2) * scale;
        const layerCenterY = cardRect.top + (layer.y + layer.height / 2) * scale;

        const currentAngle = Math.atan2(e.clientY - layerCenterY, e.clientX - layerCenterX) * (180 / Math.PI);
        let newRotation = rotateStart.initialRotation + (currentAngle - rotateStart.angle);
        
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 45) * 45;
        }

        updateLayer(rotatingLayerId, { rotation: newRotation });
        return;
      }

      // 3. Resizing Canvas Symmetrically
      if (resizingCanvas && canvasResizeHandle) {
        const dx = (e.clientX - resizingCanvas.startX) / scale;
        const dy = (e.clientY - resizingCanvas.startY) / scale;
        
        let newWidth = resizingCanvas.startW;
        let newHeight = resizingCanvas.startH;

        if (canvasResizeHandle.includes('e') || canvasResizeHandle.includes('w')) {
          const deltaX = canvasResizeHandle.includes('e') ? dx : -dx;
          newWidth = Math.max(100, resizingCanvas.startW + deltaX * 2);
        }
        
        if (canvasResizeHandle.includes('s') || canvasResizeHandle.includes('n')) {
          const deltaY = canvasResizeHandle.includes('s') ? dy : -dy;
          newHeight = Math.max(100, resizingCanvas.startH + deltaY * 2);
        }

        setGlobalSettings({ width: Math.round(newWidth), height: Math.round(newHeight) }, true);
      }

      // 4. Marquee Selection
      if (marquee && containerRef.current) {
        setMarquee(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        
        // Calculate marquee rect in container space
        const left = Math.min(marquee.startX, e.clientX);
        const top = Math.min(marquee.startY, e.clientY);
        const right = Math.max(marquee.startX, e.clientX);
        const bottom = Math.max(marquee.startY, e.clientY);

        const newSelection: string[] = [];
        layers.forEach(layer => {
          // Convert layer coordinates to screen space
          const layerScreenX = pan.x + (layer.x * scale);
          const layerScreenY = pan.y + (layer.y * scale);
          const layerScreenR = layerScreenX + ((layer.width || 100) * scale);
          const layerScreenB = layerScreenY + ((layer.height || 50) * scale);

          const intersect = !(
            layerScreenR < left || 
            layerScreenX > right || 
            layerScreenB < top || 
            layerScreenY > bottom
          );

          if (intersect) newSelection.push(layer.id);
        });

        if (newSelection.join(',') !== selectedLayerIds.join(',')) {
          selectLayer(newSelection);
        }
      }

      // 5. Drawing Path (Freehand)
      if (isDrawingPath && currentPathId && currentPathStart && containerRef.current) {
        const layerX = (e.clientX - containerRef.current.getBoundingClientRect().left - pan.x) / scale;
        const layerY = (e.clientY - containerRef.current.getBoundingClientRect().top - pan.y) / scale;
        const dx = layerX - currentPathStart.x;
        const dy = layerY - currentPathStart.y;
        
        const layer = layers.find(l => l.id === currentPathId);
        if (layer) {
          updateLayer(currentPathId, {
            pathData: `${layer.pathData} L ${dx} ${dy}`
          });
        }
      }
      });
    };

    const handlePointerUp = () => {
      if (isCanvasPanning) setIsCanvasPanning(false);
      if (isDrawingPath) setIsDrawingPath(false);
      setResizingCanvas(null);
      setSnapLines([]);
      setLayerStartPos({});

      setResizingLayerId(null);
      setResizeStart(null);
      setLayerStartSize(null);
      setResizeHandle(null);

      setIsRotating(false);
      setRotatingLayerId(null);
      setRotateStart(null);

      setResizingCanvas(null);
      setCanvasResizeHandle(null);

      setIsDrawingPath(false);
      setCurrentPathId(null);
      setCurrentPathStart(null);

      setMarquee(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isCanvasPanning, panStart, isDragging, dragStart, layerStartPos, scale, totalWidth, globalSettings.height, layers, selectedLayerIds, resizingLayerId, resizeStart, layerStartSize, resizeHandle, updateLayer, updateLayers, marquee, selectLayer, resizingCanvas, canvasResizeHandle, setGlobalSettings, isExporting, pan, isRotating, rotatingLayerId, rotateStart]);

  const handleWheel = (e: React.WheelEvent) => {
    if (isExporting) return;
    
    // Zoom toward center of viewport with very smooth sensitivity
    const zoomSensitivity = 0.0008;
    const delta = e.deltaY * -zoomSensitivity;
    let newScale = scale * Math.exp(delta);
    
    // Limits: 10% (0.1) to 300% (3)
    newScale = Math.min(Math.max(0.1, newScale), 3);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const scaleRatio = newScale / scale;
      const newPanX = centerX - (centerX - pan.x) * scaleRatio;
      const newPanY = centerY - (centerY - pan.y) * scaleRatio;
      
      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > 600) {
          h = (600 / w) * h;
          w = 600;
        }
        addLayer({
          id: crypto.randomUUID(),
          type: 'image',
          name: file.name || 'Imagen',
          src,
          x: 100, y: 100, width: w, height: h,
          rotation: 0, opacity: 1, locked: false, hidden: false
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onLayerPointerDown = (e: React.PointerEvent, layer: any) => {
    e.stopPropagation();
    if (layer.locked || isExporting) return;
    
    // Right click
    if (e.button === 2) {
      if (!selectedLayerIds.includes(layer.id)) {
        selectLayer([layer.id]);
      }
      return;
    }

    // Left click only
    if (e.button === 0) {
      let currentSelection = selectedLayerIds;
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        toggleLayerSelection(layer.id);
        currentSelection = selectedLayerIds.includes(layer.id) 
          ? selectedLayerIds.filter(id => id !== layer.id)
          : [...selectedLayerIds, layer.id];
      } else if (!selectedLayerIds.includes(layer.id)) {
        selectLayer([layer.id]);
        currentSelection = [layer.id];
      }

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      
      const startPosMap: { [id: string]: {x: number, y: number} } = {};
      layers.forEach(l => {
        if (currentSelection.includes(l.id)) {
          startPosMap[l.id] = { x: l.x, y: l.y };
        }
      });
      setLayerStartPos(startPosMap);
    }
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (isExporting) return;
    
    if (e.button === 1) { // Middle click -> Pan
      e.preventDefault();
      setIsCanvasPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.button === 0) { // Left click
      const layerX = (e.clientX - (containerRef.current?.getBoundingClientRect().left || 0) - pan.x) / scale;
      const layerY = (e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) - pan.y) / scale;

      if (activeTool === 'text') {
        const id = crypto.randomUUID();
        addLayer({
          id,
          type: 'text',
          name: 'Texto',
          x: Math.round(layerX),
          y: Math.round(layerY),
          width: 200,
          height: 50,
          text: 'Texto',
          color: '#000000',
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: '500',
          textAlign: 'left',
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false
        });
        setActiveTool('pointer');
        setEditingLayerId(id);
      } else if (activeTool === 'shape') {
        addLayer({
          id: crypto.randomUUID(),
          type: 'shape',
          name: selectedShapeType.charAt(0).toUpperCase() + selectedShapeType.slice(1),
          shapeType: selectedShapeType,
          x: Math.round(layerX),
          y: Math.round(layerY),
          width: 100,
          height: 100,
          backgroundColor: '#000000',
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false
        });
        setActiveTool('pointer');
      } else if (activeTool === 'pen_freehand') {
        const id = crypto.randomUUID();
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
        const id = crypto.randomUUID();
        addLayer({
          id,
          type: 'path',
          name: 'Vector',
          x: Math.round(layerX),
          y: Math.round(layerY),
          width: 100,
          height: 100,
          pathData: 'M 0 0 L 50 50 L 100 0', // Placeholder shape since we don't have a complex bezier engine yet
          layerColor: '#000000',
          strokeWidth: 2,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false
        });
        setActiveTool('pointer');
      } else {
        // Default Pointer Marquee behavior
        selectLayer([]);
        setContextMenu(null);
        setMarquee({
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY
        });
      }
    }
  };

  const onResizePointerDown = (e: React.PointerEvent, layer: any, handle: string) => {
    e.stopPropagation();
    setResizingLayerId(layer.id);
    setResizeHandle(handle);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setLayerStartSize({ width: layer.width || 100, height: layer.height || 50, x: layer.x, y: layer.y, fontSize: layer.fontSize });
  };

  const onCanvasResizePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    setResizingCanvas({ 
      startX: e.clientX, 
      startY: e.clientY, 
      startW: globalSettings.width, 
      startH: globalSettings.height 
    });
    setCanvasResizeHandle(handle);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isExporting) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const renderResetConfirmModal = () => {
    if (!showResetConfirm) return null;
    return (
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '12px',
          padding: '24px',
          width: '320px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>¿Quieres eliminar el diseño?</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Si confirmas se eliminará todo tu progreso y empezarás de 0.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              onClick={() => setShowResetConfirm(false)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer'
              }}>
              Cancelar
            </button>
            <button 
              onClick={() => { resetDesign(); setShowResetConfirm(false); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--danger-color)',
                color: 'white',
                fontWeight: 500,
                cursor: 'pointer'
              }}>
              Restablecer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResizeHandles = (layer: any) => {
    if (isExporting || selectedLayerIds.length !== 1 || !selectedLayerIds.includes(layer.id)) return null;
    
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const resizeHandles = handles.map(h => {
      let top = 'auto', bottom = 'auto', left = 'auto', right = 'auto';
      
      if (h.includes('n')) top = '-4px';
      if (h.includes('s')) bottom = '-4px';
      if (h.includes('w')) left = '-4px';
      if (h.includes('e')) right = '-4px';
      
      let transform = '';
      if (h === 'n' || h === 's') { left = '50%'; transform = 'translateX(-50%)'; }
      if (h === 'w' || h === 'e') { top = '50%'; transform = 'translateY(-50%)'; }

      return (
        <div
          key={h}
          onPointerDown={(e) => onResizePointerDown(e, layer, h)}
          style={{
            position: 'absolute',
            width: 8, height: 8,
            backgroundColor: 'white',
            border: '1px solid var(--accent-color)',
            top, bottom, left, right, transform,
            cursor: `${h}-resize`,
            zIndex: 100,
            pointerEvents: 'auto'
          }}
        />
      );
    });

    const rotationHandle = (
      <div
        key="rotate"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect();
            const layerCenterX = cardRect.left + (layer.x + layer.width / 2) * scale;
            const layerCenterY = cardRect.top + (layer.y + layer.height / 2) * scale;
            const angle = Math.atan2(e.clientY - layerCenterY, e.clientX - layerCenterX) * (180 / Math.PI);
            
            setIsRotating(true);
            setRotatingLayerId(layer.id);
            setRotateStart({ angle, initialRotation: layer.rotation || 0 });
          }
        }}
        style={{
          position: 'absolute',
          width: 12, height: 12,
          backgroundColor: '#0ea5e9',
          border: '2px solid white',
          borderRadius: '50%',
          top: -24, left: '50%',
          transform: 'translateX(-50%)',
          cursor: 'grab',
          zIndex: 100,
          pointerEvents: 'auto'
        }}
      />
    );

    return [...resizeHandles, rotationHandle];
  };

  const renderCanvasResizeHandles = () => {
    if (isExporting || selectedLayerIds.length > 0) return null;
    
    const handles = [
      { h: 'nw', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="19" x2="5" y2="5"></line><polyline points="14 5 5 5 5 14"></polyline></svg> },
      { h: 'n',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg> },
      { h: 'ne', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="10 5 19 5 19 14"></polyline></svg> },
      { h: 'e',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> },
      { h: 'se', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="5" x2="19" y2="19"></line><polyline points="19 10 19 19 10 19"></polyline></svg> },
      { h: 's',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg> },
      { h: 'sw', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><polyline points="5 10 5 19 14 19"></polyline></svg> },
      { h: 'w',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff653f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> }
    ];

    return handles.map(({ h, icon }) => {
      let top = 'auto', bottom = 'auto', left = 'auto', right = 'auto';
      
      const offset = '-32px'; // Completely outside the canvas

      if (h.includes('n')) top = offset;
      if (h.includes('s')) bottom = offset;
      if (h.includes('w')) left = offset;
      if (h.includes('e')) right = offset;
      
      let transform = '';
      if (h === 'n' || h === 's') { left = '50%'; transform = 'translateX(-50%)'; }
      if (h === 'w' || h === 'e') { top = '50%'; transform = 'translateY(-50%)'; }

      return (
        <div
          key={`canvas-${h}`}
          onPointerDown={(e) => onCanvasResizePointerDown(e, h)}
          style={{
            position: 'absolute',
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            top, bottom, left, right, transform,
            cursor: `${h}-resize`,
            zIndex: 100,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          {icon}
        </div>
      );
    });
  };

  const renderCanvasTooltip = () => {
    if (!resizingCanvas || isExporting) return null;
    return (
      <div style={{
        position: 'absolute',
        top: -40,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--accent-color)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 600,
        pointerEvents: 'none',
        zIndex: 1000,
        whiteSpace: 'nowrap'
      }}>
        {Math.round(totalWidth)}px × {Math.round(globalSettings.height)}px
      </div>
    );
  };

  const renderMarquee = () => {
    if (!marquee || !containerRef.current || isExporting) return null;

    const left = Math.min(marquee.startX, marquee.currentX);
    const top = Math.min(marquee.startY, marquee.currentY);
    const width = Math.abs(marquee.startX - marquee.currentX);
    const height = Math.abs(marquee.startY - marquee.currentY);

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeLeft = left - containerRect.left;
    const relativeTop = top - containerRect.top;

    return (
      <div style={{
        position: 'absolute',
        left: relativeLeft,
        top: relativeTop,
        width,
        height,
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
        border: '1px solid rgba(0, 122, 255, 0.8)',
        pointerEvents: 'none',
        zIndex: 1000
      }} />
    );
  };

  const renderSnapLines = () => {
    if (snapLines.length === 0 || isExporting) return null;
    return snapLines.map((line, i) => (
      <div key={`snap-${i}`} style={{
        position: 'absolute',
        backgroundColor: '#ff0055',
        zIndex: 1001,
        pointerEvents: 'none',
        left: line.axis === 'x' ? line.position : 0,
        top: line.axis === 'y' ? line.position : 0,
        width: line.axis === 'y' ? totalWidth : 1,
        height: line.axis === 'x' ? globalSettings.height : 1,
      }} />
    ));
  };

  const renderOverlays = () => {
    if (isExporting) return null;
    
    const overlays = [];
    const numSlides = globalSettings.isCarousel ? globalSettings.carouselSlides : 1;
    
    for (let i = 0; i < numSlides; i++) {
      const offsetX = i * globalSettings.width;
      
      // Separator (only after first slide)
      if (globalSettings.isCarousel && globalSettings.showCarouselGuides && i > 0) {
        overlays.push(
          <div key={`sep-${i}`} style={{
            position: 'absolute',
            left: offsetX,
            top: 0, bottom: 0,
            width: 1,
            backgroundColor: 'transparent',
            borderRight: '1px dashed rgba(0, 122, 255, 0.5)',
            zIndex: 900,
            pointerEvents: 'none'
          }} />
        );
      }

      // Safe Area
      if (globalSettings.showSafeArea) {
        overlays.push(
          <div key={`safe-${i}`} style={{
            position: 'absolute',
            left: offsetX + (globalSettings.width * 0.05),
            top: globalSettings.height * 0.1,
            width: globalSettings.width * 0.9,
            height: globalSettings.height * 0.8,
            border: '1px solid rgba(255, 59, 48, 0.4)',
            zIndex: 890,
            pointerEvents: 'none'
          }} />
        );
      }

      // Grid (3x3 Rule of Thirds)
      if (globalSettings.showGrid) {
        const thirdW = globalSettings.width / 3;
        const thirdH = globalSettings.height / 3;
        overlays.push(
          <div key={`grid-${i}`} style={{
            position: 'absolute',
            left: offsetX, top: 0, width: globalSettings.width, height: globalSettings.height,
            zIndex: 880, pointerEvents: 'none',
            backgroundImage: `linear-gradient(to right, transparent ${thirdW-1}px, rgba(0,0,0,0.1) ${thirdW}px, transparent ${thirdW+1}px),
                              linear-gradient(to right, transparent ${thirdW*2-1}px, rgba(0,0,0,0.1) ${thirdW*2}px, transparent ${thirdW*2+1}px),
                              linear-gradient(to bottom, transparent ${thirdH-1}px, rgba(0,0,0,0.1) ${thirdH}px, transparent ${thirdH+1}px),
                              linear-gradient(to bottom, transparent ${thirdH*2-1}px, rgba(0,0,0,0.1) ${thirdH*2}px, transparent ${thirdH*2+1}px)`
          }} />
        );
      }

      // Margins
      if (globalSettings.showMargins) {
        const m = 40;
        overlays.push(
           <div key={`margin-${i}`} style={{
            position: 'absolute',
            left: offsetX + m, top: m,
            width: globalSettings.width - m*2, height: globalSettings.height - m*2,
            border: '1px dotted rgba(0,0,0,0.2)',
            zIndex: 870, pointerEvents: 'none'
          }} />
        );
      }
    }

    return overlays;
  };

  const cardStyle: React.CSSProperties = {
    width: `${totalWidth}px`,
    height: `${globalSettings.height}px`,
    backgroundColor: 'transparent',
    borderRadius: `${globalSettings.borderRadius}px`,
    padding: `${globalSettings.padding}px`,
    boxShadow: globalSettings.showShadow 
      ? `${globalSettings.shadowConfig.x}px ${globalSettings.shadowConfig.y}px ${globalSettings.shadowConfig.blur}px ${globalSettings.shadowConfig.spread}px rgba(0,0,0,${globalSettings.shadowConfig.opacity})` 
      : 'none',
    position: 'relative',
    overflow: 'hidden',
    transition: isAnimatingLayout ? 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${pan.x}px`,
    top: `${pan.y}px`,
    width: `${totalWidth}px`,
    height: `${globalSettings.height}px`,
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
    willChange: 'transform',
    transition: isAnimatingLayout ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
  };

  const renderBackground = () => {
    let bg = globalSettings.backgroundColor;
    if (globalSettings.backgroundType === 'gradient' && globalSettings.gradient) {
      const g = globalSettings.gradient;
      if (g.type === 'linear') bg = `linear-gradient(${g.angle}deg, ${g.colors.join(', ')})`;
      else if (g.type === 'radial') bg = `radial-gradient(circle, ${g.colors.join(', ')})`;
    }
    
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: bg
      }}>
        {globalSettings.filters && globalSettings.filters.map(filter => {
          if (filter.type === 'noise') {
            const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${filter.scale || 0.65}' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;
            return (
              <div key={filter.id} style={{
                position: 'absolute', inset: 0,
                opacity: filter.opacity / 100,
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
                backgroundImage: `url("${noiseSvg}")`,
                backgroundSize: '200px 200px',
                backgroundRepeat: 'repeat',
                transform: 'translateZ(0)', // Force GPU acceleration for the filter overlay
                willChange: 'transform'
              }} />
            );
          } else if (filter.type === 'halftone') {
            const size = filter.dotSize || 4;
            const dot = size * 0.4;
            const gap = dot + 0.5;
            return (
              <div key={filter.id} style={{
                position: 'absolute', inset: 0,
                opacity: filter.opacity / 100,
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
                backgroundImage: `radial-gradient(circle at center, #000000 ${dot}px, transparent ${gap}px)`,
                backgroundSize: `${size}px ${size}px`,
                backgroundPosition: '0 0'
              }} />
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderLayer = (layer: any) => {
    if (layer.hidden) return null;
    
    const isSelected = selectedLayerIds.includes(layer.id) && !isExporting;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${layer.x}px`,
      top: `${layer.y}px`,
      width: layer.width ? `${layer.width}px` : 'auto',
      height: layer.height ? `${layer.height}px` : 'auto',
      opacity: layer.opacity,
      transform: `rotate(${layer.rotation}deg)`,
      cursor: layer.locked || isExporting ? 'default' : (isDragging && isSelected ? 'grabbing' : 'grab'),
      border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
      boxSizing: 'border-box'
    };

    const innerContent = () => {
      switch (layer.type) {
        case 'text':
          if (editingLayerId === layer.id && !isExporting) {
            return (
              <textarea
                autoFocus
                defaultValue={layer.text}
                onBlur={(e) => {
                  updateLayer(layer.id, { text: e.target.value });
                  setEditingLayerId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    updateLayer(layer.id, { text: e.currentTarget.value });
                    setEditingLayerId(null);
                    e.stopPropagation();
                  }
                  e.stopPropagation();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  color: layer.color,
                  fontSize: `${layer.fontSize}px`,
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.fontWeight,
                  textAlign: layer.textAlign,
                  width: '100%', height: '100%',
                  background: 'transparent',
                  border: '1px solid var(--primary-color)',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  margin: 0, padding: 0,
                  whiteSpace: 'pre-wrap'
                }}
              />
            );
          }
          return (
            <div 
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!layer.locked && !isExporting) setEditingLayerId(layer.id);
              }}
              style={{
                color: layer.backgroundType === 'gradient' ? 'transparent' : layer.color,
                background: layer.backgroundType === 'gradient' && layer.gradient 
                  ? `linear-gradient(${layer.gradient.angle || 135}deg, ${layer.gradient.colors?.[0] || '#ff0000'}, ${layer.gradient.colors?.[1] || '#0000ff'})` 
                  : 'none',
                WebkitBackgroundClip: layer.backgroundType === 'gradient' ? 'text' : 'initial',
                WebkitTextFillColor: layer.backgroundType === 'gradient' ? 'transparent' : 'initial',
                fontSize: `${layer.fontSize}px`,
                fontFamily: layer.fontFamily,
                fontWeight: layer.fontWeight,
                textAlign: layer.textAlign,
                width: '100%', height: '100%',
                userSelect: 'none',
                whiteSpace: 'pre-wrap'
              }}>
              {layer.text}
            </div>
          );
        case 'button':
          return (
            <div style={{
              backgroundColor: layer.backgroundColor,
              color: layer.color,
              fontSize: `${layer.fontSize}px`,
              fontFamily: layer.fontFamily,
              fontWeight: layer.fontWeight,
              borderRadius: `${layer.borderRadius}px`,
              padding: layer.padding,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%', height: '100%'
            }}>
              {layer.text}
            </div>
          );
        case 'image':
          return (
            <img 
              src={layer.src} 
              alt="" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                pointerEvents: 'none',
                mixBlendMode: layer.backgroundRemoved ? 'multiply' : 'normal'
              }} 
            />
          );
        case 'shape': {
          const shapeStyle: React.CSSProperties = {
            background: layer.backgroundType === 'gradient' && layer.gradient
              ? `linear-gradient(${layer.gradient.angle || 135}deg, ${layer.gradient.colors?.[0] || '#ff0000'}, ${layer.gradient.colors?.[1] || '#0000ff'})`
              : (layer.backgroundColor || '#000000'),
            width: '100%', height: '100%',
            position: 'absolute'
          };
          
          if (layer.shapeType === 'circle') {
            shapeStyle.borderRadius = '50%';
          } else if (layer.shapeType === 'triangle') {
            shapeStyle.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
          } else if (layer.shapeType === 'polygon' || layer.shapeType === 'hexagon') {
            shapeStyle.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
          } else if (layer.shapeType === 'pentagon') {
            shapeStyle.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
          } else if (layer.shapeType === 'cloud') {
            shapeStyle.WebkitMaskImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z'/%3E%3C/svg%3E")`;
            shapeStyle.WebkitMaskSize = 'contain';
            shapeStyle.WebkitMaskRepeat = 'no-repeat';
            shapeStyle.WebkitMaskPosition = 'center';
          } else if (layer.shapeType === 'heart') {
            shapeStyle.WebkitMaskImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E")`;
            shapeStyle.WebkitMaskSize = 'contain';
            shapeStyle.WebkitMaskRepeat = 'no-repeat';
            shapeStyle.WebkitMaskPosition = 'center';
          } else if (layer.shapeType === 'line') {
            shapeStyle.height = '4px';
            shapeStyle.top = 'calc(50% - 2px)';
          } else {
            shapeStyle.borderRadius = `${layer.borderRadius || 0}px`;
          }
          return <div style={shapeStyle} />;
        }
        case 'icon': {
          const IconComponent = {
            'Star': Star, 'Smile': Smile, 'Zap': Zap, 'Camera': Camera, 'Bell': Bell, 
            'Search': Search, 'Mail': Mail, 'Phone': Phone, 'MapPin': MapPin, 
            'Settings': Settings, 'User': User, 'Heart': HeartIcon, 'ThumbsUp': ThumbsUp, 
            'MessageCircle': MessageCircle, 'Share2': Share2, 'Bookmark': Bookmark, 
            'Home': Home, 'Globe': Globe
          }[layer.iconName || 'Star'];

          if (!IconComponent) return null;

          return (
            <div style={{ width: '100%', height: '100%', color: layer.color || '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
            </div>
          );
        }
        case 'path':
          return (
             <svg width="100%" height="100%" viewBox={`0 0 ${layer.width || 100} ${layer.height || 100}`} style={{ overflow: 'visible', pointerEvents: 'none' }}>
               <path 
                 d={layer.pathData || 'M 0 0'} 
                 stroke={layer.layerColor || '#000000'} 
                 strokeWidth={layer.strokeWidth || 2} 
                 fill="none" 
                 strokeLinecap="round"
                 strokeLinejoin="round"
               />
             </svg>
          );
        default: return null;
      }
    };

    return (
      <div 
        key={layer.id} 
        style={baseStyle}
        onPointerDown={(e) => onLayerPointerDown(e, layer)}
      >
        {innerContent()}
      </div>
    );
  };

  const renderLayerHandles = (layer: any) => {
    return (
      <div key={`handles-${layer.id}`} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
         <div style={{ 
           position: 'absolute', 
           left: layer.x, 
           top: layer.y, 
           width: layer.width || 100, 
           height: layer.height || 50,
           transform: `rotate(${layer.rotation || 0}deg)`,
           pointerEvents: 'none'
         }}>
            {renderResizeHandles(layer)}
         </div>
      </div>
    );
  };

  const renderZoomControls = () => {
    if (isExporting) return null;
    return (
      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--bg-panel)',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        userSelect: 'none'
      }}>
        <button 
          onClick={fitToScreen}
          title="Ajustar vista"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-color)',
            cursor: 'pointer', color: 'var(--text-secondary)'
          }}
        >
          <Maximize size={14} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', width: '45px', textAlign: 'right' }}>
          {Math.round(scale * 100)}%
        </span>
        <input 
          type="range" 
          min="10" 
          max="300" 
          value={scale * 100}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const newScale = Number(e.target.value) / 100;
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              
              const scaleRatio = newScale / scale;
              const newPanX = centerX - (centerX - pan.x) * scaleRatio;
              const newPanY = centerY - (centerY - pan.y) * scaleRatio;
              
              setScale(newScale);
              setPan({ x: newPanX, y: newPanY });
            }
          }}
          style={{ width: '120px', cursor: 'pointer' }}
        />
      </div>
    );
  };

  const renderTopLeftControls = () => {
    if (isExporting) return null;
    return (
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        gap: '8px',
        zIndex: 1000,
        userSelect: 'none'
      }}>
        <button onClick={undo} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'var(--bg-panel)', padding: '8px 12px',
          borderRadius: '8px', border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500
        }}>
          <Undo size={14} /> Deshacer <span style={{fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 4}}>⌘Z</span>
        </button>
        <button onClick={redo} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'var(--bg-panel)', padding: '8px 12px',
          borderRadius: '8px', border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500
        }}>
          <Redo size={14} /> Rehacer <span style={{fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 4}}>⌘Y</span>
        </button>
      </div>
    );
  };

  const renderTopRightControls = () => {
    if (isExporting) return null;
    return (
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        gap: '8px',
        zIndex: 1000,
        userSelect: 'none'
      }}>
        <button onClick={() => setShowResetConfirm(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'var(--bg-panel)', padding: '8px 12px',
          borderRadius: '8px', border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
          color: 'var(--danger-color)', fontSize: '13px', fontWeight: 500
        }}>
          <Trash2 size={14} /> Reset <span style={{fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 4}}>Ctrl+Del</span>
        </button>
      </div>
    );
  };

  const renderShortcutsMenu = () => {
    return (
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        backgroundColor: 'var(--bg-panel)',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Atajos Rápidos
        </div>
        {[
          { key: '1', label: '1:1 Post' },
          { key: '2', label: '4:5 Vertical' },
          { key: '3', label: '1.91:1 Horizontal' },
          { key: '4', label: '9:16 Story' },
          { key: '5', label: 'Reel' },
          { key: '6', label: 'Carousel' },
          { key: 'T', label: 'Texto' },
          { key: 'H', label: 'Título' },
          { key: 'B', label: 'Botón' },
        ].map(sc => (
          <div key={sc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '150px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-primary)' }}>{sc.label}</span>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '2px', 
              backgroundColor: 'var(--bg-canvas)', padding: '2px 6px', 
              borderRadius: '4px', border: '1px solid var(--border-color)',
              fontSize: '11px', color: 'var(--text-secondary)'
            }}>
              ⌘ {sc.key}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`checkerboard ${styles.previewContainer}`} 
      style={{ cursor: isCanvasPanning ? 'grabbing' : 'default' }}
      ref={containerRef}
      onPointerDown={onCanvasPointerDown}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
    >
      <div style={wrapperStyle}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
        {renderCanvasResizeHandles()}
        <div id="card-export-node" ref={cardRef} style={cardStyle}>
          {renderBackground()}
          {renderCanvasTooltip()}
          {renderOverlays()}
          {renderSnapLines()}
          {layers.map(renderLayer)}
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: totalWidth, height: globalSettings.height, pointerEvents: 'none', zIndex: 1000 }}>
          {layers.map(renderLayerHandles)}
        </div>
      </div>

      {renderTopLeftControls()}
      {renderTopRightControls()}
      {renderShortcutsMenu()}
      {renderZoomControls()}
      {renderMarquee()}
      {renderResetConfirmModal()}

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onClose={() => setContextMenu(null)} 
          onAddImage={() => fileInputRef.current?.click()}
          canvasRect={cardRef.current?.getBoundingClientRect() || null}
          scale={scale}
        />
      )}
    </div>
  );
}
