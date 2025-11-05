import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Page, AnalysisResult, CustomPrompt } from './types';
import { MOCK_ANALYSIS_RESULTS, MOCK_CUSTOM_PROMPTS, AI_MODELS } from './constants';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import GalleryPage from './components/GalleryPage';
import ProjectDetailPage from './components/ProjectDetailPage';
import SettingsPage from './components/SettingsPage';
import recordingService from './src/services/recordingService';
import { startAnalysis } from './src/services/apiService';
import { useSummary } from './src/stores/summaryStore';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>(MOCK_ANALYSIS_RESULTS);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);
  const { setSummary } = useSummary();

  // Lifted state for prompts
  const [prompts, setPrompts] = useState<CustomPrompt[]>(MOCK_CUSTOM_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(() => {
    return prompts.find((p: CustomPrompt) => p.isDefault)?.id ?? prompts[0]?.id ?? null;
  });

  const handleSetDefaultPrompt = (id: number) => {
    const newPrompts = prompts.map((p: CustomPrompt) => ({ ...p, isDefault: p.id === id }));
    setPrompts(newPrompts);
  };

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
      
      console.log('[App] Starting analysis...');
  const result = await startAnalysis({ modelName: selectedModel });
      console.log('[App] Analysis Result:', result);
      setSummary(result.observations, result.activityCards);

      const selectedPrompt = prompts.find((p: CustomPrompt) => p.id === selectedPromptId);
      const newAnalysis: AnalysisResult = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('zh-CN'),
        title: selectedPrompt ? `${selectedPrompt.title} 分析` : '新录制的分析',
        summary: result.observations.map(o => o.description).join(' ') || '分析完成',
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', // Placeholder
        tags: selectedPrompt ? [selectedPrompt.title, '自动生成'] : ['新录制', '自动生成'],
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
        return <HomePage 
                  key="home" 
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                  recordingState={recordingState} 
                  prompts={prompts}
                  selectedPromptId={selectedPromptId}
                  onSelectPrompt={setSelectedPromptId}
                />;
      case Page.History:
        return <GalleryPage key="history" analyses={analysisHistory} onAnalysisClick={handleSelectAnalysis} />;
      case Page.Settings:
        return <SettingsPage 
                  key="settings" 
                  prompts={prompts}
                  onSetPrompts={setPrompts}
                  onSetDefaultPrompt={handleSetDefaultPrompt}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                />;
      default:
        return <HomePage 
                  key="home" 
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                  recordingState={recordingState} 
                  prompts={prompts}
                  selectedPromptId={selectedPromptId}
                  onSelectPrompt={setSelectedPromptId}
                />;
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

export default App;