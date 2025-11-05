"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerAnalysis = exports.uploadChunk = void 0;
const videoService_1 = require("../services/videoService");
const geminiService_1 = require("../services/geminiService");
const geminiConfig_1 = require("../config/geminiConfig");
const uploadChunk = (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded.' });
    }
    console.log(`Received chunk: ${req.file.filename}`);
    res.status(200).send({ message: 'Chunk uploaded successfully', filename: req.file.filename });
};
exports.uploadChunk = uploadChunk;
const triggerAnalysis = async (req, res) => {
    console.log('Triggering analysis...');
    try {
        // Get model name from request body, default to FLASH if not provided
        const requestedModel = req.body?.modelName;
        let selectedModel = geminiConfig_1.GeminiModel.FLASH; // Default
        // Validate and map the requested model
        if (requestedModel) {
            const modelValues = Object.values(geminiConfig_1.GeminiModel);
            if (modelValues.includes(requestedModel)) {
                selectedModel = requestedModel;
                console.log(`✅ Using user-selected model: ${selectedModel}`);
            }
            else {
                console.warn(`⚠️ Invalid model requested: ${requestedModel}, using default: ${selectedModel}`);
            }
        }
        else {
            console.log(`ℹ️ No model specified, using default: ${selectedModel}`);
        }
        const stitchedVideoPath = await (0, videoService_1.stitchVideos)();
        const videoDuration = await (0, videoService_1.getVideoDuration)(stitchedVideoPath);
        const fileUri = await (0, geminiService_1.uploadVideo)(stitchedVideoPath);
        const observations = await (0, geminiService_1.transcribeVideo)(fileUri, videoDuration, selectedModel);
        const activityCards = await (0, geminiService_1.generateActivityCards)(observations, selectedModel);
        res.status(200).json({ observations, activityCards });
    }
    catch (error) {
        console.error('Analysis pipeline failed:', error);
        const message = error instanceof Error ? error.message : 'Unexpected error during analysis.';
        res.status(500).json({ message: 'Analysis failed', error: message });
    }
    finally {
        try {
            await (0, videoService_1.cleanupAnalysisArtifacts)();
        }
        catch (cleanupError) {
            console.error('Failed to clean analysis artifacts:', cleanupError);
        }
    }
};
exports.triggerAnalysis = triggerAnalysis;
