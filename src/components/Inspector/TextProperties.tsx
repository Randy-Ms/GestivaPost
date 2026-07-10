
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import CustomSelect from '../UI/CustomSelect';
import ColorPicker from '../UI/ColorPicker';
import styles from './Inspector.module.css';

export default function TextProperties({ layer }: { layer: any }) {
  const { updateLayer } = useEditorStore();

  const handleLayerChange = (field: string, value: any) => {
    updateLayer(layer.id, { [field]: value });
  };

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Typography</h3>
        </div>
        
        <div className={styles.controlGroup}>
          <label className={styles.label}>Font Family</label>
          <CustomSelect
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Roboto', label: 'Roboto' },
              { value: 'Playfair Display', label: 'Playfair' },
              { value: 'Montserrat', label: 'Montserrat' }
            ]}
            value={layer.fontFamily || 'Inter'}
            onChange={(val) => handleLayerChange('fontFamily', val)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div className={styles.controlGroup}>
            <label className={styles.label}>Weight</label>
            <CustomSelect
              options={[
                { value: '400', label: 'Regular' },
                { value: '500', label: 'Medium' },
                { value: '600', label: 'SemiBold' },
                { value: '700', label: 'Bold' },
                { value: '900', label: 'Black' }
              ]}
              value={layer.fontWeight || '400'}
              onChange={(val) => handleLayerChange('fontWeight', val)}
            />
          </div>
          
          <div className={styles.controlGroup}>
            <label className={styles.label}>Size (px)</label>
            <input 
              type="number" 
              className={styles.input} 
              value={layer.fontSize || 32} 
              onChange={(e) => handleLayerChange('fontSize', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Alignment</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className={`${styles.iconButton} ${layer.textAlign === 'left' ? styles.active : ''}`}
              onClick={() => handleLayerChange('textAlign', 'left')}
            >
              <AlignLeft size={16} />
            </button>
            <button 
              className={`${styles.iconButton} ${layer.textAlign === 'center' ? styles.active : ''}`}
              onClick={() => handleLayerChange('textAlign', 'center')}
            >
              <AlignCenter size={16} />
            </button>
            <button 
              className={`${styles.iconButton} ${layer.textAlign === 'right' ? styles.active : ''}`}
              onClick={() => handleLayerChange('textAlign', 'right')}
            >
              <AlignRight size={16} />
            </button>
            <button 
              className={`${styles.iconButton} ${layer.textAlign === 'justify' ? styles.active : ''}`}
              onClick={() => handleLayerChange('textAlign', 'justify')}
            >
              <AlignJustify size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Appearance</h3>
        </div>
        <div className={styles.controlGroup}>
          <CustomSelect 
            label="Fill Type"
            value={layer.backgroundType || 'solid'}
            options={[
              { value: 'solid', label: 'Solid Color' },
              { value: 'gradient', label: 'Gradient' }
            ]}
            onChange={(val) => handleLayerChange('backgroundType', val)}
          />
        </div>

        {(layer.backgroundType || 'solid') === 'solid' ? (
          <div className={styles.controlGroup} style={{ marginTop: '8px' }}>
            <label className={styles.label}>Fill Color</label>
            <ColorPicker
              color={layer.color || '#000000'}
              onChange={(color) => handleLayerChange('color', color)}
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
