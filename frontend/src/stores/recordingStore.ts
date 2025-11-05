import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  startRecording: () => void;
  stopRecording: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  startTime: null,
  startRecording: () => set({ isRecording: true, startTime: Date.now() }),
  stopRecording: () => set({ isRecording: false, startTime: null }),
}));
