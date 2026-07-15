
import Header from './components/Header/Header';
import PresetsBar from './components/Header/PresetsBar';
import Preview from './components/Preview/Preview';
import Inspector from './components/Inspector/Inspector';
import Toolbar from './components/Toolbar/Toolbar';
import InstagramMockup from './components/Mockup/InstagramMockup';
import DashboardCreatorModal from './components/UI/DashboardCreatorModal';
import LibraryModal from './components/UI/LibraryModal';
import ShortcutsModal from './components/UI/ShortcutsModal';
import styles from './styles/App.module.css';

import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Loader2 } from 'lucide-react';
import { useEditorStore } from './stores/useEditorStore';

export default function App() {
  useKeyboardShortcuts();
  const { isExporting, showLibrary, setShowLibrary, libraryTab, showShortcuts, setShowShortcuts } = useEditorStore();

  return (
    <div className={styles.appContainer}>
      <Header />
      <PresetsBar />
      <div className={styles.workspace}>
        <Toolbar />
        <div className={styles.previewPanel}>
          <Preview />
        </div>
        <InstagramMockup />
        <div className={styles.inspectorPanel}>
          <Inspector />
        </div>
      </div>
      
      {isExporting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'white', backdropFilter: 'blur(4px)'
        }}>
          <Loader2 className="lucide-spin" size={48} style={{ animation: 'spin 2s linear infinite', marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'Inter', fontWeight: 600, margin: 0 }}>Exportando Diseño...</h2>
          <p style={{ fontFamily: 'Inter', color: 'var(--text-secondary)' }}>Preparando imágenes en alta resolución.</p>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      {/* Root-Level Modals (Highest Z-Index context) */}
      <DashboardCreatorModal />
      <LibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)} initialTab={libraryTab} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
