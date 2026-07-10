import { useEffect } from 'react';

export function useAutoSave<T>(key: string, state: T) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to auto-save to localStorage', e);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [state, key]);
}

export function loadSavedState<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to load from localStorage', e);
    return null;
  }
}
