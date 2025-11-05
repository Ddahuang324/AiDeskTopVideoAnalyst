import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Page, AnalysisResult } from './types';
import { MOCK_ANALYSIS_RESULTS, AI_MODELS } from './constants';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import GalleryPage from './components/GalleryPage';
import ProjectDetailPage from './components/ProjectDetailPage';
import SettingsPage from './components/SettingsPage';
import PromptManager from './src/components/PromptManager';
import recordingService from './src/services/recordingService';
import { startAnalysis, generateAiSummary } from './src/services/apiService';
import { useSummary } from './src/stores/summaryStore';
import { PromptProvider, usePromptStore } from './src/stores/promptStore';

// Internal App component that uses the prompt store
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>(MOCK_ANALYSIS_RESULTS);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);
  useEffect(() => {
    const savedModel = localStorage.getItem('gemini_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);
  const { setSummary } = useSummary();
  const { prompts, activePromptId, setActivePrompt, getActivePrompt } = usePromptStore();

  const handleSelectAnalysis = (analysis: AnalysisResult) => {
    setSelectedAnalysis(analysis);
  };

  const handleCloseAnalysis = () => {
    setSelectedAnalysis(null);
  };

  const handleStartRecording = async () => {
    if (recordingState !== 'idle') return;

    setRecordingState('recording');
    try {
      console.log('[App] Starting recording...');
      await recordingService.start();
      console.log('[App] Recording started successfully.');
    } catch (error) {
      console.error('[App] Failed to start recording:', error);
      setRecordingState('idle');
    }
  };

  const handleStopRecording = async () => {
    if (recordingState !== 'recording') return;

    setRecordingState('processing');
    try {
      await recordingService.stop();
      const recordedChunks = recordingService.getRecordedChunks();
      console.log(`[App] Recording stopped. Uploaded ${recordedChunks.length} chunks`);

      console.log('[App] Starting basic analysis...');
      const basicResult = await startAnalysis({ modelName: selectedModel });
      console.log('[App] Basic analysis Result:', basicResult);
      setSummary(basicResult.observations, basicResult.activityCards);

      // 获取当前选中的提示词
      const activePrompt = getActivePrompt();
      if (!activePrompt) {
        throw new Error('No prompt selected');
      }

      console.log('[App] Generating AI summary with prompt:', activePrompt.title);

      // 调用两阶段AI总结生成
      const aiSummaryResult = await generateAiSummary({
        stage1SystemPrompt: undefined, // 使用默认的阶段1系统提示词
        customSummaryPrompt: activePrompt.content,
        customJsonPrompt: '请生成结构化的分析报告，包含标题、总结、标签、关键发现、生产力评分和后续行动建议。',
        activityCards: basicResult.activityCards,
        observations: basicResult.observations,
        videoMeta: { durationSec: 0 }, // 可以后续完善
        modelName: selectedModel,
      });

      console.log('[App] AI summary generated:', aiSummaryResult);

      // 创建分析历史记录
      const newAnalysis: AnalysisResult = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('zh-CN'),
        title: aiSummaryResult.title || `${activePrompt.title} 分析`,
        summary: aiSummaryResult.summary || 'AI分析完成',
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        tags: aiSummaryResult.tags || [activePrompt.title, 'AI生成'],
        keyFindings: aiSummaryResult.keyFindings,
        productivityScore: aiSummaryResult.productivityScore,
        nextActions: aiSummaryResult.nextActions,
        customPromptUsed: activePrompt.content,
        customPromptId: activePrompt.id,
      };

      setAnalysisHistory((prev: AnalysisResult[]) => [newAnalysis, ...prev]);
      setCurrentPage(Page.History);
    } catch (error) {
      console.error('[App] Analysis failed:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRecordingState('idle');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return (
          <HomePage
            key="home"
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            recordingState={recordingState}
            prompts={prompts}
            selectedPromptId={activePromptId}
            onSelectPrompt={setActivePrompt}
          />
        );
      case Page.History:
        return (
          <GalleryPage
            key="history"
            analyses={analysisHistory}
            onAnalysisClick={handleSelectAnalysis}
          />
        );
      case Page.Settings:
        return (
          <SettingsPage
            key="settings"
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        );
      case Page.PromptManager:
        return <PromptManager key="prompt-manager" />;
      default:
        return (
          <HomePage
            key="home"
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            recordingState={recordingState}
            prompts={prompts}
            selectedPromptId={activePromptId}
            onSelectPrompt={setActivePrompt}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        <AnimatePresence mode="wait">
          {selectedAnalysis ? (
            <ProjectDetailPage
              key="project-detail"
              analysis={selectedAnalysis}
              onClose={handleCloseAnalysis}
            />
          ) : (
            renderPage()
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Main App component with PromptProvider
const App: React.FC = () => {
  return (
    <PromptProvider>
      <AppContent />
    </PromptProvider>
  );
};

export default App;