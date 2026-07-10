import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Square, Circle, Triangle, Hexagon, Minus, Cloud, Heart, Star, Smile, Zap, Camera, Bell, Search, Mail, Phone, MapPin, Settings, User, Heart as HeartIcon, ThumbsUp, MessageCircle, Share2, Bookmark, Home, Globe } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import type { ShapeType } from '../../types';
import styles from './LibraryModal.module.css';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'shapes' | 'icons';
}

export default function LibraryModal({ isOpen, onClose, initialTab = 'shapes' }: LibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'shapes' | 'icons'>(initialTab);
  const { addLayer, setActiveTool } = useEditorStore();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shapes: { type: ShapeType, icon: React.ReactNode, name: string }[] = [
    { type: 'rectangle', icon: <Square size={32} strokeWidth={1.5} />, name: 'Cuadrado' },
    { type: 'circle', icon: <Circle size={32} strokeWidth={1.5} />, name: 'Círculo' },
    { type: 'triangle', icon: <Triangle size={32} strokeWidth={1.5} />, name: 'Triángulo' },
    { type: 'polygon', icon: <Hexagon size={32} strokeWidth={1.5} />, name: 'Hexágono' },
    { type: 'pentagon', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 22 8.5 18 22 6 22 2 8.5 12 2" /></svg>, name: 'Pentágono' },
    { type: 'cloud', icon: <Cloud size={32} strokeWidth={1.5} />, name: 'Nube' },
    { type: 'heart', icon: <Heart size={32} strokeWidth={1.5} />, name: 'Corazón' },
    { type: 'line', icon: <Minus size={32} strokeWidth={1.5} />, name: 'Línea' },
  ];

  const icons = [
    { name: 'Star', icon: <Star size={32} strokeWidth={1.5} /> },
    { name: 'Smile', icon: <Smile size={32} strokeWidth={1.5} /> },
    { name: 'Zap', icon: <Zap size={32} strokeWidth={1.5} /> },
    { name: 'Camera', icon: <Camera size={32} strokeWidth={1.5} /> },
    { name: 'Bell', icon: <Bell size={32} strokeWidth={1.5} /> },
    { name: 'Search', icon: <Search size={32} strokeWidth={1.5} /> },
    { name: 'Mail', icon: <Mail size={32} strokeWidth={1.5} /> },
    { name: 'Phone', icon: <Phone size={32} strokeWidth={1.5} /> },
    { name: 'MapPin', icon: <MapPin size={32} strokeWidth={1.5} /> },
    { name: 'Settings', icon: <Settings size={32} strokeWidth={1.5} /> },
    { name: 'User', icon: <User size={32} strokeWidth={1.5} /> },
    { name: 'Heart', icon: <HeartIcon size={32} strokeWidth={1.5} /> },
    { name: 'ThumbsUp', icon: <ThumbsUp size={32} strokeWidth={1.5} /> },
    { name: 'MessageCircle', icon: <MessageCircle size={32} strokeWidth={1.5} /> },
    { name: 'Share2', icon: <Share2 size={32} strokeWidth={1.5} /> },
    { name: 'Bookmark', icon: <Bookmark size={32} strokeWidth={1.5} /> },
    { name: 'Home', icon: <Home size={32} strokeWidth={1.5} /> },
    { name: 'Globe', icon: <Globe size={32} strokeWidth={1.5} /> }
  ];

  const handleAddShape = (type: ShapeType) => {
    addLayer({
      id: crypto.randomUUID(),
      type: 'shape',
      name: type.charAt(0).toUpperCase() + type.slice(1),
      shapeType: type,
      x: 150, y: 150, width: 100, height: 100,
      backgroundColor: '#000000',
      rotation: 0, opacity: 1, locked: false, hidden: false
    });
    setActiveTool('pointer');
    onClose();
  };

  const handleAddIcon = (iconName: string) => {
    addLayer({
      id: crypto.randomUUID(),
      type: 'icon',
      name: iconName,
      iconName: iconName,
      x: 150, y: 150, width: 64, height: 64,
      color: '#000000',
      rotation: 0, opacity: 1, locked: false, hidden: false
    });
    setActiveTool('pointer');
    onClose();
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Galería de Recursos</h2>
          <button className={styles.closeButton} onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'shapes' ? styles.active : ''}`}
            onClick={() => setActiveTab('shapes')}
          >
            Formas
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'icons' ? styles.active : ''}`}
            onClick={() => setActiveTab('icons')}
          >
            Iconos
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.grid}>
            {activeTab === 'shapes' && shapes.map(shape => (
              <div key={shape.type} className={styles.itemCard} onClick={() => handleAddShape(shape.type)}>
                <div className={styles.iconWrapper}>{shape.icon}</div>
                <div className={styles.itemName}>{shape.name}</div>
              </div>
            ))}
            
            {activeTab === 'icons' && icons.map(icon => (
              <div key={icon.name} className={styles.itemCard} onClick={() => handleAddIcon(icon.name)}>
                <div className={styles.iconWrapper}>{icon.icon}</div>
                <div className={styles.itemName}>{icon.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
