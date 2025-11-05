"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysisController_1 = require("../controllers/analysisController");
const multerConfig_1 = require("../utils/multerConfig");
const router = (0, express_1.Router)();
// POST /api/analysis/upload
// The 'chunk' field name in upload.single('chunk') must match the field name in the frontend form-data.
router.post('/upload', multerConfig_1.upload.single('chunk'), analysisController_1.uploadChunk);
// POST /api/analysis/analyze
router.post('/analyze', analysisController_1.triggerAnalysis);
exports.default = router;
