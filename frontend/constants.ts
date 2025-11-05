import { AnalysisResult, LayoutConfig, GalleryItemType, CustomPrompt } from './types';

export const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = [
  {
    id: 1,
    timestamp: '2023年10月27日, 14:30',
    title: 'Q4产品路线图规划会议',
    summary: '会议确定了第四季度的主要产品方向，重点关注用户体验优化和AI功能集成。讨论了三个核心特性，并分配了初步的开发资源。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2232&auto=format&fit=crop',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    tags: ['会议纪要', '产品规划', 'Q4', 'AI'],
  },
  {
    id: 2,
    timestamp: '2023年10月26日, 10:00',
    title: '竞争对手UX分析',
    summary: '对主要竞争对手App "InnovateNow" 的用户体验进行了深入分析。其优点在于流畅的引导流程，但导航结构混乱，存在改进空间。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['UX分析', '竞品分析', '用户体验'],
  },
  {
    id: 3,
    timestamp: '2023年10月25日, 16:15',
    title: '新功能设计评审',
    summary: '评审了“智能标签”功能的设计原型。视觉设计获得一致好评，但交互逻辑需要简化，减少用户操作步骤。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['设计评审', '原型', 'UX/UI'],
  },
  {
    id: 4,
    timestamp: '2023年10月24日, 11:00',
    title: '代码重构技术研讨',
    summary: '探讨了重构旧版认证模块的几种方案。最终决定采用微服务架构，以提高系统的可维护性和扩展性。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    tags: ['技术研讨', '代码重构', '架构'],
  },
   {
    id: 5,
    timestamp: '2023年10月23日, 09:30',
    title: '用户反馈整理与分析',
    summary: '整理了上周收集的用户反馈。多数用户希望增加自定义主题功能，并报告了在特定设备上的性能问题。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    tags: ['用户反馈', '数据分析', '产品改进'],
  },
   {
    id: 6,
    timestamp: '2023年10月22日, 15:00',
    title: '市场营销活动复盘',
    summary: '复盘了“金秋推广”活动的数据。活动整体ROI超出预期20%，社交媒体渠道的转化率最高。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520607162502-ac4c142b120a?q=80&w=2070&auto=format&fit=crop',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    tags: ['市场营销', '数据复盘', '推广活动'],
  }
];

export const AI_MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (最快最经济)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (快速平衡)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (最高质量)' },
];

export const MOCK_CUSTOM_PROMPTS: CustomPrompt[] = [
  {
    id: 1,
    title: '默认总结',
    content: '总结我的工作流',
    isDefault: true,
  },
  {
    id: 2,
    title: '详细报告',
    content: '生成详细的工作报告，包括时间分配和关键活动',
    isDefault: false,
  },
  {
    id: 3,
    title: '会议纪要',
    content: '将录制内容整理成一份正式的会议纪要，包含议题、决策和待办事项。',
    isDefault: false,
  }
];


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