import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { AI_MODELS } from '../constants';
import { ProxySettings } from '../types';
import { fetchAppSettings, updateProxySettings } from '../src/services/settingsService';

interface SettingsPageProps {
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

const SettingsPage: React.FC<SettingsPageProps> = ({ selectedModel, onSelectModel }) => {
    const [apiKey, setApiKey] = useState('');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyUrl, setProxyUrl] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const saveMessageTimeout = useRef<number | undefined>(undefined);

    // Load API Key from localStorage on component mount
    useEffect(() => {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }

        const savedModel = localStorage.getItem('gemini_model');
        if (savedModel && savedModel !== selectedModel) {
            onSelectModel(savedModel);
        }
    }, [onSelectModel, selectedModel]);

    useEffect(() => {
        let cancelled = false;

        const loadSettings = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const settings = await fetchAppSettings();
                if (cancelled) {
                    return;
                }

                const proxy: ProxySettings | undefined = settings.networking?.proxy;
                setProxyEnabled(Boolean(proxy?.enabled));
                setProxyUrl(proxy?.url ?? '');
            } catch (error) {
                if (cancelled) {
                    return;
                }
                console.error('Failed to load app settings:', error);
                setProxyEnabled(false);
                setProxyUrl('');
                setLoadError(error instanceof Error ? error.message : '无法加载代理配置');
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadSettings();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (saveMessageTimeout.current) {
                window.clearTimeout(saveMessageTimeout.current);
            }
        };
    }, []);

    const handleSaveSettings = async () => {
        const trimmedApiKey = apiKey.trim();
        const trimmedProxyUrl = proxyUrl.trim();

        if (!trimmedApiKey) {
            setSaveMessage('API 密钥不能为空');
            if (saveMessageTimeout.current) {
                window.clearTimeout(saveMessageTimeout.current);
            }
            saveMessageTimeout.current = window.setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        if (proxyEnabled) {
            if (!trimmedProxyUrl) {
                setSaveMessage('代理地址不能为空');
                if (saveMessageTimeout.current) {
                    window.clearTimeout(saveMessageTimeout.current);
                }
                saveMessageTimeout.current = window.setTimeout(() => setSaveMessage(''), 3000);
                return;
            }

            try {
                const parsed = new URL(trimmedProxyUrl);
                if (!['http:', 'https:'].includes(parsed.protocol)) {
                    throw new Error('只支持 HTTP 或 HTTPS 代理协议');
                }
            } catch (error) {
                setSaveMessage(error instanceof Error ? error.message : '代理地址格式不正确');
                if (saveMessageTimeout.current) {
                    window.clearTimeout(saveMessageTimeout.current);
                }
                saveMessageTimeout.current = window.setTimeout(() => setSaveMessage(''), 3000);
                return;
            }
        }

        setIsSaving(true);
        setSaveMessage('');
        setLoadError(null);

        try {
            localStorage.setItem('gemini_api_key', trimmedApiKey);
            localStorage.setItem('gemini_model', selectedModel);

            const updatedProxy: ProxySettings = await updateProxySettings({
                enabled: proxyEnabled,
                url: trimmedProxyUrl,
            });

            setProxyEnabled(updatedProxy.enabled);
            setProxyUrl(updatedProxy.url);

            setSaveMessage('配置保存成功！');
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaveMessage(`保存失败：${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setIsSaving(false);
            if (saveMessageTimeout.current) {
                window.clearTimeout(saveMessageTimeout.current);
            }
            saveMessageTimeout.current = window.setTimeout(() => setSaveMessage(''), 3000);
        }
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
                <p className="mt-3 text-gray-500 tracking-wide">管理您的应用配置</p>
            </motion.div>

            <motion.div variants={contentVariants} className="mb-12">
                <h2 className="text-2xl font-light text-[#222222] border-b border-gray-200 pb-4 mb-8">网络代理</h2>
                <p className="text-sm text-gray-500 mb-4">在访问 Gemini API 之前配置代理。后端会使用该代理处理所有出站请求。</p>
                {loadError && (
                    <p className="mb-4 text-sm text-red-500">加载代理配置失败：{loadError}</p>
                )}
                <label className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#222222] focus:ring-[#B8860B]"
                        checked={proxyEnabled}
                        onChange={(e) => setProxyEnabled(e.target.checked)}
                        disabled={isLoading || isSaving}
                    />
                    <span className="text-sm text-gray-700">启用 HTTP/HTTPS 代理</span>
                </label>

                {proxyEnabled && (
                    <div className="mt-6">
                        <label htmlFor="proxy-url" className="block text-md font-medium text-gray-800 mb-2">代理地址</label>
                        <input
                            id="proxy-url"
                            type="text"
                            value={proxyUrl}
                            onChange={(e) => setProxyUrl(e.target.value)}
                            placeholder="http://127.0.0.1:33210"
                            className="w-full bg-transparent px-1 py-2 border-b-2 border-gray-300 focus:border-[#222222] focus:outline-none transition-colors"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500 mt-2">保存后将同步更新后端代理配置，无需手动修改环境变量。</p>
                    </div>
                )}

                {isLoading && (
                    <p className="mt-4 text-sm text-gray-500">正在加载当前代理配置…</p>
                )}
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
                    disabled={isSaving || isLoading}
                    className={`w-full bg-[#222222] text-white font-medium tracking-widest uppercase py-3 px-4 transition-all duration-300 ease-in-out ${
                        isSaving || isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#B8860B] transform hover:scale-105'
                    }`}
                >
                    {isSaving ? '保存中…' : '保存配置'}
                </button>
                {saveMessage && (
                    <p className={`mt-3 text-center text-sm font-medium ${saveMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                        {saveMessage}
                    </p>
                )}
            </motion.div>
        </div>
    </motion.div>
  );
};

export default SettingsPage;