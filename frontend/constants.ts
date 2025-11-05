import { AnalysisResult, LayoutConfig, GalleryItemType, CustomPrompt } from './types';

// ✅ 分析历史完全动态生成，初始为空
// 只有用户通过"AI总结"功能生成的分析结果才会显示在这里
export const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = [];

export const AI_MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (最快最经济)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (快速平衡)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (最高质量)' },
];

// ✅ 自定义提示词初始为空，完全由用户在前端创建和修改
// 这些是"二阶提示词"，用于影响AI总结的内容和风格
export const MOCK_CUSTOM_PROMPTS: CustomPrompt[] = [];

// FIX: Add GALLERY_LAYOUTS constant to define gallery grid layouts.
export const GALLERY_LAYOUTS: LayoutConfig[][] = [
  [
    { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1' },
    { colSpan: 'md:col-span-2', rowSpan: 'md:row-span-1' },
    { colSpan: 'md:col-span-2', rowSpan: 'md:row-span-1' },
    { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1' },
    { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1' },
    { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1' },
    { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1' },
  ],
];

// FIX: Add CONTACT_CONTENT constant for the about page.
export const CONTACT_CONTENT = {
  title: '关于我们',
  paragraphs: [
    '我们是一个充满激情的团队，致力于通过技术创新改变世界。我们的使命是创造不仅功能强大，而且美观易用的产品。',
    '如果您有任何问题、合作建议或只是想打个招呼，请随时与我们联系。我们期待您的来信。',
  ],
};

// FIX: Add GALLERY_IMAGES constant for the archive page.
export const GALLERY_IMAGES: GalleryItemType[] = [
  {
    id: 101,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop',
    caption: '现代工作空间',
    category: '室内设计',
    vrUrl: 'https://example.com/vr/101',
  },
  {
    id: 102,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=2072&auto=format&fit=crop',
    caption: '远程办公设置',
    category: '产品设计',
  },
  {
    id: 103,
    type: 'text',
    title: '我们的设计理念',
    paragraph: '我们相信，好的设计是功能与美学的完美结合。每一个项目都始于对用户需求的深刻理解，并以创造有意义的体验为最终目标。'
  },
  {
    id: 104,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop',
    caption: '编码与咖啡',
    category: '生活方式',
  },
  {
    id: 105,
    type: 'image',
    caption: '城市天际线',
    category: '建筑',
    src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0',
    vrUrl: 'https://example.com/vr/105',
  },
  {
    id: 106,
    type: 'image',
    caption: '简约主义',
    category: '室内设计',
    src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4',
  },
];
