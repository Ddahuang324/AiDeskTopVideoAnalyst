import React, { useState } from 'react';
import recordingService from '../services/recordingService';
import { startAnalysis } from '../services/apiService';
import { useSummary } from '../stores/summaryStore';
// import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom for navigation

const RecordButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setSummary } = useSummary();
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
      
      console.log('[RecordButton] Starting analysis...');
      const result = await startAnalysis();
      console.log('[RecordButton] Analysis Result:', result);
      setSummary(result.observations, result.activityCards);
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
