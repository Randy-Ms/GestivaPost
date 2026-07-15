export type Tool = 'pointer' | 'text' | 'shape' | 'pen_freehand' | 'pen_bezier' | 'image';
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'line' | 'hexagon' | 'pentagon' | 'cloud' | 'heart';
export type LayerType = 'text' | 'button' | 'image' | 'shape' | 'path' | 'icon' | 'chart';
export type SocialFormat = 'post_square' | 'post_vertical' | 'post_horizontal' | 'story' | 'reel' | 'carousel';
export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type BackgroundType = 'solid' | 'gradient';

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number;
  colors: string[];
}

export type FilterType = 'noise' | 'halftone';

export interface AppFilter {
  id: string;
  type: FilterType;
  opacity: number;
  scale?: number;
  dotSize?: number;
}

export interface BezierNode {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface Layer {
  id: string;
  parentId?: string; // For nesting groups
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  hidden: boolean;
  locked: boolean;
  layerColor?: string;
  
  // Universal properties
  noise?: number;
  backgroundType?: BackgroundType;
  gradient?: GradientConfig;
  showShadow?: boolean;
  
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // Style specific (buttons, shapes)
  backgroundColor?: string;
  borderRadius?: number;
  padding?: string;
  shapeType?: ShapeType;
  
  // Vector specific
  pathData?: string;
  nodes?: BezierNode[];
  strokeWidth?: number;
  
  // Icon specific
  iconName?: string;
  
  // Image specific
  src?: string;
  backgroundRemoved?: boolean;
  
  // Chart specific
  chartType?: 'line' | 'bar' | 'pie' | 'kpi' | 'area';
  chartData?: any[];
  chartConfig?: {
    title?: string;
    subtitle?: string;
    value?: string; // For KPI
    change?: string; // For KPI
    changeType?: 'positive' | 'negative' | 'neutral';
    color?: string;
    gradient?: string[];
    showAxes?: boolean;
    showGrid?: boolean;
    dataKey?: string;
  };
  
  // Shape specific
}

export interface GlobalSettings {
  width: number;
  height: number;
  
  // Background
  backgroundType: BackgroundType;
  backgroundColor: string;
  gradient: GradientConfig;
  noise: number;
  filters: AppFilter[];
  
  padding: number;
  borderRadius: number;
  showShadow: boolean;
  shadowConfig: {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    opacity: number;
  };
  
  // Instagram / Social Formats
  format: SocialFormat;
  isCarousel: boolean;
  carouselSlides: number;
  carouselOrientation: 'square' | 'vertical' | 'story';
  
  // Guides
  showGrid: boolean;
  showSafeArea: boolean;
  showMargins: boolean;
  showCarouselGuides: boolean;
  
  // Export Settings
  exportFormat: ExportFormat;
  exportQuality: number;
  exportMultiplier: number;
}

export interface EditorState {
  layers: Layer[];
  selectedLayerIds: string[];
  globalSettings: GlobalSettings;
}
