import { create } from 'zustand';

export interface Distraction {
  type: string;
  duration: number;
  details?: string;
}

export interface AppSites {
  primary?: string;
  secondary?: string;
}

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

export interface WorkflowSummary {
  id: string;
  workflowRecordingId: string;
  summaryDate: Date;
  totalActiveTime: number;
  totalIdleTime: number;
  activityCards: ActivityCardData[];
  rawAiOutput: string;
}

interface SummaryState {
  summary: WorkflowSummary | null;
  setSummary: (summary: WorkflowSummary) => void;
  clearSummary: () => void;
}

export const useSummaryStore = create<SummaryState>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
  clearSummary: () => set({ summary: null }),
}));
