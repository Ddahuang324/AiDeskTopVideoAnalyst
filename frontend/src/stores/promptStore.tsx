import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomPrompt } from '../../types';

interface PromptContextType {
  prompts: CustomPrompt[];
  activePromptId: number | null;
  addPrompt: (prompt: Omit<CustomPrompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePrompt: (id: number, updates: Partial<CustomPrompt>) => void;
  deletePrompt: (id: number) => void;
  setActivePrompt: (id: number) => void;
  getActivePrompt: () => CustomPrompt | null;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

// 默认提示词
const DEFAULT_PROMPTS: CustomPrompt[] = [
  {
    id: 1,
    title: '通用分析',
    content: '请从整体工作效率、时间分配和关键活动三个维度进行分析，突出工作成果和改进建议。',
    isDefault: true,
    type: 'summary',
    description: '适用于大多数工作场景的通用分析提示',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: '技术开发',
    content: '重点关注技术决策、代码质量和开发效率，分析遇到的技术挑战、解决方案以及对项目进度的影响。',
    isDefault: true,
    type: 'summary',
    description: '专为软件开发场景优化的分析提示',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: '会议纪要',
    content: '以会议纪要的正式风格总结讨论内容、达成共识、决策结果和后续行动项，突出会议效率和参与度。',
    isDefault: true,
    type: 'summary',
    description: '适用于会议和讨论场景的纪要式分析',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'customPrompts';
const ACTIVE_PROMPT_KEY = 'activePromptId';

export const PromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prompts, setPrompts] = useState<CustomPrompt[]>(DEFAULT_PROMPTS);
  const [activePromptId, setActivePromptId] = useState<number | null>(1);

  // 从本地存储加载数据
  useEffect(() => {
    try {
      const storedPrompts = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_PROMPT_KEY);

      if (storedPrompts) {
        const parsedPrompts = JSON.parse(storedPrompts);
        // 合并默认提示词和用户自定义提示词
        const mergedPrompts = [...DEFAULT_PROMPTS];
        const customPrompts = parsedPrompts.filter((p: CustomPrompt) => !p.isDefault);

        // 为自定义提示词分配新的ID（避免与默认ID冲突）
        const maxDefaultId = Math.max(...DEFAULT_PROMPTS.map(p => p.id));
        customPrompts.forEach((prompt, index) => {
          prompt.id = maxDefaultId + index + 1;
        });

        mergedPrompts.push(...customPrompts);
        setPrompts(mergedPrompts);
      }

      if (storedActiveId) {
        setActivePromptId(parseInt(storedActiveId, 10));
      }
    } catch (error) {
      console.error('Failed to load prompts from localStorage:', error);
    }
  }, []);

  // 保存到本地存储
  const saveToStorage = (newPrompts: CustomPrompt[], newActiveId: number | null) => {
    try {
      // 只保存用户自定义的提示词
      const customPrompts = newPrompts.filter(p => !p.isDefault);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPrompts));
      localStorage.setItem(ACTIVE_PROMPT_KEY, newActiveId?.toString() || '');
    } catch (error) {
      console.error('Failed to save prompts to localStorage:', error);
    }
  };

  const addPrompt = (promptData: Omit<CustomPrompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = Math.max(...prompts.map(p => p.id)) + 1;
    const newPrompt: CustomPrompt = {
      ...promptData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newPrompts = [...prompts, newPrompt];
    setPrompts(newPrompts);
    saveToStorage(newPrompts, activePromptId);
  };

  const updatePrompt = (id: number, updates: Partial<CustomPrompt>) => {
    const newPrompts = prompts.map(prompt =>
      prompt.id === id
        ? { ...prompt, ...updates, updatedAt: new Date().toISOString() }
        : prompt
    );
    setPrompts(newPrompts);
    saveToStorage(newPrompts, activePromptId);
  };

  const deletePrompt = (id: number) => {
    // 不允许删除默认提示词
    const promptToDelete = prompts.find(p => p.id === id);
    if (promptToDelete?.isDefault) {
      return;
    }

    const newPrompts = prompts.filter(prompt => prompt.id !== id);
    let newActiveId = activePromptId;

    // 如果删除的是当前激活的提示词，切换到默认提示词
    if (activePromptId === id) {
      newActiveId = 1; // 默认使用第一个默认提示词
      setActivePromptId(newActiveId);
    }

    setPrompts(newPrompts);
    saveToStorage(newPrompts, newActiveId);
  };

  const setActivePrompt = (id: number) => {
    setActivePromptId(id);
    saveToStorage(prompts, id);
  };

  const getActivePrompt = (): CustomPrompt | null => {
    return prompts.find(prompt => prompt.id === activePromptId) || null;
  };

  return (
    <PromptContext.Provider value={{
      prompts,
      activePromptId,
      addPrompt,
      updatePrompt,
      deletePrompt,
      setActivePrompt,
      getActivePrompt,
    }}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePromptStore = () => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePromptStore must be used within a PromptProvider');
  }
  return context;
};