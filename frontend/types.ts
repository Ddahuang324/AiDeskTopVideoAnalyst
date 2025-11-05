export enum Page {
  Home,
  History,
  Settings,
  PromptManager,
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  tags: string[];
  // 扩展字段：用于存储原始分析数据
  keyFindings?: { point: string; evidence?: string[] }[];
  productivityScore?: number; // 0-100
  thematicBreakdown?: {
    theme: string;
    durationPercentage: number;
    keyActions: string[];
  }[];
  nextActions?: string[];
  // 记录使用的自定义提示词
  customPromptUsed?: string;
  customPromptId?: number;
}

export interface CustomPrompt {
  id: number;
  title: string;
  content: string;
  isDefault: boolean;
  type: 'summary' | 'json';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProxySettings {
  enabled: boolean;
  url: string;
}

export interface AppSettings {
  networking: {
    proxy: ProxySettings;
  };
}


// FIX: Add LayoutConfig type for gallery layout definitions.
export interface LayoutConfig {
  colSpan: string;
  rowSpan: string;
}

// FIX: Add GalleryTextBlock type for text items in the gallery.
export interface GalleryTextBlock {
  id: number;
  type: 'text';
  title: string;
  paragraph: string;
}

// FIX: Add GalleryImage type for image items in the gallery.
export interface GalleryImage {
  id: number;
  type: 'image';
  src: string;
  caption: string;
  category: string;
  vrUrl?: string;
}

// FIX: Define a union type for different gallery item types.
export type GalleryItemType = GalleryImage | GalleryTextBlock;