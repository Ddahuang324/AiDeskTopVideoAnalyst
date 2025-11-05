// 基础接口
export interface Distraction {
  type: string;
  duration: number;
  details?: string;
}

export interface AppSites {
  primary?: string;
  secondary?: string;
}

// 活动卡片数据
export interface ActivityCardData {
  startTime: string;
  endTime: string;
  category: string;
  subcategory?: string;
  title: string;
  summary: string;
  detailedSummary: string;
  distractions?: Distraction[];
  appSites?: AppSites;
}

// 工作流记录
export interface WorkflowRecording {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  filePath: string;
  status: 'recording' | 'completed' | 'failed' | 'processing';
  metadata: Record<string, unknown>;
}

// 工作流摘要
export interface WorkflowSummary {
  id: string;
  workflowRecordingId: string;
  summaryDate: Date;
  totalActiveTime: number;
  totalIdleTime: number;
  activityCards: ActivityCardData[];
  rawAiOutput: string;
}

// 自定义提示词
export interface CustomPrompt {
  id: string;
  name: string;
  promptText: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}