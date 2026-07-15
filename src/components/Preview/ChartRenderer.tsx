import React from 'react';
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import type { Layer } from '../../types';

interface ChartRendererProps {
  layer: Layer;
}

export default function ChartRenderer({ layer }: ChartRendererProps) {
  if (layer.type !== 'chart' || !layer.chartConfig) return null;

  const {
    title = '',
    subtitle = '',
    value = '',
    change = '',
    changeType = 'positive',
    color = '#6366f1',
    gradient = ['#8b5cf6', '#3b82f6'],
    showAxes = true,
    showGrid = true,
    fontFamily = 'inherit',
    showLegend = true,
    legendPosition = 'bottom',
    cardBackgroundColor = 'var(--bg-panel, #ffffff)',
    titleColor = 'var(--text-primary, #111827)',
    subtitleColor = 'var(--text-secondary, #6b7280)',
    textColor = 'var(--text-secondary, #6b7280)',
  } = layer.chartConfig;

  const data = layer.chartData || [];
  const type = layer.chartType || 'line';

  const baseFont = fontFamily === 'inherit' ? 'inherit' : fontFamily;

  // KPI Card Type
  if (type === 'kpi') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: cardBackgroundColor,
        borderRadius: `${layer.borderRadius || 16}px`,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: layer.showShadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
        fontFamily: baseFont
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: titleColor, fontWeight: 500 }}>
            {title}
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: 700, color: titleColor }}>
            {value}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 600,
            color: changeType === 'positive' ? '#10b981' : changeType === 'negative' ? '#ef4444' : subtitleColor
          }}>
            {change}
          </span>
        </div>
      </div>
    );
  }

  // Base styling for Charts (Background card)
  const cardStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
    backgroundColor: cardBackgroundColor,
    borderRadius: `${layer.borderRadius || 16}px`,
    padding: '20px',
    boxShadow: layer.showShadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: baseFont,
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: titleColor
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '4px 0 0',
    fontSize: '12px',
    color: subtitleColor
  };

  const gradId = `colorUv-${layer.id}`;
  const hasSecondary = data.some(d => d.secondary !== undefined);

  // Recharts Legend positioning logic
  const getLegendProps = () => {
    switch(legendPosition) {
      case 'top': return { align: 'center' as const, verticalAlign: 'top' as const, layout: 'horizontal' as const };
      case 'bottom': return { align: 'center' as const, verticalAlign: 'bottom' as const, layout: 'horizontal' as const };
      case 'left': return { align: 'left' as const, verticalAlign: 'middle' as const, layout: 'vertical' as const };
      case 'right': return { align: 'right' as const, verticalAlign: 'middle' as const, layout: 'vertical' as const };
      default: return { align: 'center' as const, verticalAlign: 'bottom' as const, layout: 'horizontal' as const };
    }
  };
  const legendProps = getLegendProps();

  // Calculate chart dimensions
  const hasHeader = !!(title || subtitle);
  const headerHeight = hasHeader ? (title && subtitle ? 45 : 25) : 0;
  const chartWidth = Math.max(100, (layer.width || 500) - 40); // 40px padding
  const chartHeight = Math.max(100, (layer.height || 350) - 40 - headerHeight - (hasHeader ? 16 : 0));

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
            <AreaChart width={chartWidth} height={chartHeight} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={textColor} strokeOpacity={0.2} />}
              {showAxes && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} dy={10} />}
              {showAxes && <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} />}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontFamily: baseFont, color: titleColor, backgroundColor: cardBackgroundColor }}
                itemStyle={{ color: titleColor }}
              />
              {showLegend && <Legend {...legendProps} wrapperStyle={{ color: textColor, fontSize: 12, paddingTop: legendPosition === 'bottom' ? 10 : 0, paddingBottom: legendPosition === 'top' ? 10 : 0, paddingLeft: legendPosition === 'right' ? 10 : 0, paddingRight: legendPosition === 'left' ? 10 : 0 }} />}
              <Area type="monotone" dataKey="value" name="Valor" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#${gradId})`} />
              {hasSecondary && (
                <Area type="monotone" dataKey="secondary" name="Secundario" stroke={textColor} strokeOpacity={0.5} strokeWidth={3} fillOpacity={0.1} fill={textColor} />
              )}
            </AreaChart>
        );

      case 'line':
        return (
            <LineChart width={chartWidth} height={chartHeight} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={textColor} strokeOpacity={0.2} />}
              {showAxes && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} dy={10} />}
              {showAxes && <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} />}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontFamily: baseFont, color: titleColor, backgroundColor: cardBackgroundColor }}
                itemStyle={{ color: titleColor }}
              />
              {showLegend && <Legend {...legendProps} wrapperStyle={{ color: textColor, fontSize: 12, paddingTop: legendPosition === 'bottom' ? 10 : 0, paddingBottom: legendPosition === 'top' ? 10 : 0, paddingLeft: legendPosition === 'right' ? 10 : 0, paddingRight: legendPosition === 'left' ? 10 : 0 }} />}
              <Line type="monotone" dataKey="value" name="Valor" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: cardBackgroundColor }} activeDot={{ r: 6 }} />
              {hasSecondary && (
                <Line type="monotone" dataKey="secondary" name="Secundario" stroke={textColor} strokeOpacity={0.5} strokeWidth={3} dot={{ r: 4, fill: textColor, strokeWidth: 2, stroke: cardBackgroundColor }} />
              )}
            </LineChart>
        );

      case 'bar':
        return (
            <BarChart width={chartWidth} height={chartHeight} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={textColor} strokeOpacity={0.2} />}
              {showAxes && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} dy={10} />}
              {showAxes && <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} />}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontFamily: baseFont, color: titleColor, backgroundColor: cardBackgroundColor }}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                itemStyle={{ color: titleColor }}
              />
              {showLegend && <Legend {...legendProps} wrapperStyle={{ color: textColor, fontSize: 12, paddingTop: legendPosition === 'bottom' ? 10 : 0, paddingBottom: legendPosition === 'top' ? 10 : 0, paddingLeft: legendPosition === 'right' ? 10 : 0, paddingRight: legendPosition === 'left' ? 10 : 0 }} />}
              <Bar dataKey="value" name="Valor" fill={color} radius={[6, 6, 6, 6]} />
              {hasSecondary && (
                <Bar dataKey="secondary" name="Secundario" fill={textColor} fillOpacity={0.4} radius={[6, 6, 6, 6]} />
              )}
            </BarChart>
        );

      case 'pie':
        const COLORS = [color, gradient[0], gradient[1], textColor];
        return (
            <RePieChart width={chartWidth} height={chartHeight}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontFamily: baseFont, color: titleColor, backgroundColor: cardBackgroundColor }}
                itemStyle={{ color: titleColor }}
              />
              {showLegend && <Legend {...legendProps} wrapperStyle={{ color: textColor, fontSize: 12, paddingTop: legendPosition === 'bottom' ? 10 : 0, paddingBottom: legendPosition === 'top' ? 10 : 0, paddingLeft: legendPosition === 'right' ? 10 : 0, paddingRight: legendPosition === 'left' ? 10 : 0 }} />}
            </RePieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div style={cardStyle}>
      {(title || subtitle) && (
        <div style={headerStyle}>
          {title && <h3 style={titleStyle}>{title}</h3>}
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}
