import { Request, Response } from 'express';
import { stitchVideos, getVideoDuration, cleanupAnalysisArtifacts } from '../services/videoService';
import { 
  uploadVideo, 
  transcribeVideo, 
  generateActivityCards,
  generateAiSummaryResult,
  ActivityCard,
  Observation,
  AnalysisResultOutput
} from '../services/geminiService';
import { GeminiModel } from '../config/geminiConfig';

export const uploadChunk = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded.' });
  }

  console.log(`Received chunk: ${req.file.filename}`);
  res.status(200).send({ message: 'Chunk uploaded successfully', filename: req.file.filename });
};

export const triggerAnalysis = async (req: Request, res: Response) => {
  console.log('Triggering analysis...');

  try {
    // Get model name from request body, default to FLASH if not provided
    const requestedModel = req.body?.modelName as string | undefined;
    const apiKey = req.body?.apiKey as string | undefined;
    
    if (!apiKey) {
      return res.status(400).json({ message: 'API Key is required. Please configure it in settings.' });
    }

    let selectedModel: GeminiModel = GeminiModel.FLASH; // Default
    
    // Validate and map the requested model
    if (requestedModel) {
      const modelValues = Object.values(GeminiModel) as string[];
      if (modelValues.includes(requestedModel)) {
        selectedModel = requestedModel as GeminiModel;
        console.log(`✅ Using user-selected model: ${selectedModel}`);
      } else {
        console.warn(`⚠️ Invalid model requested: ${requestedModel}, using default: ${selectedModel}`);
      }
    } else {
      console.log(`ℹ️ No model specified, using default: ${selectedModel}`);
    }

    const stitchedVideoPath = await stitchVideos();
    const videoDuration = await getVideoDuration(stitchedVideoPath);
    const fileUri = await uploadVideo(stitchedVideoPath, apiKey);
    const observations = await transcribeVideo(fileUri, videoDuration, selectedModel, apiKey);
    const activityCards = await generateActivityCards(observations, selectedModel, apiKey);

    res.status(200).json({ observations, activityCards });
  } catch (error) {
    console.error('Analysis pipeline failed:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error during analysis.';
    res.status(500).json({ message: 'Analysis failed', error: message });
  } finally {
    try {
      await cleanupAnalysisArtifacts();
    } catch (cleanupError) {
      console.error('Failed to clean analysis artifacts:', cleanupError);
    }
  }
};

/**
 * 生成AI总结结果（两阶段提示词工程）
 * 接收自定义提示词、活动卡片、观察数据，输出符合AnalysisResult格式的JSON
 */
export const generateAiSummary = async (req: Request, res: Response) => {
  console.log('🚀 Generating AI summary with custom prompts...');

  try {
    const {
      stage1SystemPrompt,   // 阶段1：系统提示词（可选，默认使用内置）
      customSummaryPrompt,  // 阶段1：总结提示词
      customJsonPrompt,     // 阶段2：JSON生成提示词
      activityCards,        // 从前一步得到的活动卡片
      observations,         // 从前一步得到的观察数据
      videoMeta,            // 视频元数据 { durationSec?, fileName? }
      modelName,            // 用户选择的模型
      apiKey,               // API密钥
    } = req.body;

    // 参数验证
    if (!apiKey) {
      return res.status(400).json({ message: 'API Key is required.' });
    }

    if (!customSummaryPrompt) {
      return res.status(400).json({ message: 'customSummaryPrompt is required.' });
    }

    if (!customJsonPrompt) {
      return res.status(400).json({ message: 'customJsonPrompt is required.' });
    }

    if (!activityCards || !Array.isArray(activityCards)) {
      return res.status(400).json({ message: 'activityCards array is required.' });
    }

    if (!observations || !Array.isArray(observations)) {
      return res.status(400).json({ message: 'observations array is required.' });
    }

    // 验证模型
    let selectedModel: GeminiModel = GeminiModel.FLASH;
    if (modelName) {
      const modelValues = Object.values(GeminiModel) as string[];
      if (modelValues.includes(modelName)) {
        selectedModel = modelName as GeminiModel;
        console.log(`✅ Using user-selected model: ${modelName}`);
      } else {
        console.warn(`⚠️ Invalid model: ${modelName}, using default`);
      }
    }

    // 调用两阶段提示词工程
    const result: AnalysisResultOutput = await generateAiSummaryResult(
      stage1SystemPrompt,   // 阶段1系统提示词
      customSummaryPrompt,
      customJsonPrompt,
      activityCards as ActivityCard[],
      observations as Observation[],
      videoMeta,
      selectedModel,
      apiKey
    );

    console.log('✅ AI summary generated successfully');
    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('AI summary generation failed:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error during summary generation.';
    res.status(500).json({
      success: false,
      message: 'Summary generation failed',
      error: message
    });
  }
};
