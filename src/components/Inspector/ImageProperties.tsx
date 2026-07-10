
import { useEditorStore } from '../../stores/useEditorStore';
import styles from './Inspector.module.css';

export default function ImageProperties({ layer }: { layer: any }) {
  const { updateLayer } = useEditorStore();

  const handleLayerChange = (field: string, value: any) => {
    updateLayer(layer.id, { [field]: value });
  };

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Image Settings</h3>
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

        <div className={styles.controlGroup} style={{ marginTop: '16px' }}>
          <button 
            className={styles.actionBtn}
            onClick={() => handleLayerChange('backgroundRemoved', !layer.backgroundRemoved)}
            style={{ width: '100%', backgroundColor: layer.backgroundRemoved ? 'var(--primary-color)' : 'var(--bg-hover)', color: layer.backgroundRemoved ? '#fff' : 'var(--text-primary)' }}
          >
            {layer.backgroundRemoved ? 'Fondo Removido' : 'Quitar Fondo (Auto)'}
          </button>
        </div>
      </div>
    </>
  );
}
