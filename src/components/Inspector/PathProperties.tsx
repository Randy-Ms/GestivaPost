import { useEditorStore } from '../../stores/useEditorStore';
import ColorPicker from '../UI/ColorPicker';
import styles from './Inspector.module.css';

export default function PathProperties({ layer }: { layer: any }) {
  const { updateLayer } = useEditorStore();

  const handleLayerChange = (field: string, value: any) => {
    updateLayer(layer.id, { [field]: value });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Propiedades de Línea</h3>
      </div>
      
      <div className={styles.controlGroup}>
        <label className={styles.label}>Color de Línea</label>
        <ColorPicker
          color={layer.layerColor || '#000000'}
          onChange={(color) => handleLayerChange('layerColor', color)}
        />
      </div>

      <div className={styles.controlGroup}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className={styles.label}>Grosor (px)</label>
          <span className={styles.valueText}>{layer.strokeWidth || 2}</span>
        </div>
        <input 
          type="range" 
          min="1" max="50" step="1" 
          value={layer.strokeWidth || 2} 
          onChange={(e) => handleLayerChange('strokeWidth', parseInt(e.target.value))}
          className={styles.range}
        />
      </div>

      <div className={styles.controlGroup}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className={styles.label}>Opacidad</label>
          <span className={styles.valueText}>{Math.round((layer.opacity ?? 1) * 100)}%</span>
        </div>
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={layer.opacity ?? 1} 
          onChange={(e) => handleLayerChange('opacity', parseFloat(e.target.value))}
          className={styles.range}
        />
      </div>
    </div>
  );
}
