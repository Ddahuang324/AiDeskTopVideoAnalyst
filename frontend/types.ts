export enum Page {
  Home,
  History,
  Settings,
}

export interface AnalysisResult {
  id: number;
  timestamp: string;
  title: string;
  summary: string;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
}

export interface CustomPrompt {
  id: number;
  title: string;
  content: string;
  isDefault: boolean;
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