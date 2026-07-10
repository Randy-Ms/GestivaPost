import { useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore';

export function useKeyboardShortcuts() {
  const { 
    undo, redo, deleteLayer, duplicateLayer, selectedLayerIds, 
    selectLayer, showResetConfirm, setShowResetConfirm, layers,
    setActiveTool, showMockup, setShowMockup, copySelectedLayers, pasteLayers
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering shortcuts if typing in an input or contenteditable element
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Single-key shortcuts for tools (no modifier keys)
      if (!cmdOrCtrl && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'v') { e.preventDefault(); setActiveTool('pointer'); return; }
        if (key === 't') { e.preventDefault(); setActiveTool('text'); return; }
        if (key === 'o') { e.preventDefault(); setActiveTool('shape'); return; }
        if (key === 'p') { e.preventDefault(); setActiveTool('pen_freehand'); return; }
        // Note: I for Image triggers a hidden file input, so it's trickier to just set activeTool 
        // without clicking the input. The Toolbar handles 'I' effectively if we focus it, 
        // but let's just set the tool state for now.
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
            selectedLayerIds.forEach(id => duplicateLayer(id));
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
  }, [undo, redo, deleteLayer, duplicateLayer, selectedLayerIds, selectLayer, showResetConfirm, setShowResetConfirm, layers, showMockup, setShowMockup, copySelectedLayers, pasteLayers]);
}
