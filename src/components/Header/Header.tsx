import { Download, Keyboard } from 'lucide-react';

import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { useEditorStore } from '../../stores/useEditorStore';
import CustomSelect from '../UI/CustomSelect';
import styles from './Header.module.css';

export default function Header() {
  const { globalSettings, setIsExporting, setGlobalSettings, setShowShortcuts } = useEditorStore();

  const handleExport = async () => {
    setIsExporting(true);
    
    // Wait for React to re-render and hide overlays/handles
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const node = document.getElementById('card-export-node');
    if (!node) {
      setIsExporting(false);
      return;
    }
    
    try {
      // 1. Render the entire node to a single Canvas
      const sourceCanvas = await htmlToImage.toCanvas(node, { 
        quality: 1, 
        pixelRatio: globalSettings.exportMultiplier || 2,
        skipFonts: true // Bypasses CORS issues with external fonts if they fail, but fonts are rendered safely by browser
      });

      const mimeType = globalSettings.exportFormat === 'jpeg' ? 'image/jpeg' 
                     : globalSettings.exportFormat === 'webp' ? 'image/webp' 
                     : 'image/png';
      
      const quality = globalSettings.exportQuality;
      const fileExt = globalSettings.exportFormat === 'jpeg' ? 'jpg' : globalSettings.exportFormat;

      // Helper to convert canvas to Blob
      const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          }, mimeType, quality);
        });
      };

      if (!globalSettings.isCarousel || globalSettings.carouselSlides === 1) {
        // Single Image Export
        const blob = await canvasToBlob(sourceCanvas);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `post.${fileExt}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Carousel Export -> Slice and ZIP
        const zip = new JSZip();
        const baseWidth = Math.round(globalSettings.width * (globalSettings.exportMultiplier || 2));
        const height = Math.round(globalSettings.height * (globalSettings.exportMultiplier || 2));
        
        for (let i = 0; i < globalSettings.carouselSlides; i++) {
          const slideCanvas = document.createElement('canvas');
          slideCanvas.width = baseWidth;
          slideCanvas.height = height;
          const ctx = slideCanvas.getContext('2d');
          
          if (ctx) {
            // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            const sx = i * baseWidth;
            ctx.drawImage(sourceCanvas, sx, 0, baseWidth, height, 0, 0, baseWidth, height);
            
            const blob = await canvasToBlob(slideCanvas);
            const slideNumber = String(i + 1).padStart(2, '0');
            zip.file(`slide_${slideNumber}.${fileExt}`, blob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.download = `Carrusel.zip`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting image:', err);
      alert('Hubo un error exportando tu diseño. Asegúrate de que las imágenes tengan permisos CORS o intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.title}>GestivaPost</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className={styles.desktopOnly} style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowShortcuts(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'var(--bg-canvas)', padding: '6px 12px',
              borderRadius: '6px', border: '1px solid var(--border-color)',
              cursor: 'pointer', color: 'var(--text-primary)', fontSize: '12px'
            }}
          >
            <Keyboard size={14} /> Atajos
          </button>
          <div style={{ width: '100px' }}>
            <CustomSelect
              options={[
                { value: 'png', label: 'PNG' },
                { value: 'jpeg', label: 'JPEG' },
                { value: 'webp', label: 'WEBP' }
              ]}
              value={globalSettings.exportFormat}
              onChange={(val) => setGlobalSettings({ exportFormat: val as any })}
            />
          </div>
          <div style={{ width: '100px' }}>
            <CustomSelect
              options={[
                { value: '1', label: '1x (FHD)' },
                { value: '2', label: '2x (4K)' },
                { value: '4', label: '4x (8K)' },
                { value: '8', label: '8x (16K)' }
              ]}
              value={String(globalSettings.exportMultiplier || 2)}
              onChange={(val) => setGlobalSettings({ exportMultiplier: parseInt(val) })}
            />
          </div>
        </div>
        <button className={styles.exportBtn} onClick={handleExport}>
          <Download size={16} />
          <span>Export {globalSettings.isCarousel && globalSettings.carouselSlides > 1 ? 'ZIP' : (globalSettings.exportFormat?.toUpperCase() || 'PNG')}</span>
        </button>
      </div>
    </header>
  );
}
