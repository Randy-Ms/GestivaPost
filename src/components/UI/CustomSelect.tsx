import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './CustomSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
}

export default function CustomSelect({ value, options, onChange, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

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

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <button 
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.triggerContent}>
          {selectedOption?.icon && <span className={styles.icon}>{selectedOption.icon}</span>}
          {selectedOption?.label}
        </span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              <span className={styles.optionContent}>
                {option.icon && <span className={styles.icon}>{option.icon}</span>}
                {option.label}
              </span>
              {option.value === value && <Check size={14} className={styles.check} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
