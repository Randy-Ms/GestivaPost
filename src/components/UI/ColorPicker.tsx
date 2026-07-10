import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Pipette } from 'lucide-react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [textValue, setTextValue] = useState(color);

  useEffect(() => {
    setTextValue(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    const hexRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (hexRegex.test(e.target.value)) {
      const formatted = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
      onChange(formatted);
    }
  };

  const openEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        onChange(result.sRGBHex);
      } catch (e) {
        console.log("EyeDropper canceled");
      }
    } else {
      alert("Tu navegador no soporta la herramienta de Gotero (EyeDropper API). Prueba en Chrome o Edge.");
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        <button 
          className={styles.swatchBtn}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          title="Abrir paleta"
        >
          <div className={styles.colorSwatch} style={{ backgroundColor: color }} />
        </button>
        
        <input 
          type="text" 
          className={styles.hexInput} 
          value={textValue} 
          onChange={handleTextChange}
          onBlur={() => setTextValue(color)}
          spellCheck={false}
        />
      </div>

      <button className={styles.dropperBtn} onClick={openEyeDropper} type="button">
        <Pipette size={14} />
        Gotero
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
