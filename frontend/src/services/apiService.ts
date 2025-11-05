import { ActivityCard, Observation } from "./geminiService";
import { AnalysisResult } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface StartAnalysisOptions {
  modelName?: string;
  apiKey?: string;
}

interface GenerateAiSummaryOptions {
  stage1SystemPrompt?: string;  // 阶段1系统提示词（可选）
  customSummaryPrompt: string;  // 阶段1提示词
  customJsonPrompt: string;     // 阶段2提示词
  activityCards: ActivityCard[];
  observations: Observation[];
  videoMeta?: { durationSec?: number; fileName?: string };
  modelName?: string;
  apiKey?: string;
}

/**
 * Uploads a single video chunk to the backend.
 * @param {Blob} chunk The video chunk to upload.
 * @returns {Promise<any>} The response from the server.
 */
export const uploadVideoChunk = async (chunk: Blob): Promise<any> => {
  const formData = new FormData();
  formData.append('chunk', chunk, `chunk-${Date.now()}.webm`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload video chunk.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading video chunk:', error);
    throw error;
  }
};

/**
 * Signals the backend to start the analysis process.
 * @returns {Promise<{ observations: Observation[]; activityCards: ActivityCard[] }>} The analysis result.
 */
export const startAnalysis = async (
  options: StartAnalysisOptions = {}
): Promise<{ observations: Observation[]; activityCards: ActivityCard[] }> => {
  try {
    // Get API Key from localStorage if not provided in options
    const apiKey = options.apiKey || localStorage.getItem('gemini_api_key') || '';
    
    const payload = {
      ...(options.modelName && { modelName: options.modelName }),
      ...(apiKey && { apiKey: apiKey })
    };

    const response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start analysis.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting analysis:', error);
    throw error;
  }
};

/**
 * 调用两阶段提示词工程生成AI总结
 * @param {GenerateAiSummaryOptions} options 包含两阶段提示词和分析数据
 * @returns {Promise<AnalysisResult>} 符合分析历史页面格式的结果
 */
export const generateAiSummary = async (
  options: GenerateAiSummaryOptions
): Promise<AnalysisResult> => {
  try {
    const apiKey = options.apiKey || localStorage.getItem('gemini_api_key') || '';
    
    if (!apiKey) {
      throw new Error('API Key is required. Please configure it in settings.');
    }

    const payload = {
      stage1SystemPrompt: options.stage1SystemPrompt,
      customSummaryPrompt: options.customSummaryPrompt,
      customJsonPrompt: options.customJsonPrompt,
      activityCards: options.activityCards,
      observations: options.observations,
      videoMeta: options.videoMeta,
      modelName: options.modelName,
      apiKey: apiKey,
    };

    const response = await fetch(`${API_BASE_URL}/api/analysis/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate AI summary.');
    }

    const result = await response.json();
    // 返回的是 { success: true, data: AnalysisResult }
    return result.data as AnalysisResult;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw error;
  }
};