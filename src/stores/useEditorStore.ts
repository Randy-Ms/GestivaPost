import { create } from 'zustand';
import type { Layer, GlobalSettings, SocialFormat, Tool, ShapeType } from '../types';

export const defaultSettings: GlobalSettings = {
  width: 1080,
  height: 1080,
  backgroundType: 'solid',
  backgroundColor: '#FFFFFF',
  gradient: { type: 'linear', angle: 135, colors: ['#ff00cc', '#333399'] },
  noise: 0,
  filters: [],
  padding: 0,
  borderRadius: 0,
  showShadow: false,
  shadowConfig: { x: 0, y: 10, blur: 30, spread: 0, color: '#000000', opacity: 0.3 },
  format: 'post_square',
  isCarousel: false,
  carouselSlides: 3,
  carouselOrientation: 'square',
  showGrid: false,
  showSafeArea: true,
  showMargins: false,
  showCarouselGuides: true,
  exportFormat: 'png',
  exportQuality: 1.0,
  exportMultiplier: 2,
};

export interface EditorSnapshot {
  layers: Layer[];
  selectedLayerIds: string[];
  globalSettings: GlobalSettings;
}

interface EditorStoreState extends EditorSnapshot {
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  
  isExporting: boolean;
  showResetConfirm: boolean;
  
  activeTool: Tool;
  selectedShapeType: ShapeType;
  showMockup: boolean;
  clipboard: Layer[];
}

interface EditorStoreActions {
  setIsExporting: (isExporting: boolean) => void;
  setShowResetConfirm: (show: boolean) => void;
  setShowMockup: (show: boolean) => void;
  setActiveTool: (tool: Tool) => void;
  setSelectedShapeType: (shapeType: ShapeType) => void;
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  setLayers: (layers: Layer[], overwriteHistory?: boolean) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>, overwriteHistory?: boolean) => void;
  updateLayers: (updates: { id: string; updates: Partial<Layer> }[], overwriteHistory?: boolean) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
  alignSelectedLayers: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  selectLayer: (ids: string[]) => void;
  toggleLayerSelection: (id: string) => void;
  setGlobalSettings: (settings: Partial<GlobalSettings>, overwriteHistory?: boolean) => void;
  setFormatPreset: (format: SocialFormat) => void;
  resetDesign: () => void;
  copySelectedLayers: () => void;
  pasteLayers: (offsetX?: number, offsetY?: number) => void;
}

export type EditorStore = EditorStoreState & EditorStoreActions;

