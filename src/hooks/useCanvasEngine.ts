import { useState, useRef, useEffect, useCallback } from 'react';
import type { RefObject } from 'react';

export function useCanvasEngine({
  containerRef,
  totalWidth,
  globalSettingsHeight,
  isExporting
}: {
  containerRef: RefObject<HTMLElement>;
  totalWidth: number;
  globalSettingsHeight: number;
  isExporting: boolean;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  
  const [isAnimatingLayout, setIsAnimatingLayout] = useState(false);
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      
      const fitScale = Math.min((cw - 100) / totalWidth, (ch - 100) / globalSettingsHeight, 1);
      
      // Enable CSS transitions temporarily
      setIsAnimatingLayout(true);
      if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = setTimeout(() => setIsAnimatingLayout(false), 500);

      setScale(fitScale);
      
      const fitPanX = (cw - (totalWidth * fitScale)) / 2;
      const fitPanY = (ch - (globalSettingsHeight * fitScale)) / 2;
      setPan({ x: fitPanX, y: fitPanY });
    }
  }, [containerRef, totalWidth, globalSettingsHeight]);

  // Auto fit-to-screen when changing formats or window resize
  useEffect(() => {
    fitToScreen();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
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
  }, [isExporting, scale, pan, containerRef]);

  return {
    scale, setScale,
    pan, setPan,
    isCanvasPanning, setIsCanvasPanning,
    panStart, setPanStart,
    isAnimatingLayout,
    fitToScreen,
    handleWheel
  };
}
