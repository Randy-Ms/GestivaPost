import React, { useState, useRef } from 'react';
import { 
  MousePointer2, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Hexagon, 
  Minus,
  PenTool, 
  Pen,
  Smile,
  Image as ImageIcon,
  Keyboard,
  Smartphone
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import type { ShapeType } from '../../types';
import ShortcutsModal from '../UI/ShortcutsModal';
import LibraryModal from '../UI/LibraryModal';
import styles from './Toolbar.module.css';

export default function Toolbar() {
  const { activeTool, setActiveTool, selectedShapeType, addLayer, showMockup, setShowMockup } = useEditorStore();
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'shapes'|'icons'>('shapes');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShapeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLibraryTab('shapes');
    setShowLibrary(true);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLibraryTab('icons');
    setShowLibrary(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setActiveTool('pointer'); // Revert to pointer after upload
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerImageUpload = () => {
    setActiveTool('image');
    fileInputRef.current?.click();
  };

  const getShapeIcon = (type: ShapeType) => {
    switch (type) {
      case 'rectangle': return <Square size={20} />;
      case 'circle': return <Circle size={20} />;
      case 'triangle': return <Triangle size={20} />;
      case 'polygon': return <Hexagon size={20} />;
      case 'line': return <Minus size={20} />;
    }
  };

  return (
    <div className={styles.toolbar}>
      <button 
        className={`${styles.toolButton} ${activeTool === 'pointer' ? styles.active : ''}`}
        onClick={() => { setActiveTool('pointer'); }}
        title="Pointer (V)"
      >
        <MousePointer2 size={20} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'text' ? styles.active : ''}`}
        onClick={() => { setActiveTool('text'); }}
        title="Text (T)"
      >
        <Type size={20} />
      </button>

      <div>
        <button 
          className={`${styles.toolButton} ${activeTool === 'shape' ? styles.active : ''}`}
          onClick={handleShapeClick}
          title="Formas e Iconos (O)"
        >
          {getShapeIcon(selectedShapeType)}
        </button>
      </div>

      <button 
        className={`${styles.toolButton}`}
        onClick={handleIconClick}
        title="Iconos"
      >
        <Smile size={20} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'pen_freehand' ? styles.active : ''}`}
        onClick={() => { setActiveTool('pen_freehand'); }}
        title="Lápiz (Mano Alzada)"
      >
        <PenTool size={20} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'pen_bezier' ? styles.active : ''}`}
        onClick={() => { setActiveTool('pen_bezier'); }}
        title="Pluma (Bézier)"
      >
        <Pen size={20} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'image' ? styles.active : ''}`}
        onClick={triggerImageUpload}
        title="Images (I)"
      >
        <ImageIcon size={20} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'image' ? styles.active : ''}`}
        onClick={() => setShowShortcuts(true)}
        title="Atajos de teclado (?)"
      >
        <Keyboard size={20} />
      </button>

      <div className={styles.divider} />

      <button 
        className={`${styles.toolButton} ${showMockup ? styles.active : ''}`}
        onClick={() => setShowMockup(!showMockup)}
        title="Mostrar Mockup"
      >
        <Smartphone size={20} />
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      <div style={{ marginTop: 'auto' }}>
        <button 
          className={styles.toolButton} 
          onClick={() => setShowShortcuts(true)}
          title="Atajos de Teclado"
        >
          <Keyboard size={20} />
        </button>
      </div>

      <LibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)} initialTab={libraryTab} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