export const useEditorStore = create<EditorStore>()((set) => {
  const getSnapshot = (state: EditorStoreState): EditorSnapshot => ({
    layers: state.layers,
    selectedLayerIds: state.selectedLayerIds,
    globalSettings: state.globalSettings,
  });

  const saveHistory = (state: EditorStoreState) => {
    const currentSnapshot = getSnapshot(state);
    const past = [...state.past, currentSnapshot];
    if (past.length > 50) past.shift(); 
    return { past, future: [] };
  };

  return {
    layers: [],
    selectedLayerIds: [],
    globalSettings: defaultSettings,
    past: [],
    future: [],
    isExporting: false,
    showResetConfirm: false,
    activeTool: 'pointer',
    selectedShapeType: 'rectangle',
    showMockup: true,
    clipboard: [],
    
    setIsExporting: (isExporting) => set({ isExporting }),
    setShowResetConfirm: (showResetConfirm) => set({ showResetConfirm }),
    setShowMockup: (showMockup) => set({ showMockup }),
    setActiveTool: (activeTool) => set({ activeTool }),
    setSelectedShapeType: (selectedShapeType) => set({ selectedShapeType }),
    
    saveSnapshot: () => set((state) => ({ ...saveHistory(state) })),
    
    undo: () => set((state) => {
      if (state.past.length === 0) return state;
      const newPast = [...state.past];
      const previous = newPast.pop()!;
      return {
        ...previous,
        past: newPast,
        future: [getSnapshot(state), ...state.future]
      };
    }),
    
    redo: () => set((state) => {
      if (state.future.length === 0) return state;
      const newFuture = [...state.future];
      const next = newFuture.shift()!;
      return {
        ...next,
        past: [...state.past, getSnapshot(state)],
        future: newFuture
      };
    }),

    setLayers: (layers, overwriteHistory = false) => set((state) => {
      const historyUpdate = overwriteHistory ? {} : saveHistory(state);
      return { ...historyUpdate, layers };
    }),

    addLayer: (layer) => set((state) => {
      return { ...saveHistory(state), layers: [...state.layers, layer], selectedLayerIds: [layer.id] };
    }),

    updateLayer: (id, updates, overwriteHistory = false) => set((state) => {
      const historyUpdate = overwriteHistory ? {} : saveHistory(state);
      return {
        ...historyUpdate,
        layers: state.layers.map((l: Layer) => l.id === id ? { ...l, ...updates } : l)
      };
    }),

    updateLayers: (updates, overwriteHistory = false) => set((state) => {
      const historyUpdate = overwriteHistory ? {} : saveHistory(state);
      const updateMap = new Map(updates.map(u => [u.id, u.updates]));
      return {
        ...historyUpdate,
        layers: state.layers.map((l: Layer) => updateMap.has(l.id) ? { ...l, ...updateMap.get(l.id)! } : l)
      };
    }),

    deleteLayer: (id) => set((state) => {
      return {
        ...saveHistory(state),
        layers: state.layers.filter((l: Layer) => l.id !== id),
        selectedLayerIds: state.selectedLayerIds.filter((selId: string) => selId !== id)
      };
    }),

    duplicateLayer: (id) => set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (!layer) return state;
      const newLayer = { ...layer, id: crypto.randomUUID(), x: layer.x + 20, y: layer.y + 20, name: layer.name + ' (Copy)' };
      const index = state.layers.findIndex((l: Layer) => l.id === id);
      const newLayers = [...state.layers];
      newLayers.splice(index + 1, 0, newLayer);
      return { ...saveHistory(state), layers: newLayers, selectedLayerIds: [newLayer.id] };
    }),

    reorderLayers: (startIndex, endIndex) => set((state) => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(startIndex, 1);
      newLayers.splice(endIndex, 0, removed);
      return { ...saveHistory(state), layers: newLayers };
    }),

    alignSelectedLayers: (alignment) => set((state) => {
      if (state.selectedLayerIds.length === 0) return state;
      
      const newLayers = [...state.layers];
      const selected = newLayers.filter(l => state.selectedLayerIds.includes(l.id));
      
      // If multiple layers, we align them to their bounding box.
      // If single layer, we align it to the canvas.
      const alignToCanvas = selected.length === 1;
      
      let refLeft = alignToCanvas ? 0 : Math.min(...selected.map(l => l.x));
      let refRight = alignToCanvas ? state.globalSettings.width : Math.max(...selected.map(l => l.x + (l.width || 100)));
      let refTop = alignToCanvas ? 0 : Math.min(...selected.map(l => l.y));
      let refBottom = alignToCanvas ? state.globalSettings.height : Math.max(...selected.map(l => l.y + (l.height || 50)));
      
      let refCenterX = (refLeft + refRight) / 2;
      let refCenterY = (refTop + refBottom) / 2;

      selected.forEach(layer => {
        const w = layer.width || 100;
        const h = layer.height || 50;
        if (alignment === 'left') layer.x = refLeft;
        if (alignment === 'center') layer.x = refCenterX - w / 2;
        if (alignment === 'right') layer.x = refRight - w;
        if (alignment === 'top') layer.y = refTop;
        if (alignment === 'middle') layer.y = refCenterY - h / 2;
        if (alignment === 'bottom') layer.y = refBottom - h;
      });

      return { ...saveHistory(state), layers: newLayers };
    }),

    selectLayer: (ids) => set({ selectedLayerIds: ids }),

    toggleLayerSelection: (id) => set((state) => {
      const isSelected = state.selectedLayerIds.includes(id);
      return {
        selectedLayerIds: isSelected 
          ? state.selectedLayerIds.filter((selId: string) => selId !== id)
          : [...state.selectedLayerIds, id]
      };
    }),

    setGlobalSettings: (settings, overwriteHistory = false) => set((state) => {
      const historyUpdate = overwriteHistory ? {} : saveHistory(state);
      return {
        ...historyUpdate,
        globalSettings: { ...state.globalSettings, ...settings }
      };
    }),

    setFormatPreset: (format) => set((state) => {
      let w = 1080;
      let h = 1080;
      switch (format) {
        case 'post_square': w = 1080; h = 1080; break;
        case 'post_vertical': w = 1080; h = 1350; break;
        case 'post_horizontal': w = 1200; h = 628; break;
        case 'story': w = 1080; h = 1920; break;
        case 'reel': w = 1080; h = 1920; break;
        case 'carousel': w = 1080; h = 1080; break;
      }
      return {
        ...saveHistory(state),
        globalSettings: { ...state.globalSettings, format, width: w, height: h, isCarousel: format === 'carousel' }
      };
    }),

    resetDesign: () => set({
      layers: [],
      selectedLayerIds: [],
      globalSettings: defaultSettings,
      past: [],
      future: []
    })
  };
});
