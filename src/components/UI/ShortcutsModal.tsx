import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './ShortcutsModal.module.css';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
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

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘ Cmd' : 'Ctrl';

  const shortcutGroups = [
    {
      title: 'Herramientas',
      shortcuts: [
        { desc: 'Puntero', keys: [cmdKey, 'Q'] },
        { desc: 'Texto', keys: [cmdKey, 'T'] },
        { desc: 'Formas', keys: [cmdKey, 'O'] },
        { desc: 'Lápiz', keys: [cmdKey, 'L'] },
        { desc: 'Pluma', keys: [cmdKey, 'P'] },
        { desc: 'Imágenes', keys: [cmdKey, 'I'] },
      ]
    },
    {
      title: 'Acciones',
      shortcuts: [
        { desc: 'Deshacer', keys: [cmdKey, 'Z'] },
        { desc: 'Rehacer', keys: [cmdKey, 'Shift', 'Z'] },
        { desc: 'Copiar', keys: [cmdKey, 'C'] },
        { desc: 'Pegar', keys: [cmdKey, 'V'] },
        { desc: 'Duplicar', keys: [cmdKey, 'D'] },
        { desc: 'Seleccionar Todo', keys: [cmdKey, 'A'] },
        { desc: 'Eliminar Capa', keys: ['Del', 'o', 'Backspace'] },
      ]
    },
    {
      title: 'Lienzo',
      shortcuts: [
        { desc: 'Panorámica (Pan)', keys: ['Espacio', '+', 'Arrastrar'] },
        { desc: 'Zoom In/Out', keys: ['Rueda del Ratón'] },
        { desc: 'Vista Previa (Mockup)', keys: [cmdKey, 'M'] },
        { desc: 'Deseleccionar', keys: ['Esc'] },
      ]
    }
  ];

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Atajos de Teclado</h2>
          <button className={styles.closeButton} onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {shortcutGroups.map(group => (
            <div key={group.title} className={styles.shortcutGroup}>
              <h3>{group.title}</h3>
              <div className={styles.shortcutList}>
                {group.shortcuts.map(sc => (
                  <div key={sc.desc} className={styles.shortcutItem}>
                    <span className={styles.shortcutDesc}>{sc.desc}</span>
                    <div className={styles.keys}>
                      {sc.keys.map(k => (
                        <span key={k} className={styles.key}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
