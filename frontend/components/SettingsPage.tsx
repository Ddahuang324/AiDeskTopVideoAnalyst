import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { AI_MODELS } from '../constants';
import { CustomPrompt } from '../types';

interface SettingsPageProps {
    prompts: CustomPrompt[];
    onSetPrompts: (prompts: CustomPrompt[]) => void;
    onSetDefaultPrompt: (id: number) => void;
    selectedModel: string;
    onSelectModel: (modelId: string) => void;
}

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, ease: [0.6, 0.01, 0.05, 0.9], staggerChildren: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const SettingsPage: React.FC<SettingsPageProps> = ({ prompts, onSetPrompts, onSetDefaultPrompt, selectedModel, onSelectModel }) => {
    const [apiKey, setApiKey] = useState('');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Load API Key from localStorage on component mount
    useEffect(() => {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
    }, []);

    const handleSaveSettings = () => {
        if (!apiKey.trim()) {
            setSaveMessage('API 密钥不能为空');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        // Save API Key to localStorage
        localStorage.setItem('gemini_api_key', apiKey);
        setSaveMessage('配置保存成功！');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleSetDefault = (id: number) => {
        onSetDefaultPrompt(id);
    };

    const handleDelete = (id: number) => {
        onSetPrompts(prompts.filter(p => p.id !== id));
    };
    
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto px-4 sm:px-6 py-32"
    >
        <div className="max-w-3xl mx-auto">
            <motion.div 
                className="text-center mb-16"
                variants={contentVariants}
            >
                <h1 className="text-3xl sm:text-4xl font-light tracking-widest uppercase text-[#222222]">设置</h1>
                <p className="mt-3 text-gray-500 tracking-wide">管理您的应用设置和自定义提示</p>
            </motion.div>

            <motion.div variants={contentVariants} className="mb-12">
                <h2 className="text-2xl font-light text-[#222222] border-b border-gray-200 pb-4 mb-8">API 配置</h2>
                
                <div className="mb-8">
                    <label htmlFor="api-key" className="block text-md font-medium text-gray-800 mb-2">Gemini API 密钥</label>
                    <p className="text-sm text-gray-500 mb-4">
                        请输入您的 Google Gemini API 密钥。您可以在 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#B8860B] hover:underline">Google AI Studio</a> 获取。
                    </p>
                    <div className="relative">
                        <input
                            id="api-key"
                            type={isKeyVisible ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-transparent px-1 py-2 border-b-2 border-gray-300 focus:border-[#222222] focus:outline-none transition-colors"
                        />
                        <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="absolute inset-y-0 right-0 px-2 flex items-center text-gray-500 hover:text-gray-800 transition-colors">
                           {isKeyVisible ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7 9.542 7 .847 0 1.668.124 2.456.354M16 12a4 4 0 11-8 0 4 4 0 018 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 1l22 22" /></svg>
                           )}
                        </button>
                    </div>
                </div>

                <div className="mb-10">
                    <label htmlFor="ai-model" className="block text-md font-medium text-gray-800 mb-2">AI 模型选择</label>
                    <p className="text-sm text-gray-500 mb-4">选择用于分析的 Gemini 模型。Flash 模型速度快，Pro 模型质量更好。</p>
                    <div className="relative">
                        <select
                            id="ai-model"
                            value={selectedModel}
                            onChange={(e) => onSelectModel(e.target.value)}
                            className="w-full bg-transparent px-1 py-2 border-b-2 border-gray-300 appearance-none focus:outline-none focus:border-[#222222] transition-colors"
                        >
                            {AI_MODELS.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-[#222222] text-white font-medium tracking-widest uppercase py-3 px-4 hover:bg-[#B8860B] transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                    保存配置
                </button>
                {saveMessage && (
                    <p className={`mt-3 text-center text-sm font-medium ${saveMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                        {saveMessage}
                    </p>
                )}
            </motion.div>

            <motion.div variants={contentVariants}>
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-2xl font-light text-[#222222]">自定义提示管理</h2>
                    <button className="bg-[#222222] text-white font-medium tracking-widest uppercase text-xs py-2 px-4 hover:bg-[#B8860B] transition-all duration-300 ease-in-out">
                        创建新提示
                    </button>
                </div>
                
                <div className="space-y-4">
                    {prompts.map((prompt, index) => (
                        <div key={prompt.id} className={`py-6 ${index !== prompts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                             <div className="flex items-center mb-2">
                                <h3 className="font-medium text-lg text-gray-800">{prompt.title}</h3>
                                {prompt.isDefault && (
                                    <span className="ml-3 text-[#B8860B] border border-[#B8860B]/50 text-xs font-medium px-2 py-0.5 rounded-full">默认</span>
                                )}
                             </div>
                             <p className="text-gray-600 text-sm mb-4 leading-relaxed">{prompt.content}</p>
                             <div className="flex items-center space-x-4 text-sm font-medium">
                                {!prompt.isDefault && (
                                     <>
                                        <button onClick={() => handleSetDefault(prompt.id)} className="text-gray-600 hover:text-[#B8860B] transition-colors">设为默认</button>
                                        <span className="text-gray-300">|</span>
                                     </>
                                )}
                                <button className="text-gray-600 hover:text-[#B8860B] transition-colors">编辑</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => handleDelete(prompt.id)} className="text-red-500 hover:text-red-700 transition-colors">删除</button>
                             </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    </motion.div>
  );
};

export default SettingsPage;