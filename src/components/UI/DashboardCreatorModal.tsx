import { useState, useEffect } from 'react';
import { X, Check, BarChart2, PieChart, Activity, Hash, Layers, Plus, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import ChartRenderer from '../Preview/ChartRenderer';
import ColorPicker from './ColorPicker';
import type { Layer } from '../../types';
import styles from './DashboardCreatorModal.module.css';

const MOCK_DATA_TEMPLATES = {
  line: [
    { id: '1', name: 'Ene', value: 400 },
    { id: '2', name: 'Feb', value: 300 },
    { id: '3', name: 'Mar', value: 550 },
    { id: '4', name: 'Abr', value: 450 },
    { id: '5', name: 'May', value: 700 },
  ],
  bar: [
    { id: '1', name: 'Lun', value: 120 },
    { id: '2', name: 'Mar', value: 200 },
    { id: '3', name: 'Mié', value: 150 },
    { id: '4', name: 'Jue', value: 80 },
    { id: '5', name: 'Vie', value: 250 },
  ],
  pie: [
    { id: '1', name: 'Desktop', value: 400 },
    { id: '2', name: 'Mobile', value: 300 },
    { id: '3', name: 'Tablet', value: 100 },
  ],
  area: [
    { id: '1', name: 'Q1', value: 4000, secondary: 2400 },
    { id: '2', name: 'Q2', value: 3000, secondary: 1398 },
    { id: '3', name: 'Q3', value: 2000, secondary: 9800 },
    { id: '4', name: 'Q4', value: 2780, secondary: 3908 },
  ],
  kpi: [] 
};

const FONTS = [
  { value: 'inherit', label: 'Heredar (Predeterminado)' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
];

interface DataRow {
  id: string;
  name: string;
  value: number;
  secondary?: number;
}

export default function DashboardCreatorModal() {
  const { showDashboardCreator, setShowDashboardCreator, addLayer } = useEditorStore();
  
  const [activeTab, setActiveTab] = useState<'data' | 'config' | 'style'>('data');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'kpi' | 'area'>('area');
  
  // Config
  const [title, setTitle] = useState('Ingresos Anuales');
  const [subtitle, setSubtitle] = useState('Comparativa de ventas');
  const [fontFamily, setFontFamily] = useState('inherit');
  const [showLegend, setShowLegend] = useState(true);
  const [legendPosition, setLegendPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  
  // Data State
  const [dataRows, setDataRows] = useState<DataRow[]>(MOCK_DATA_TEMPLATES.area);
  const [kpiValue, setKpiValue] = useState('$ 142,560.00');
  const [kpiChange, setKpiChange] = useState('↑ 8.2% vs mes anterior');
  const [kpiChangeType, setKpiChangeType] = useState<'positive' | 'negative' | 'neutral'>('positive');

  // Advanced Colors
  const [primaryColor, setPrimaryColor] = useState('#6366f1'); // Indigo
  const [gradientStart, setGradientStart] = useState('#8b5cf6'); // Violet
  const [gradientEnd, setGradientEnd] = useState('#3b82f6'); // Blue
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [titleColor, setTitleColor] = useState('#111827');
  const [subtitleColor, setSubtitleColor] = useState('#6b7280');
  const [textColor, setTextColor] = useState('#6b7280'); // For axes, legends

  useEffect(() => {
    if (chartType !== 'kpi') {
      setDataRows([...MOCK_DATA_TEMPLATES[chartType as keyof typeof MOCK_DATA_TEMPLATES]]);
    }
  }, [chartType]);

  if (!showDashboardCreator) return null;

  const handleCreate = () => {
    addLayer({ ...mockLayer, id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
    setShowDashboardCreator(false);
  };

  const handleRowChange = (id: string, field: keyof DataRow, value: string | number) => {
    setDataRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: field === 'name' ? value : Number(value) };
      }
      return row;
    }));
  };

  const addRow = () => {
    const newId = crypto.randomUUID();
    setDataRows([...dataRows, { id: newId, name: `Dato ${dataRows.length + 1}`, value: 100 }]);
  };

  const removeRow = (id: string) => {
    if (dataRows.length <= 1) return;
    setDataRows(dataRows.filter(r => r.id !== id));
  };

  const mockLayer: Layer = {
    id: 'mock-layer',
    type: 'chart',
    name: `Gráfica ${chartType}`,
    x: 0,
    y: 0,
    width: chartType === 'kpi' ? 300 : 500,
    height: chartType === 'kpi' ? 200 : 350,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    chartType,
    chartData: dataRows,
    showShadow: true,
    borderRadius: 16,
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
      fontFamily,
      showLegend,
      legendPosition,
      cardBackgroundColor,
      titleColor,
      subtitleColor,
      textColor
    }
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
          
          {/* Left Column: Form Controls with Tabs */}
          <div className={styles.leftCol}>
            
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'data' ? styles.active : ''}`}
                onClick={() => setActiveTab('data')}
              >
                Datos
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'config' ? styles.active : ''}`}
                onClick={() => setActiveTab('config')}
              >
                Configuración
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'style' ? styles.active : ''}`}
                onClick={() => setActiveTab('style')}
              >
                Estilos
              </button>
            </div>

            <div className={styles.tabContent}>
              
              {activeTab === 'data' && (
                <>
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
                          className={styles.select}
                        >
                          <option value="positive">Positivo (Verde)</option>
                          <option value="negative">Negativo (Rojo)</option>
                          <option value="neutral">Neutral (Gris)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Datos de la Gráfica</label>
                      <div className={styles.dataRowsContainer}>
                        {dataRows.map((row) => (
                          <div key={row.id} className={styles.dataRow}>
                            <input 
                              type="text" 
                              value={row.name} 
                              onChange={e => handleRowChange(row.id, 'name', e.target.value)}
                              className={styles.input}
                              placeholder="Valor en X (Ej. Mes, Categoría)"
                            />
                            <input 
                              type="number" 
                              value={row.value} 
                              onChange={e => handleRowChange(row.id, 'value', e.target.value)}
                              className={styles.input}
                              placeholder="Valor en Y"
                            />
                            {(chartType === 'area' || chartType === 'line' || chartType === 'bar') && (
                              <input 
                                type="number" 
                                value={row.secondary ?? ''} 
                                onChange={e => handleRowChange(row.id, 'secondary', e.target.value)}
                                className={styles.input}
                                placeholder="Valor Y2 (Opcional)"
                              />
                            )}
                            <button 
                              className={styles.removeRowBtn} 
                              onClick={() => removeRow(row.id)}
                              title="Eliminar fila"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button className={styles.addRowBtn} onClick={addRow}>
                          <Plus size={16} /> Añadir Dato
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'config' && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Título (Opcional)</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className={styles.input}
                      placeholder="Ej. Resultados Q3"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Subtítulo (Opcional)</label>
                    <input 
                      type="text" 
                      value={subtitle} 
                      onChange={(e) => setSubtitle(e.target.value)} 
                      className={styles.input}
                      placeholder="Ej. Comparativa anual"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tipografía Global</label>
                    <select 
                      value={fontFamily} 
                      onChange={(e) => setFontFamily(e.target.value)}
                      className={styles.select}
                    >
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>

                  {chartType !== 'kpi' && (
                    <>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={showLegend} 
                          onChange={(e) => setShowLegend(e.target.checked)} 
                        />
                        Mostrar Leyenda
                      </label>

                      {showLegend && (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Posición de Leyenda</label>
                          <select 
                            value={legendPosition} 
                            onChange={(e: any) => setLegendPosition(e.target.value)}
                            className={styles.select}
                          >
                            <option value="top">Arriba</option>
                            <option value="bottom">Abajo</option>
                            <option value="left">Izquierda</option>
                            <option value="right">Derecha</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'style' && (
                <div className={styles.colorGrid}>
                  <ColorPicker label="Fondo del Widget" color={cardBackgroundColor} onChange={setCardBackgroundColor} />
                  <ColorPicker label="Color de Título" color={titleColor} onChange={setTitleColor} />
                  <ColorPicker label="Color de Subtítulo" color={subtitleColor} onChange={setSubtitleColor} />
                  
                  {chartType !== 'kpi' && (
                    <ColorPicker label="Texto (Ejes y Leyenda)" color={textColor} onChange={setTextColor} />
                  )}

                  <ColorPicker label="Color Primario (Gráfica)" color={primaryColor} onChange={setPrimaryColor} />
                  
                  {chartType !== 'kpi' && chartType !== 'pie' && (
                    <>
                      <ColorPicker label="Gradiente Inicio" color={gradientStart} onChange={setGradientStart} />
                      <ColorPicker label="Gradiente Fin" color={gradientEnd} onChange={setGradientEnd} />
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className={styles.rightCol}>
            <div className={styles.previewLabel}>Vista Previa en Vivo</div>
            <div className={styles.previewContainer}>
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ width: mockLayer.width, height: mockLayer.height, transform: 'scale(0.8)', transformOrigin: 'center', flexShrink: 0 }}>
                  <ChartRenderer layer={mockLayer} />
                </div>
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
