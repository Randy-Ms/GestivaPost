const fs = require('fs');

const file = 'src/components/Preview/Preview.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Add imports
content = content.replace("import ContextMenu from './ContextMenu';", 
`import { useCanvasEngine } from '../../hooks/useCanvasEngine';
import { useTransformEngine } from '../../hooks/useTransformEngine';
import { useDrawingEngine } from '../../hooks/useDrawingEngine';
import ContextMenu from './ContextMenu';`);

// Replace State Block
const stateStart = content.indexOf('  // Infinite Canvas State');
const stateEnd = content.indexOf('  useEffect(() => {\n    if (isExporting) return;\n\n    const handleKeyDown');

const stateBlock = `  const totalWidth = globalSettings.isCarousel ? globalSettings.width * globalSettings.carouselSlides : globalSettings.width;

  const { scale, setScale, pan, setPan, isCanvasPanning, setIsCanvasPanning, panStart, setPanStart, isAnimatingLayout, fitToScreen, handleWheel } = useCanvasEngine({ containerRef, totalWidth, globalSettingsHeight: globalSettings.height, isExporting });

  const layerNodesRef = useRef<Record<string, HTMLElement | null>>({});

  const { isDragging, startDrag, resizingLayerId, startResize, isRotating, rotatingLayerId, startRotate, snapLines, handleTransformPointerMove, handleTransformPointerUp } = useTransformEngine({ layers, selectedLayerIds, scale, totalWidth, globalSettingsHeight: globalSettings.height, updateLayers, layerNodesRef });

  const { isDrawingPath, currentPathId, penState, cursorPos, handleDrawingPointerDown, handleDrawingPointerMove, handleDrawingPointerUp, resetDrawingState, generatePathData } = useDrawingEngine({ layers, updateLayer, addLayer, selectLayer, scale, totalWidth, globalSettingsHeight: globalSettings.height, activeTool, setActiveTool, cardRef });

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const [marquee, setMarquee] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [resizingCanvas, setResizingCanvas] = useState<{ startX: number, startY: number, startW: number, startH: number } | null>(null);
  const [canvasResizeHandle, setCanvasResizeHandle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rAFRef = useRef<number | null>(null);

`;
content = content.substring(0, stateStart) + stateBlock + content.substring(stateEnd);

// Replace PointerMove and handleWheel logic
const hookStart = content.indexOf('  useEffect(() => {\n    if (isExporting) return;\n\n    const handlePointerMove');
const hookEnd = content.indexOf('  const onCanvasPointerDown')

const hookBlock = `  useEffect(() => {
    if (isExporting) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(() => {
        handleTransformPointerMove(e, layers);
        handleDrawingPointerMove(e);

        if (isCanvasPanning && panStart) {
          setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }

        if (marquee && !isDragging) {
          setMarquee(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
          const cardRect = cardRef.current?.getBoundingClientRect();
          if (cardRect) {
            const mX = (Math.min(marquee.startX, e.clientX) - cardRect.left) / scale;
            const mY = (Math.min(marquee.startY, e.clientY) - cardRect.top) / scale;
            const mW = Math.abs(e.clientX - marquee.startX) / scale;
            const mH = Math.abs(e.clientY - marquee.startY) / scale;

            const newSelection: string[] = [];
            layers.forEach(layer => {
              if (layer.hidden) return;
              const lWidth = layer.width || 100;
              const lHeight = layer.height || 50;
              if (layer.x < mX + mW && layer.x + lWidth > mX && layer.y < mY + mH && layer.y + lHeight > mY) {
                newSelection.push(layer.id);
              }
            });
            if (newSelection.join(',') !== selectedLayerIds.join(',')) {
              selectLayer(newSelection);
            }
          }
        }

        if (resizingCanvas && canvasResizeHandle) {
          const dx = (e.clientX - resizingCanvas.startX) / scale;
          const dy = (e.clientY - resizingCanvas.startY) / scale;
          let newWidth = resizingCanvas.startW;
          let newHeight = resizingCanvas.startH;
          if (canvasResizeHandle.includes('e')) newWidth = Math.max(100, resizingCanvas.startW + dx);
          if (canvasResizeHandle.includes('s')) newHeight = Math.max(100, resizingCanvas.startH + dy);
          setGlobalSettings({ width: Math.round(newWidth), height: Math.round(newHeight) });
        }
      });
    };

    const handlePointerUp = () => {
      handleTransformPointerUp();
      handleDrawingPointerUp();
      if (isCanvasPanning) setIsCanvasPanning(false);
      setMarquee(null);
      setResizingCanvas(null);
      setCanvasResizeHandle(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [layers, selectedLayerIds, isCanvasPanning, panStart, marquee, resizingCanvas, canvasResizeHandle, isDragging, scale, globalSettings.width, globalSettings.height, isExporting, handleTransformPointerMove, handleTransformPointerUp, handleDrawingPointerMove, handleDrawingPointerUp]);

`;
content = content.substring(0, hookStart) + hookBlock + content.substring(hookEnd);

// Replace onCanvasPointerDown
content = content.replace('const onCanvasPointerDown = (e: React.PointerEvent) => {', 
`const onCanvasPointerDown = (e: React.PointerEvent) => {
    handleDrawingPointerDown(e);`);

// Replace renderLayer ref
content = content.replace(/<div\n\s+key=\{layer\.id\}\n\s+style=\{\{/g, `<div
      key={layer.id}
      ref={el => layerNodesRef.current[layer.id] = el}
      style={{`);

// Replace dragging trigger
content = content.replace(/onPointerDown=\{\(e\) => \{[\s\S]*?if \(!selectedLayerIds\.includes\(layer\.id\)\) \{[\s\S]*?selectLayer\(\[layer\.id\]\);[\s\S]*?\}[\s\S]*?setIsDragging\(true\);[\s\S]*?\}\}/g, `onPointerDown={(e) => {
          if (activeTool !== 'pointer') return;
          e.stopPropagation();
          setContextMenu(null);
          
          let currentSelected = selectedLayerIds;
          if (!selectedLayerIds.includes(layer.id)) {
            if (e.shiftKey) {
              currentSelected = [...selectedLayerIds, layer.id];
              selectLayer(currentSelected);
            } else {
              currentSelected = [layer.id];
              selectLayer(currentSelected);
            }
          }
          startDrag(e, currentSelected, layers);
        }}`);

// Replace resizing trigger
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'se'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'se'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'sw'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'sw'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'ne'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'ne'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'nw'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'nw'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'n'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'n'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 's'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 's'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'e'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'e'); }}`);
content = content.replace(/onPointerDown=\{\(e\) => onResizePointerDown\(e, layer, 'w'\)\}/g, `onPointerDown={(e) => { e.stopPropagation(); startResize(e, layer, 'w'); }}`);

// Replace rotate trigger
content = content.replace(/onPointerDown=\{\(e\) => \{[\s\S]*?setIsRotating\(true\);[\s\S]*?\}\}/g, `onPointerDown={(e) => {
          e.stopPropagation();
          startRotate(e, layer, scale);
        }}`);

fs.writeFileSync(file, content);
console.log("Refactoring complete");
