import { useEditorStore } from '../../stores/useEditorStore';
import CustomSelect from '../UI/CustomSelect';
import ColorPicker from '../UI/ColorPicker';
import styles from './Inspector.module.css';

export default function ShapeProperties({ layer }: { layer: any }) {
  const { updateLayer } = useEditorStore();

  const handleLayerChange = (field: string, value: any) => {
    updateLayer(layer.id, { [field]: value });
  };

  const bgType = layer.backgroundType || 'solid';

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Appearance</h3>
        </div>
        
        <div className={styles.controlGroup}>
          <CustomSelect 
            label="Fill Type"
            value={bgType}
            options={[
              { value: 'solid', label: 'Solid Color' },
              { value: 'gradient', label: 'Gradient' }
            ]}
            onChange={(val) => handleLayerChange('backgroundType', val)}
          />
        </div>

        {bgType === 'solid' ? (
          <div className={styles.controlGroup} style={{ marginTop: '8px' }}>
            <label className={styles.label}>Fill Color</label>
            <ColorPicker
              color={layer.backgroundColor || '#000000'}
              onChange={(color) => handleLayerChange('backgroundColor', color)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div className={styles.controlGroup}>
              <label className={styles.label}>Gradient Angle ({layer.gradient?.angle || 135}deg)</label>
              <input 
                type="range" 
                min="0" max="360"
                value={layer.gradient?.angle || 135} 
                onChange={(e) => handleLayerChange('gradient', { ...layer.gradient, angle: Number(e.target.value) })} 
              />
            </div>
            <div className={styles.controlGroup}>
              <ColorPicker 
                label="Color 1"
                color={layer.gradient?.colors?.[0] || '#ff0000'}
                onChange={(val) => {
                  const currentColors = layer.gradient?.colors || ['#ff0000', '#0000ff'];
                  handleLayerChange('gradient', { ...layer.gradient, type: 'linear', colors: [val, currentColors[1]] });
                }}
              />
            </div>
            <div className={styles.controlGroup}>
              <ColorPicker 
                label="Color 2"
                color={layer.gradient?.colors?.[1] || '#0000ff'}
                onChange={(val) => {
                  const currentColors = layer.gradient?.colors || ['#ff0000', '#0000ff'];
                  handleLayerChange('gradient', { ...layer.gradient, type: 'linear', colors: [currentColors[0], val] });
                }}
              />
            </div>
          </div>
        )}

        {layer.shapeType !== 'circle' && layer.shapeType !== 'triangle' && layer.shapeType !== 'polygon' && layer.shapeType !== 'line' && (
          <div className={styles.controlGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className={styles.label}>Corner Radius</label>
              <span className={styles.valueText}>{layer.borderRadius || 0}px</span>
            </div>
            <input 
              type="range" 
              min="0" max="200" 
              value={layer.borderRadius || 0} 
              onChange={(e) => handleLayerChange('borderRadius', parseInt(e.target.value))}
              className={styles.range}
            />
          </div>
        )}

        <div className={styles.controlGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className={styles.label}>Opacity</label>
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
    </>
  );
}
