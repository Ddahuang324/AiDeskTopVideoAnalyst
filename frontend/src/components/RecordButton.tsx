import React, { useState } from 'react';
import recordingService from '../services/recordingService';
import { startAnalysis, generateAiSummary } from '../services/apiService';
import { useSummary } from '../stores/summaryStore';
import { usePromptStore } from '../stores/promptStore';
import { CustomPrompt } from '../../types';
// import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom for navigation

interface RecordButtonProps {
  selectedPromptId: number | null;
  onAnalysisComplete?: (result: any) => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ 
  selectedPromptId, 
  onAnalysisComplete 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setSummary } = useSummary();
  const { getActivePrompt } = usePromptStore();
  // const navigate = useNavigate();

  const handleStartRecording = async () => {
    console.log('[RecordButton] Starting recording...');
    try {
      await recordingService.start();
      setIsRecording(true);
      console.log('[RecordButton] Recording started successfully.');
    } catch (error) {
      console.error('[RecordButton] Failed to start recording:', error);
    }
  };

  const handleStopAndAnalyze = async () => {
    console.log('[RecordButton] Stopping recording and analyzing...');
    setIsLoading(true);

    try {
      await recordingService.stop();
      const recordedChunks = recordingService.getRecordedChunks();
      console.log(`[RecordButton] Recording stopped. Uploaded ${recordedChunks.length} chunks`);
      
      console.log('[RecordButton] Starting basic analysis...');
      const basicResult = await startAnalysis();
      console.log('[RecordButton] Basic analysis Result:', basicResult);
      
      // 存储基础分析结果
      setSummary(basicResult.observations, basicResult.activityCards);
      
      // 获取当前选中的提示词
      const activePrompt = getActivePrompt();
      if (!activePrompt) {
        throw new Error('No prompt selected');
      }
      
      console.log('[RecordButton] Generating AI summary with prompt:', activePrompt.title);
      
      // 调用两阶段AI总结生成
      const aiSummaryResult = await generateAiSummary({
        stage1SystemPrompt: undefined, // 使用默认的阶段1系统提示词
        customSummaryPrompt: activePrompt.content,
        customJsonPrompt: '请生成结构化的分析报告，包含标题、总结、标签、关键发现、生产力评分和后续行动建议。', // 默认的JSON生成提示词
        activityCards: basicResult.activityCards,
        observations: basicResult.observations,
        videoMeta: { durationSec: 0 }, // 可以后续完善
      });
      
      console.log('[RecordButton] AI summary generated:', aiSummaryResult);
      
      // 调用完成回调
      if (onAnalysisComplete) {
        onAnalysisComplete({
          basic: basicResult,
          aiSummary: aiSummaryResult
        });
      }
      
      // navigate('/summary'); // Navigate to summary page
    } catch (error) {
      console.error('[RecordButton] Analysis failed:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  return (
    <div>
      {!isRecording ? (
        <button onClick={handleStartRecording} disabled={isLoading}>
          {isLoading ? 'Starting...' : 'Start Recording'}
        </button>
      ) : (
        <button onClick={handleStopAndAnalyze} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Stop and Analyze'}
        </button>
      )}
      {isLoading && <p>Analysis in progress, please wait...</p>}
    </div>
  );
};

export default RecordButton;
