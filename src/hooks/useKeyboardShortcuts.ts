import { useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore';

export function useKeyboardShortcuts() {
  const { 
    undo, redo, deleteLayer, duplicateLayer, selectedLayerIds, 
    selectLayer, showResetConfirm, setShowResetConfirm, layers,
    setActiveTool, showMockup, setShowMockup, copySelectedLayers, pasteLayers,
    showDashboardCreator, setShowDashboardCreator
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering shortcuts if typing in an input or contenteditable element
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Tool shortcuts (Ctrl + Key)
      if (cmdOrCtrl && !e.shiftKey) {
        const key = e.key.toLowerCase();
        // Prevent conflicts with basic text editing if focused on canvas
        if (key === 'q') { e.preventDefault(); setActiveTool('pointer'); return; }
        if (key === 't') { e.preventDefault(); setActiveTool('text'); return; }
        if (key === 'o') { e.preventDefault(); setActiveTool('shape'); return; }
        if (key === 'l') { e.preventDefault(); setActiveTool('pen_freehand'); return; }
        if (key === 'p') { e.preventDefault(); setActiveTool('pen_bezier'); return; }
        if (key === 'i') { e.preventDefault(); setActiveTool('image'); return; }
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (!showResetConfirm && selectedLayerIds.length > 0) {
            e.preventDefault();
            selectedLayerIds.forEach(id => deleteLayer(id));
            selectLayer([]);
          }
          break;

        case 'Escape':
          if (showResetConfirm) {
            setShowResetConfirm(false);
          } else if (selectedLayerIds.length > 0) {
            selectLayer([]);
          }
          break;

        case 'z':
        case 'Z':
          if (cmdOrCtrl) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;

        case 'y':
        case 'Y':
          if (cmdOrCtrl) {
            e.preventDefault();
            redo();
          }
          break;

        case 'd':
        case 'D':
          if (cmdOrCtrl) {
            e.preventDefault();
            if (e.shiftKey) {
              setShowDashboardCreator(!showDashboardCreator);
            } else {
              selectedLayerIds.forEach(id => duplicateLayer(id));
            }
          }
          break;

        case 'a':
        case 'A':
          if (cmdOrCtrl) {
            e.preventDefault();
            selectLayer(layers.map(l => l.id));
          }
          break;

        case 'c':
        case 'C':
          if (cmdOrCtrl) {
            e.preventDefault();
            copySelectedLayers();
          }
          break;

        case 'v':
        case 'V':
          if (cmdOrCtrl) {
            e.preventDefault();
            pasteLayers();
          }
          break;

        case 'm':
        case 'M':
          if (cmdOrCtrl) {
            e.preventDefault();
            setShowMockup(!showMockup);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteLayer, duplicateLayer, selectedLayerIds, selectLayer, showResetConfirm, setShowResetConfirm, layers, showMockup, setShowMockup, copySelectedLayers, pasteLayers, showDashboardCreator, setShowDashboardCreator]);
}
