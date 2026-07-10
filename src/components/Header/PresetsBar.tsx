import { Square, Frame, Smartphone, Film, LayoutTemplate, Grid3X3, Focus, Maximize, GalleryHorizontal } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import styles from './PresetsBar.module.css';

export default function PresetsBar() {
  const { globalSettings, setFormatPreset, setGlobalSettings, showMockup, setShowMockup } = useEditorStore();

  const isActive = (f: string) => globalSettings.format === f;

  return (
    <div className={styles.presetsBar} style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className={`${styles.presetBtn} ${isActive('post_square') ? styles.active : ''}`} onClick={() => setFormatPreset('post_square')}>
          <Square size={16} /> 1:1 Post
        </button>
        <button className={`${styles.presetBtn} ${isActive('post_vertical') ? styles.active : ''}`} onClick={() => setFormatPreset('post_vertical')}>
          <Frame size={16} /> 4:5 Vertical
        </button>
        <button className={`${styles.presetBtn} ${isActive('post_horizontal') ? styles.active : ''}`} onClick={() => setFormatPreset('post_horizontal')}>
          <Frame size={16} style={{transform: 'rotate(90deg)'}}/> 1.91:1 Horizontal
        </button>
        <button className={`${styles.presetBtn} ${isActive('story') ? styles.active : ''}`} onClick={() => setFormatPreset('story')}>
          <Smartphone size={16} /> 9:16 Story
        </button>
        <button className={`${styles.presetBtn} ${isActive('reel') ? styles.active : ''}`} onClick={() => setFormatPreset('reel')}>
          <Film size={16} /> Reel
        </button>
        <div className={styles.divider} />
        <button className={`${styles.presetBtn} ${isActive('carousel') ? styles.activeCarousel : ''}`} onClick={() => setFormatPreset('carousel')}>
          <LayoutTemplate size={16} /> Carousel
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '16px' }}>
        <button 
          className={`${styles.presetBtn} ${globalSettings.showSafeArea ? styles.active : ''}`} 
          onClick={() => setGlobalSettings({ showSafeArea: !globalSettings.showSafeArea })}
          title="Safe Area"
        >
          <Focus size={16} />
        </button>
        <button 
          className={`${styles.presetBtn} ${showMockup ? styles.active : ''}`} 
          onClick={() => setShowMockup(!showMockup)}
          title="Mostrar/Ocultar Mockup (Ctrl+M)"
        >
          <Smartphone size={16} />
        </button>
        <button 
          className={`${styles.presetBtn} ${globalSettings.showGrid ? styles.active : ''}`} 
          onClick={() => setGlobalSettings({ showGrid: !globalSettings.showGrid })}
          title="Grid (Regla de 3)"
        >
          <Grid3X3 size={16} />
        </button>
        <button 
          className={`${styles.presetBtn} ${globalSettings.showMargins ? styles.active : ''}`} 
          onClick={() => setGlobalSettings({ showMargins: !globalSettings.showMargins })}
          title="Márgenes"
        >
          <Maximize size={16} />
        </button>
        {globalSettings.isCarousel && (
          <button 
            className={`${styles.presetBtn} ${globalSettings.showCarouselGuides ? styles.active : ''}`} 
            onClick={() => setGlobalSettings({ showCarouselGuides: !globalSettings.showCarouselGuides })}
            title="Separadores de Carrusel"
          >
            <GalleryHorizontal size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
