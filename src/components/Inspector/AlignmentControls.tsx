import { AlignLeft, AlignCenter, AlignRight, AlignVerticalSpaceAround, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import styles from './Inspector.module.css';

export default function AlignmentControls() {
  const { alignSelectedLayers } = useEditorStore();

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Alignment</h3>
      </div>
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', padding: '0 4px' }}>
        <button className={styles.iconButton} onClick={() => alignSelectedLayers('left')} title="Align Left">
          <AlignLeft size={16} />
        </button>
        <button className={styles.iconButton} onClick={() => alignSelectedLayers('center')} title="Align Center Horizontal">
          <AlignCenter size={16} />
        </button>
        <button className={styles.iconButton} onClick={() => alignSelectedLayers('right')} title="Align Right">
          <AlignRight size={16} />
        </button>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', alignSelf: 'center', margin: '0 4px' }} />
        <button className={styles.iconButton} onClick={() => alignSelectedLayers('top')} title="Align Top">
          <ArrowUpToLine size={16} />
        </button>
        <button className={styles.iconButton} onClick={() => alignSelectedLayers('middle')} title="Align Middle Vertical">
          <AlignVerticalSpaceAround size={16} />
        </button>
        <button className={styles.iconButton} onClick={() => alignSelectedLayers('bottom')} title="Align Bottom">
          <ArrowDownToLine size={16} />
        </button>
      </div>
    </div>
  );
}
