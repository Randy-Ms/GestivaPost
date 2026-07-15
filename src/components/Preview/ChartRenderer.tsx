import React from 'react';
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid
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
  } = layer.chartConfig;

  const data = layer.chartData || [];
  const type = layer.chartType || 'line';

  // KPI Card Type
  if (type === 'kpi') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-panel, #ffffff)',
        borderRadius: `${layer.borderRadius || 16}px`,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: layer.showShadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
        fontFamily: 'inherit'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500 }}>
            {title}
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
            {value}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 600,
            color: changeType === 'positive' ? '#10b981' : changeType === 'negative' ? '#ef4444' : '#6b7280'
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
    backgroundColor: 'var(--bg-panel, #ffffff)',
    borderRadius: `${layer.borderRadius || 16}px`,
    padding: '20px',
    boxShadow: layer.showShadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary, #111827)'
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '4px 0 0',
    fontSize: '12px',
    color: 'var(--text-secondary, #6b7280)'
  };

  const gradId = `colorUv-${layer.id}`;

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />}
              {showAxes && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />}
              {showAxes && <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#${gradId})`} />
              {data[0]?.secondary && (
                <Area type="monotone" dataKey="secondary" stroke="#d1d5db" strokeWidth={3} fillOpacity={0.3} fill="#f3f4f6" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />}
              {showAxes && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />}
              {showAxes && <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />}
              {showAxes && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />}
              {showAxes && <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="value" fill={color} radius={[6, 6, 6, 6]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === data.length - 1 ? color : '#e5e7eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const COLORS = [color, gradient[0], gradient[1], '#f3f4f6'];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
            </RePieChart>
          </ResponsiveContainer>
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
      <div style={{ flex: 1, minHeight: 0 }}>
        {renderChart()}
      </div>
    </div>
  );
}
