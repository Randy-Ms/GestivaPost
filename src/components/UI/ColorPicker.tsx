import { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Pipette } from 'lucide-react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

// Utility to convert HEX to RGB
const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Utility to convert RGB to HEX
const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
};

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const [hexInput, setHexInput] = useState(color);
  const [rgb, setRgb] = useState(hexToRgb(color));

  // Sync internal states when external color prop changes (e.g. dragging gradient)
  useEffect(() => {
    setHexInput(color.toUpperCase());
    setRgb(hexToRgb(color));
  }, [color]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    if (num > 255) num = 255;
    if (num < 0) num = 0;
    
    const newRgb = { ...rgb, [channel]: num };
    setRgb(newRgb);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div 
        className={styles.swatch} 
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.swatchInner} />
      </div>

      {isOpen && (
        <div className={styles.popover} ref={popoverRef}>
          <HexColorPicker color={color} onChange={onChange} className={styles.picker} />
          
          <div className={styles.controls}>
            {/* Hex Input */}
            <div className={styles.inputGroup}>
              <div className={styles.iconContainer}>
                <Pipette size={14} />
              </div>
              <input 
                type="text" 
                value={hexInput} 
                onChange={handleHexChange}
                className={styles.hexInput}
                maxLength={7}
              />
            </div>
            
            {/* RGB Inputs */}
            <div className={styles.rgbRow}>
              <div className={styles.rgbCol}>
                <input 
                  type="number" 
                  value={rgb.r} 
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  className={styles.rgbInput}
                />
                <span>R</span>
              </div>
              <div className={styles.rgbCol}>
                <input 
                  type="number" 
                  value={rgb.g} 
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  className={styles.rgbInput}
                />
                <span>G</span>
              </div>
              <div className={styles.rgbCol}>
                <input 
                  type="number" 
                  value={rgb.b} 
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  className={styles.rgbInput}
                />
                <span>B</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
