import { Router } from 'express';
import { uploadChunk, triggerAnalysis } from '../controllers/analysisController';
import { upload } from '../utils/multerConfig';

const router = Router();

// POST /api/analysis/upload
// The 'chunk' field name in upload.single('chunk') must match the field name in the frontend form-data.
router.post('/upload', upload.single('chunk'), uploadChunk);

// POST /api/analysis/analyze
router.post('/analyze', triggerAnalysis);

export default router;
