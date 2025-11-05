import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromptStore } from '../stores/promptStore';
import { CustomPrompt } from '../../types';

const PromptManager: React.FC = () => {
  const {
    prompts,
    activePromptId,
    addPrompt,
    updatePrompt,
    deletePrompt,
    setActivePrompt,
  } = usePromptStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    type: 'summary' as 'summary' | 'json',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      type: 'summary',
    });
    setEditingPrompt(null);
  };

  const openModal = (prompt?: CustomPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormData({
        title: prompt.title,
        content: prompt.content,
        description: prompt.description || '',
        type: prompt.type,
      });
    } else {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    if (editingPrompt) {
      updatePrompt(editingPrompt.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim(),
      });
    } else {
      addPrompt({
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim(),
        isDefault: false,
        type: formData.type,
      });
    }

    closeModal();
  };

  const handleDelete = (id: number) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt?.isDefault) {
      alert('不能删除默认提示词');
      return;
    }

    if (window.confirm(`确定要删除提示词"${prompt?.title}"吗？`)) {
      deletePrompt(id);
    }
  };

  const customPrompts = prompts.filter(p => !p.isDefault);
  const defaultPrompts = prompts.filter(p => p.isDefault);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#F9F9F9]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#222222] mb-2 tracking-wide">提示词管理</h1>
          <p className="text-gray-600">创建和管理自定义AI分析提示词</p>
        </div>

        {/* 默认提示词展示 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#222222] mb-4">系统默认提示词</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultPrompts.map((prompt) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-lg border-2 transition-all shadow-sm hover:shadow-md ${
                  activePromptId === prompt.id
                    ? 'border-[#B8860B] bg-amber-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-[#222222]">{prompt.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">系统</span>
                </div>
                {prompt.description && (
                  <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                )}
                <p className="text-sm text-gray-700 line-clamp-3">{prompt.content}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setActivePrompt(prompt.id)}
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      activePromptId === prompt.id
                        ? 'bg-[#B8860B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {activePromptId === prompt.id ? '✓ 当前使用' : '设为默认'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      {/* 自定义提示词管理 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#222222]">自定义提示词</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#B8860B] hover:bg-[#9A7209] text-white px-6 py-2 rounded-lg transition-colors tracking-wide"
        >
          创建新提示词
        </button>
      </div>

      {customPrompts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg mb-1">暂无自定义提示词</p>
          <p className="text-sm">点击上方按钮创建您的第一个自定义提示词</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customPrompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-lg border-2 transition-all shadow-sm hover:shadow-md ${
                activePromptId === prompt.id
                  ? 'border-[#B8860B] bg-amber-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-[#222222]">{prompt.title}</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">自定义</span>
              </div>
              {prompt.description && (
                <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
              )}
              <p className="text-sm text-gray-700 line-clamp-3">{prompt.content}</p>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex space-x-3">
                  <button
                    onClick={() => openModal(prompt)}
                    className="text-sm text-[#B8860B] hover:text-[#9A7209] font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    删除
                  </button>
                </div>
                <button
                  onClick={() => setActivePrompt(prompt.id)}
                  className={`text-sm px-3 py-1 rounded transition-colors ${
                    activePromptId === prompt.id
                      ? 'bg-[#B8860B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {activePromptId === prompt.id ? '✓ 当前使用' : '设为默认'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

        {/* Modal */}
        <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-[#222222]">
                {editingPrompt ? '编辑提示词' : '创建新提示词'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                    placeholder="输入提示词标题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                    placeholder="简要描述这个提示词的用途"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    提示词类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'summary' | 'json' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                  >
                    <option value="summary">总结提示词（用于生成初步总结笔记）</option>
                    <option value="json">JSON生成提示词（用于生成结构化输出）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    提示词内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent resize-vertical"
                    placeholder="输入AI分析的指导内容..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 bg-[#B8860B] text-white rounded hover:bg-[#9A7209] transition-colors"
                >
                  {editingPrompt ? '更新' : '创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default PromptManager;