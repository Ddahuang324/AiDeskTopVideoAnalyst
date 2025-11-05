import { create } from 'zustand';
import type { CustomPrompt } from '../types';

interface PromptState {
  prompts: CustomPrompt[];
  addPrompt: (prompt: CustomPrompt) => void;
  updatePrompt: (id: string, updatedPrompt: CustomPrompt) => void;
  deletePrompt: (id: string) => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  prompts: [
    { id: '1', name: '默认总结', promptText: '总结我的工作流', createdAt: new Date(), updatedAt: new Date(), isDefault: true },
    { id: '2', name: '详细报告', promptText: '生成详细的工作报告，包括时间分配和关键活动', createdAt: new Date(), updatedAt: new Date(), isDefault: false },
  ],
  addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, { ...prompt, id: String(state.prompts.length + 1), createdAt: new Date(), updatedAt: new Date() }] })),
  updatePrompt: (id, updatedPrompt) =>
    set((state) => ({
      prompts: state.prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, ...updatedPrompt, updatedAt: new Date() } : prompt
      ),
    })),
  deletePrompt: (id) =>
    set((state) => ({
      prompts: state.prompts.filter((prompt) => prompt.id !== id),
    })),
}));
