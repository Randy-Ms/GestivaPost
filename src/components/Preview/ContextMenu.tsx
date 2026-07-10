
import { useEditorStore } from '../../stores/useEditorStore';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  canvasRect: DOMRect | null;
  scale: number;
  onAddImage?: () => void;
}

export default function ContextMenu({ x, y, onClose, canvasRect, scale, onAddImage }: ContextMenuProps) {
  const { addLayer, globalSettings, selectedLayerIds, copySelectedLayers, duplicateLayer, deleteLayer } = useEditorStore();

  // Calculate position relative to the canvas origin based on the click
  const getRelativePosition = () => {
    if (!canvasRect) return { rx: globalSettings.width / 2, ry: globalSettings.height / 2 };
    
    // x and y are clientX and clientY. 
    // canvasRect is the bounds of the scaled card container
    const relativeX = (x - canvasRect.left) / scale;
    const relativeY = (y - canvasRect.top) / scale;
    return { rx: relativeX, ry: relativeY };
  };

  const handleAddText = (isHeader = false) => {
    const { rx, ry } = getRelativePosition();
    addLayer({
      id: crypto.randomUUID(),
      type: 'text',
      name: isHeader ? 'Encabezado' : 'Texto',
      text: isHeader ? 'Gran Título' : 'Nuevo Texto',
      x: rx,
      y: ry,
      width: isHeader ? 400 : 200,
      height: isHeader ? 80 : 50,
      rotation: 0,
      opacity: 1,
      hidden: false,
      locked: false,
      fontSize: isHeader ? 64 : 32,
      fontFamily: 'Inter',
      fontWeight: isHeader ? '800' : '500',
      color: '#000000',
      textAlign: 'center'
    });
    onClose();
  };

  const handleAddButton = () => {
    const { rx, ry } = getRelativePosition();
    addLayer({
      id: crypto.randomUUID(),
      type: 'button',
      name: 'Botón',
      text: 'Click Aquí',
      x: rx,
      y: ry,
      width: 200,
      height: 60,
      rotation: 0,
      opacity: 1,
      hidden: false,
      locked: false,
      backgroundColor: '#000000',
      color: '#ffffff',
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '600',
      borderRadius: 8,
      padding: '12px 24px',
      textAlign: 'center'
    });
    onClose();
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'polygon') => {
    const { rx, ry } = getRelativePosition();
    addLayer({
      id: crypto.randomUUID(),
      type: 'shape',
      name: shapeType === 'rectangle' ? 'Rectángulo' : shapeType === 'circle' ? 'Círculo' : 'Polígono',
      shapeType,
      x: rx,
      y: ry,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      hidden: false,
      locked: false,
      backgroundColor: '#000000',
      borderRadius: shapeType === 'circle' ? 9999 : 0
    });
    onClose();
  };

  return (
    <div 
      className={styles.menuContainer} 
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {selectedLayerIds.length > 0 ? (
        <>
          <div className={styles.sectionTitle}>Acciones de Capa</div>
          <button className={styles.menuItem} onClick={() => { copySelectedLayers(); onClose(); }}>
            Copiar
          </button>
          <button className={styles.menuItem} onClick={() => { selectedLayerIds.forEach(id => duplicateLayer(id)); onClose(); }}>
            Duplicar
          </button>
          <div className={styles.divider} />
          <button className={styles.menuItem} style={{ color: 'var(--danger-color)' }} onClick={() => { selectedLayerIds.forEach(id => deleteLayer(id)); onClose(); }}>
            Eliminar
          </button>
        </>
      ) : (
        <>
          <div className={styles.sectionTitle}>Añadir Contenido</div>
          <button className={styles.menuItem} onClick={() => handleAddText(true)}>
            Encabezado
          </button>
          <button className={styles.menuItem} onClick={() => handleAddText(false)}>
            Texto Normal
          </button>
          <button className={styles.menuItem} onClick={handleAddButton}>
            Botón
          </button>
          <button className={styles.menuItem} onClick={() => {
            if (onAddImage) {
              onAddImage();
              onClose();
            }
          }}>
            Imagen
          </button>
          
          <div className={styles.divider} />
          
          <div className={styles.sectionTitle}>Formas Geométricas</div>
          <button className={styles.menuItem} onClick={() => handleAddShape('rectangle')}>
            Rectángulo
          </button>
          <button className={styles.menuItem} onClick={() => handleAddShape('circle')}>
            Círculo
          </button>
          <button className={styles.menuItem} onClick={() => handleAddShape('polygon')}>
            Polígono
          </button>
        </>
      )}
    </div>
  );
}
