import { useState, useEffect } from 'react';
import { X, Check, BarChart2, PieChart, Activity, Hash, Layers } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import styles from './DashboardCreatorModal.module.css';

const MOCK_DATA_TEMPLATES = {
  line: [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 550 },
    { name: 'Apr', value: 450 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 650 },
  ],
  bar: [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 200 },
    { name: 'Wed', value: 150 },
    { name: 'Thu', value: 80 },
    { name: 'Fri', value: 250 },
  ],
  pie: [
    { name: 'Desktop', value: 400 },
    { name: 'Mobile', value: 300 },
    { name: 'Tablet', value: 100 },
  ],
  area: [
    { name: 'Q1', value: 4000, secondary: 2400 },
    { name: 'Q2', value: 3000, secondary: 1398 },
    { name: 'Q3', value: 2000, secondary: 9800 },
    { name: 'Q4', value: 2780, secondary: 3908 },
  ],
  kpi: [] // KPI doesn't use array data mostly, just single values
};

export default function DashboardCreatorModal() {
  const { showDashboardCreator, setShowDashboardCreator, addLayer } = useEditorStore();
  
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'kpi' | 'area'>('area');
  const [title, setTitle] = useState('Revenue Growth');
  const [subtitle, setSubtitle] = useState('Monthly performance');
  
  // Data
  const [dataJson, setDataJson] = useState(JSON.stringify(MOCK_DATA_TEMPLATES.area, null, 2));
  const [dataError, setDataError] = useState('');
  
  // Colors
  const [primaryColor, setPrimaryColor] = useState('#6366f1'); // Indigo
  const [gradientStart, setGradientStart] = useState('#8b5cf6'); // Violet
  const [gradientEnd, setGradientEnd] = useState('#3b82f6'); // Blue
  
  // KPI Specific
  const [kpiValue, setKpiValue] = useState('$ 142,560.00');
  const [kpiChange, setKpiChange] = useState('↑ 8.2% from last month');
  const [kpiChangeType, setKpiChangeType] = useState<'positive' | 'negative' | 'neutral'>('positive');

  useEffect(() => {
    if (chartType !== 'kpi') {
      setDataJson(JSON.stringify(MOCK_DATA_TEMPLATES[chartType as keyof typeof MOCK_DATA_TEMPLATES], null, 2));
    }
  }, [chartType]);

  if (!showDashboardCreator) return null;

  const handleCreate = () => {
    let parsedData = [];
    if (chartType !== 'kpi') {
      try {
        parsedData = JSON.parse(dataJson);
      } catch (err) {
        setDataError('JSON inválido');
        return;
      }
    }

    const newLayer = {
      id: crypto.randomUUID(),
      type: 'chart' as const,
      name: `Gráfica ${chartType}`,
      x: 100,
      y: 100,
      width: chartType === 'kpi' ? 300 : 500,
      height: chartType === 'kpi' ? 200 : 350,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      chartType,
      chartData: parsedData,
      chartConfig: {
        title,
        subtitle,
        value: kpiValue,
        change: kpiChange,
        changeType: kpiChangeType,
        color: primaryColor,
        gradient: [gradientStart, gradientEnd],
        showAxes: true,
        showGrid: true,
      }
    };

    addLayer(newLayer);
    setShowDashboardCreator(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Crear Dashboard Widget</h2>
          <button onClick={() => setShowDashboardCreator(false)} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.leftCol}>
            <label className={styles.label}>Tipo de Widget</label>
            <div className={styles.typeGrid}>
              <button 
                className={`${styles.typeBtn} ${chartType === 'area' ? styles.active : ''}`}
                onClick={() => setChartType('area')}
              >
                <Layers size={24} /> Área
              </button>
              <button 
                className={`${styles.typeBtn} ${chartType === 'line' ? styles.active : ''}`}
                onClick={() => setChartType('line')}
              >
                <Activity size={24} /> Línea
              </button>
              <button 
                className={`${styles.typeBtn} ${chartType === 'bar' ? styles.active : ''}`}
                onClick={() => setChartType('bar')}
              >
                <BarChart2 size={24} /> Barras
              </button>
              <button 
                className={`${styles.typeBtn} ${chartType === 'pie' ? styles.active : ''}`}
                onClick={() => setChartType('pie')}
              >
                <PieChart size={24} /> Circular
              </button>
              <button 
                className={`${styles.typeBtn} ${chartType === 'kpi' ? styles.active : ''}`}
                onClick={() => setChartType('kpi')}
              >
                <Hash size={24} /> KPI
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Título</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Subtítulo</label>
              <input 
                type="text" 
                value={subtitle} 
                onChange={(e) => setSubtitle(e.target.value)} 
                className={styles.input}
              />
            </div>

            {chartType === 'kpi' ? (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor Principal</label>
                  <input 
                    type="text" 
                    value={kpiValue} 
                    onChange={(e) => setKpiValue(e.target.value)} 
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Texto de Cambio (Variación)</label>
                  <input 
                    type="text" 
                    value={kpiChange} 
                    onChange={(e) => setKpiChange(e.target.value)} 
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de Variación</label>
                  <select 
                    value={kpiChangeType} 
                    onChange={(e: any) => setKpiChangeType(e.target.value)}
                    className={styles.input}
                  >
                    <option value="positive">Positivo (Verde)</option>
                    <option value="negative">Negativo (Rojo)</option>
                    <option value="neutral">Neutral (Gris)</option>
                  </select>
                </div>
              </>
            ) : (
              <div className={styles.formGroup}>
                <label className={styles.label}>Datos (Formato JSON Array)</label>
                <textarea 
                  value={dataJson} 
                  onChange={(e) => {
                    setDataJson(e.target.value);
                    setDataError('');
                  }}
                  className={styles.textarea}
                  rows={6}
                />
                {dataError && <span className={styles.error}>{dataError}</span>}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Estilo y Colores</label>
              <div className={styles.colorRow}>
                <div className={styles.colorInput}>
                  <span>Primario</span>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                </div>
                {chartType !== 'kpi' && chartType !== 'pie' && (
                  <>
                    <div className={styles.colorInput}>
                      <span>Gradiente Inicio</span>
                      <input type="color" value={gradientStart} onChange={e => setGradientStart(e.target.value)} />
                    </div>
                    <div className={styles.colorInput}>
                      <span>Gradiente Fin</span>
                      <input type="color" value={gradientEnd} onChange={e => setGradientEnd(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={() => setShowDashboardCreator(false)}>
            Cancelar
          </button>
          <button className={styles.createBtn} onClick={handleCreate}>
            <Check size={16} style={{marginRight: 8}} /> Insertar Widget
          </button>
        </div>
      </div>
    </div>
  );
}
