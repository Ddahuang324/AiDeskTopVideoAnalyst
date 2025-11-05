import type { FC } from 'react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useRecordingStore } from '../stores/recordingStore';
import { useSummaryStore } from '../stores/summaryStore';
import { usePromptStore } from '../stores/promptStore';
import { recordingService } from '../services/recordingService';

const RecordButton: FC = () => {
  const { isRecording, startRecording, stopRecording } = useRecordingStore();
  const { setSummary } = useSummaryStore();
  const { prompts } = usePromptStore();
  const navigate = useNavigate();

  const handleToggleRecording = async () => {
    if (isRecording) {
      message.loading({ content: '正在分析您的工作流...\n这可能需要几分钟时间。' , duration: 0 });
      // For now, we'll use the first prompt if available, or a default one.
      const selectedPrompt = prompts[0]?.text || '请总结一下我的活动。';

      try {
        const analysisResult = await recordingService.stop(selectedPrompt);
        setSummary(analysisResult); // This needs to be adjusted based on actual data structure
        message.destroy();
        navigate('/summary');
      } catch (error) {
        console.error('Failed to analyze workflow:', error);
        message.error('分析失败，请检查控制台获取更多信息。');
      }
      stopRecording();
    } else {
      await recordingService.start();
      startRecording();
    }
  };

  return (
    <Button type="primary" danger={isRecording} onClick={handleToggleRecording}>
      {isRecording ? '停止并分析' : '开始录制'}
    </Button>
  );
};

export default RecordButton;

