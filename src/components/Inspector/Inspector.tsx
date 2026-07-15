import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import CustomSelect from '../UI/CustomSelect';
import ColorPicker from '../UI/ColorPicker';
import AlignmentControls from './AlignmentControls';
import TextProperties from './TextProperties';
import ShapeProperties from './ShapeProperties';
import ImageProperties from './ImageProperties';
import IconProperties from './IconProperties';
import PathProperties from './PathProperties';
import styles from './Inspector.module.css';

const SortableLayerItem = ({ layer, index, isSelected, onClick, onRename, onColorChange }: { layer: any, index: number, isSelected: boolean, onClick: (e: any) => void, onRename: (id: string, name: string) => void, onColorChange: (id: string, color: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: layer.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${styles.layerItem} ${isSelected ? styles.layerItemSelected : ''}`}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginRight: '4px' }}>
        <GripVertical size={14} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, overflow: 'hidden' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '12px' }}>{index + 1}</span>
        <input 
          type="color" 
          value={layer.layerColor || '#444444'} 
          onChange={(e) => onColorChange(layer.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '16px', height: '16px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}
        />
        <input 
          type="text" 
          value={layer.name} 
          onChange={(e) => onRename(layer.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '13px', flexGrow: 1, outline: 'none' }}
        />
      </div>
    </div>
  );
};

export default function Inspector() {
  const { layers, selectedLayerIds, globalSettings, setGlobalSettings, updateLayer, deleteLayer, duplicateLayer, selectLayer, toggleLayerSelection, reorderLayers } = useEditorStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      reorderLayers(oldIndex, newIndex);
    }
  };

  const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
  const selectedLayer = selectedLayers.length === 1 ? selectedLayers[0] : null;

  const handleGlobalChange = (field: string, value: any) => {
    setGlobalSettings({ [field]: value });
  };

  const handleCarouselChange = (field: string, value: any) => {
    // If we change orientation, update height
    if (field === 'carouselOrientation') {
      let height = 1080;
      if (value === 'square') height = 1080;
      if (value === 'vertical') height = 1350;
      if (value === 'story') height = 1920;
      setGlobalSettings({ [field]: value, height });
    } else {
      handleGlobalChange(field, value);
    }
  };

  const handleLayerChange = (field: string, value: any) => {
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { [field]: value });
    }
  };

  const renderLayersList = () => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Layers</h3>
      </div>
      <div className={styles.layersList}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={layers.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {layers.map((layer, index) => (
              <SortableLayerItem 
                key={layer.id}
                layer={layer}
                index={index}
                isSelected={selectedLayerIds.includes(layer.id)}
                onClick={(e) => {
                  if (e.shiftKey || e.ctrlKey || e.metaKey) toggleLayerSelection(layer.id);
                  else selectLayer([layer.id]);
                }}
                onRename={(id, name) => updateLayer(id, { name })}
                onColorChange={(id, color) => updateLayer(id, { layerColor: color })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );

  const renderGlobalSettings = () => (
    <div className={styles.section}>
      <div className={styles.propertyRow} style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={globalSettings.autoScaleContent !== false}
            onChange={(e) => handleGlobalChange('autoScaleContent', e.target.checked)}
          />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Auto-Escalar Contenido al cambiar Tamaño</span>
        </label>
      </div>
      
      {globalSettings.isCarousel && (
        <>
          <div className={styles.propertyRow}>
            <label>Slides (1-20)</label>
            <input 
              type="number" 
              min="1" max="20"
              value={globalSettings.carouselSlides} 
              onChange={(e) => handleGlobalChange('carouselSlides', Math.max(1, Math.min(20, Number(e.target.value))))} 
            />
          </div>
          <div className={styles.propertyRow}>
            <CustomSelect 
              label="Format"
              value={globalSettings.carouselOrientation}
              options={[
                { value: 'square', label: '1:1 Square' },
                { value: 'vertical', label: '4:5 Vertical' },
                { value: 'story', label: '9:16 Story' }
              ]}
              onChange={(val) => handleCarouselChange('carouselOrientation', val)}
            />
          </div>
          <hr className={styles.divider} />
        </>
      )}

      {/* Background section starts here */}
      <div className={styles.propertyRow}>
        <CustomSelect 
          label="Type"
          value={globalSettings.backgroundType || 'solid'}
          options={[
            { value: 'solid', label: 'Color Sólido' },
            { value: 'gradient', label: 'Degradado' }
          ]}
          onChange={(val) => handleGlobalChange('backgroundType', val)}
        />
      </div>
      
      {globalSettings.backgroundType === 'solid' ? (
        <div className={styles.propertyRow} style={{ marginTop: '8px' }}>
          <ColorPicker 
            label="Color"
            color={globalSettings.backgroundColor}
            onChange={(val) => handleGlobalChange('backgroundColor', val)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <div className={styles.propertyRow}>
            <label>Gradient Angle ({globalSettings.gradient?.angle || 135}deg)</label>
            <input 
              type="range" 
              min="0" max="360"
              value={globalSettings.gradient?.angle || 135} 
              onChange={(e) => handleGlobalChange('gradient', { ...globalSettings.gradient, angle: Number(e.target.value) })} 
            />
          </div>
          <div className={styles.propertyRow}>
            <ColorPicker 
              label="Color 1"
              color={globalSettings.gradient?.colors?.[0] || '#ff0000'}
              onChange={(val) => {
                const currentColors = globalSettings.gradient?.colors || ['#ff0000', '#0000ff'];
                handleGlobalChange('gradient', { ...globalSettings.gradient, type: 'linear', colors: [val, currentColors[1]] });
              }}
            />
          </div>
          <div className={styles.propertyRow}>
            <ColorPicker 
              label="Color 2"
              color={globalSettings.gradient?.colors?.[1] || '#0000ff'}
              onChange={(val) => {
                const currentColors = globalSettings.gradient?.colors || ['#ff0000', '#0000ff'];
                handleGlobalChange('gradient', { ...globalSettings.gradient, type: 'linear', colors: [currentColors[0], val] });
              }}
            />
          </div>
        </div>
      )}

      <div className={styles.section}>
        <hr className={styles.divider} style={{ margin: '16px 0' }} />
        <div style={{ marginBottom: '12px' }}>
          <h3 className={styles.sectionTitle}>Filters</h3>
          <button 
            className={styles.actionBtn} 
            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            onClick={() => {
              const newFilter = { id: crypto.randomUUID(), type: 'noise' as const, opacity: 50, scale: 0.65, dotSize: 4 };
              handleGlobalChange('filters', [...(globalSettings.filters || []), newFilter]);
            }}
          >
            + Add Filter
          </button>
        </div>
        
        {(globalSettings.filters || []).map((filter, index) => (
          <div key={filter.id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--bg-canvas)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flexGrow: 1 }}>
                <CustomSelect 
                  label=""
                  value={filter.type}
                  options={[
                    { value: 'noise', label: 'Noise (Grain)' },
                    { value: 'halftone', label: 'Halftone (Dots)' }
                  ]}
                  onChange={(val) => {
                    const newFilters = [...globalSettings.filters];
                    newFilters[index].type = val as 'noise' | 'halftone';
                    handleGlobalChange('filters', newFilters);
                  }}
                />
              </div>
              <button 
                onClick={() => {
                  const newFilters = globalSettings.filters.filter(f => f.id !== filter.id);
                  handleGlobalChange('filters', newFilters);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-danger)', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}
                title="Remove Filter"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.propertyRow}>
              <label>Opacity ({filter.opacity}%)</label>
              <input type="range" min="0" max="100" value={filter.opacity} onChange={(e) => {
                const newFilters = [...globalSettings.filters];
                newFilters[index].opacity = Number(e.target.value);
                handleGlobalChange('filters', newFilters);
              }} />
            </div>
            
            {filter.type === 'noise' ? (
              <div className={styles.propertyRow} style={{ marginTop: '8px' }}>
                <label>Grain Size ({filter.scale})</label>
                <input type="range" min="0.1" max="2" step="0.1" value={filter.scale || 0.65} onChange={(e) => {
                  const newFilters = [...globalSettings.filters];
                  newFilters[index].scale = Number(e.target.value);
                  handleGlobalChange('filters', newFilters);
                }} />
              </div>
            ) : (
              <div className={styles.propertyRow} style={{ marginTop: '8px' }}>
                <label>Dot Size ({filter.dotSize || 4}px)</label>
                <input type="range" min="1" max="20" step="1" value={filter.dotSize || 4} onChange={(e) => {
                  const newFilters = [...globalSettings.filters];
                  newFilters[index].dotSize = Number(e.target.value);
                  handleGlobalChange('filters', newFilters);
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderLayerSpecifics = () => {
    if (!selectedLayer) return null;
    
    return (
      <div className={styles.section}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div className={styles.controlGroup} style={{ flex: 1 }}>
            <label className={styles.label}>X</label>
            <input type="number" className={styles.input} value={Math.round(selectedLayer.x)} onChange={(e) => handleLayerChange('x', Number(e.target.value))} />
          </div>
          <div className={styles.controlGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Y</label>
            <input type="number" className={styles.input} value={Math.round(selectedLayer.y)} onChange={(e) => handleLayerChange('y', Number(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div className={styles.controlGroup} style={{ flex: 1 }}>
            <label className={styles.label}>W</label>
            <input type="number" className={styles.input} value={Math.round(selectedLayer.width || 0)} onChange={(e) => handleLayerChange('width', Number(e.target.value))} />
          </div>
          <div className={styles.controlGroup} style={{ flex: 1 }}>
            <label className={styles.label}>H</label>
            <input type="number" className={styles.input} value={Math.round(selectedLayer.height || 0)} onChange={(e) => handleLayerChange('height', Number(e.target.value))} />
          </div>
        </div>
        
        <div className={styles.controlGroup}>
          <label className={styles.label}>Rotation</label>
          <input type="number" className={styles.input} value={Math.round(selectedLayer.rotation || 0)} onChange={(e) => handleLayerChange('rotation', Number(e.target.value))} />
        </div>

        {selectedLayer.type === 'text' && <TextProperties layer={selectedLayer} />}
        {selectedLayer.type === 'shape' && <ShapeProperties layer={selectedLayer} />}
        {selectedLayer.type === 'image' && <ImageProperties layer={selectedLayer} />}
        {selectedLayer.type === 'icon' && <IconProperties layer={selectedLayer} />}
        {selectedLayer.type === 'path' && <PathProperties layer={selectedLayer} />}

        <div className={styles.actions} style={{ marginTop: '16px' }}>
          <button className={styles.actionBtn} onClick={() => duplicateLayer(selectedLayer.id)}>Duplicate</button>
          <button className={styles.actionBtnDanger} onClick={() => deleteLayer(selectedLayer.id)}>Delete</button>
        </div>
      </div>
    );
  };



  return (
    <div className={styles.inspectorContainer} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selectedLayerIds.length > 0 ? (
          <>
            <AlignmentControls />
            {renderLayerSpecifics()}
          </>
        ) : (
          <>
            {renderGlobalSettings()}
            <hr className={styles.divider} />
            {renderLayersList()}
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '16px', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)' }}>
        GestivaPost © 2026 | Gestiva ©
      </div>
    </div>
  );
}
