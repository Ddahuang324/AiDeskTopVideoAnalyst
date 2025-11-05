import { Router } from 'express';
import { uploadChunk, triggerAnalysis, generateAiSummary } from '../controllers/analysisController';
import { upload } from '../utils/multerConfig';

const router = Router();

// POST /api/analysis/upload
// The 'chunk' field name in upload.single('chunk') must match the field name in the frontend form-data.
router.post('/upload', upload.single('chunk'), uploadChunk);

// POST /api/analysis/analyze
router.post('/analyze', triggerAnalysis);

// POST /api/analysis/ai-summary
// 生成AI总结（两阶段提示词工程）
// Body: { customSummaryPrompt, customJsonPrompt, activityCards, observations, videoMeta, modelName, apiKey }
router.post('/ai-summary', generateAiSummary);

export default router;
