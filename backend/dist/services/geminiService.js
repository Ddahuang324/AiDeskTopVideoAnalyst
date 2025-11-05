"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateActivityCards = exports.transcribeVideo = exports.uploadVideo = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Server-side File Manager for uploading large media files
// Ref: https://github.com/google/generative-ai-js
const server_1 = require("@google/generative-ai/server");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Optional proxy support for restricted networks
const undici_1 = require("undici");
const geminiConfig_1 = require("../config/geminiConfig");
// Configure proxy if provided
const proxyUrl = process.env.GEMINI_HTTP_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
    try {
        (0, undici_1.setGlobalDispatcher)(new undici_1.ProxyAgent(proxyUrl));
        console.log(`[Gemini] Using proxy for outbound requests: ${proxyUrl}`);
    }
    catch (e) {
        console.warn("[Gemini] Failed to configure proxy agent:", e);
    }
}
const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
    console.warn("[Gemini] GEMINI_API_KEY is not set. Requests will fail until a valid key is provided.");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
// Capacity error codes that should trigger model fallback
const CAPACITY_ERROR_CODES = new Set([403, 429, 503]);
// Initialize File Manager if available (Node/server-only)
let fileManager = null;
try {
    if (apiKey) {
        fileManager = new server_1.GoogleAIFileManager(apiKey);
    }
}
catch (error) {
    console.warn("[Gemini] Could not initialize GoogleAIFileManager, will try fallbacks:", error);
}
const stripMarkdownFence = (payload) => payload.replace(/```json\s*|```/g, "").trim();
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com";
const VIDEO_MIME_TYPE = "video/mp4";
const FILE_POLL_INTERVAL_MS = 1500;
const FILE_POLL_TIMEOUT_MS = 2 * 60 * 1000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const appendApiKey = (url) => {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is required to call Gemini APIs.");
    }
    return url.includes("?") ? `${url}&key=${apiKey}` : `${url}?key=${apiKey}`;
};
const isNetworkError = (error) => {
    if (error instanceof Error) {
        return /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ECONNREFUSED/i.test(error.message);
    }
    return false;
};
const waitForGeminiFileActive = async (fileName, manager) => {
    const deadline = Date.now() + FILE_POLL_TIMEOUT_MS;
    let lastState;
    while (Date.now() < deadline) {
        try {
            let file = null;
            if (manager) {
                file = (await manager.getFile(fileName));
            }
            else {
                const statusUrl = appendApiKey(`${GEMINI_API_BASE_URL}/v1beta/${fileName}`);
                const response = await fetch(statusUrl);
                if (!response.ok) {
                    const body = await response.text();
                    throw new Error(`Gemini file status error (${response.status}): ${body || response.statusText}`);
                }
                file = (await response.json());
            }
            if (!file) {
                throw new Error("Gemini file status response was empty.");
            }
            if (file.state === "ACTIVE" && file.uri) {
                return file;
            }
            if (file.state === "FAILED") {
                const reason = file.error?.message || "Unknown error.";
                throw new Error(`Gemini file processing failed: ${reason}`);
            }
            if (file.state && file.state !== lastState) {
                console.log(`[Gemini] File ${fileName} state: ${file.state}`);
                lastState = file.state;
            }
        }
        catch (statusError) {
            throw statusError;
        }
        await sleep(FILE_POLL_INTERVAL_MS);
    }
    throw new Error(`Timed out waiting for Gemini file ${fileName} to become ACTIVE.`);
};
const initiateResumableUpload = async (displayName) => {
    const initUrl = appendApiKey(`${GEMINI_API_BASE_URL}/upload/v1beta/files`);
    const metadata = {
        file: {
            display_name: displayName,
            mime_type: VIDEO_MIME_TYPE,
        },
    };
    const response = await fetch(initUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Protocol": "resumable",
        },
        body: JSON.stringify(metadata),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to initiate resumable upload (${response.status}): ${body || response.statusText}`);
    }
    const uploadUrl = response.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
        throw new Error("Gemini resumable upload did not return an upload URL.");
    }
    return uploadUrl;
};
const completeResumableUpload = async (uploadUrl, filePath) => {
    const stats = fs_1.default.statSync(filePath);
    const fileStream = fs_1.default.createReadStream(filePath);
    const uploadInit = {
        method: "POST",
        headers: {
            "Content-Length": stats.size.toString(),
            "Content-Type": VIDEO_MIME_TYPE,
            "X-Goog-Upload-Command": "upload, finalize",
            "X-Goog-Upload-Offset": "0",
        },
        body: fileStream,
    };
    // Required by Undici when streaming a request body
    Reflect.set(uploadInit, "duplex", "half");
    const response = await fetch(uploadUrl, uploadInit);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Gemini resumable upload failed (${response.status}): ${body || response.statusText}`);
    }
    const payload = (await response.json());
    if (!payload?.file?.name) {
        throw new Error("Gemini resumable upload succeeded but returned no file metadata.");
    }
    return payload.file;
};
const uploadVideoWithResumable = async (filePath, displayName) => {
    console.log("[Gemini] Using manual resumable upload flow.");
    const uploadUrl = await initiateResumableUpload(displayName);
    const uploadedFile = await completeResumableUpload(uploadUrl, filePath);
    const activeFile = await waitForGeminiFileActive(uploadedFile.name, null);
    if (!activeFile.uri) {
        throw new Error("Gemini file became ACTIVE but no URI was returned.");
    }
    console.log(`[Gemini] Resumable upload successful. File URI: ${activeFile.uri}`);
    return activeFile.uri;
};
const uploadVideoWithFileManager = async (filePath, displayName, manager) => {
    console.log("[Gemini] Uploading via GoogleAIFileManager.");
    const uploadResponse = await manager.uploadFile(filePath, {
        mimeType: VIDEO_MIME_TYPE,
        displayName,
    });
    const fileName = uploadResponse?.file?.name;
    if (!fileName) {
        throw new Error("GoogleAIFileManager returned no file name.");
    }
    const activeFile = await waitForGeminiFileActive(fileName, manager);
    if (!activeFile.uri) {
        throw new Error("Gemini file became ACTIVE but provided no URI.");
    }
    console.log(`[Gemini] Upload successful. File URI: ${activeFile.uri}`);
    return activeFile.uri;
};
/**
 * Uploads a video file to the Gemini File API.
 * @param {string} filePath The path to the video file to upload.
 * @returns {Promise<string>} A promise that resolves with the `file.uri` from the API response.
 */
const uploadVideo = async (filePath) => {
    console.log(`Uploading video: ${filePath}`);
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`Video file not found: ${filePath}`);
    }
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Set it in your environment to use Gemini uploads.");
    }
    const displayName = `workflow-video-${path_1.default.basename(filePath)}`;
    let fileManagerError = null;
    if (fileManager) {
        try {
            return await uploadVideoWithFileManager(filePath, displayName, fileManager);
        }
        catch (error) {
            fileManagerError = error;
            console.error("[Gemini] File manager upload failed, falling back to manual resumable flow:", error);
        }
    }
    else {
        console.warn("[Gemini] GoogleAIFileManager unavailable. Falling back to manual resumable upload.");
    }
    try {
        return await uploadVideoWithResumable(filePath, displayName);
    }
    catch (fallbackError) {
        console.error("[Gemini] Resumable upload failed:", fallbackError);
        const messages = [];
        messages.push(fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        if (fileManagerError instanceof Error) {
            messages.push(`File manager error: ${fileManagerError.message}`);
        }
        if (isNetworkError(fallbackError) || isNetworkError(fileManagerError)) {
            messages.push("Network error detected. Ensure outbound HTTPS access to generativelanguage.googleapis.com or configure GEMINI_HTTP_PROXY/HTTPS_PROXY.");
        }
        throw new Error(`Failed to upload video to Gemini. ${messages.join(" | ")}`);
    }
};
exports.uploadVideo = uploadVideo;
/**
 * Transcribes a video into a series of timestamped observations using a detailed prompt.
 * @param {string} fileUri The URI of the uploaded video file.
 * @param {number} videoDuration The duration of the video in seconds.
 * @param {GeminiModel} userSelectedModel The model selected by the user in the frontend.
 * @returns {Promise<any>} A promise that resolves with the parsed JSON array of observations.
 */
const transcribeVideo = async (fileUri, videoDuration, userSelectedModel) => {
    const durationMinutes = Math.floor(videoDuration / 60);
    const durationSeconds = Math.round(videoDuration % 60);
    const durationString = `${String(durationMinutes).padStart(2, "0")}:${String(durationSeconds).padStart(2, "0")}`;
    const prompt = `
# Video Transcription Prompt

Your job is to transcribe someone's computer usage into a small number of meaningful activity segments.

## CRITICAL: This video is exactly ${durationString} long. ALL timestamps MUST be within 00:00 to ${durationString}.

## Golden Rule: Aim for 3-5 segments per 15-minute video (fewer is better than more)

## Core Principles:
1. **Group by purpose, not by platform** - If someone is planning a trip across 5 websites, that's ONE segment
2. **Include interruptions in the description** - Don't create segments for brief distractions
3. **Only split when context changes for 2-3+ minutes** - Quick checks don't count as context switches
4. **Combine related activities** - Multiple videos on the same topic = one segment
5. **Think in terms of "sessions"** - What would you tell a friend you spent time doing?
6. **Idle detection** - if the screen stays exactly the same for 5+ minutes, make sure to note that within the observation that the user was idle during that period and not performing and actions, but still be specific about what's currently on the screen.

## When to create a new segment:
Only when the user switches to a COMPLETELY different purpose for MORE than 2-3 minutes:
- Entertainment → Work
- Learning → Shopping  
- Project A → Project B
- Topic X → Unrelated Topic Y

## Format:
\`\`\`json
[
  {
    "startTimestamp": "MM:SS",
    "endTimestamp": "MM:SS", 
    "description": "1-3 sentences describing what the user accomplished"
  }
]
\`\`\`

Remember: The goal is to tell the story of what someone accomplished, not log every click. Group aggressively and only split when they truly change what they're doing for an extended period. If an activity is less than 2-3 minutes, it almost never deserves its own segment.
`;
    console.log("Starting video transcription with Gemini...");
    // Use user-selected model or fallback to default preference
    let orderedModels;
    if (userSelectedModel) {
        // User selected a specific model - use it with standard fallbacks
        console.log(`🎯 User selected model: ${geminiConfig_1.GEMINI_MODELS[userSelectedModel].displayName}`);
        orderedModels = [
            userSelectedModel,
            // Add fallbacks in order of capability
            ...[geminiConfig_1.GeminiModel.FLASH, geminiConfig_1.GeminiModel.FLASH_LITE, geminiConfig_1.GeminiModel.PRO].filter(m => m !== userSelectedModel)
        ];
    }
    else {
        // No user preference, use default configuration
        orderedModels = (0, geminiConfig_1.getOrderedModels)(geminiConfig_1.DEFAULT_TRANSCRIPTION_PREFERENCE);
    }
    let lastError = null;
    // Try models in order with fallback
    for (const modelName of orderedModels) {
        try {
            console.log(`Attempting transcription with model: ${geminiConfig_1.GEMINI_MODELS[modelName].displayName}`);
            const transcriptionSchema = {
                type: generative_ai_1.SchemaType.ARRAY,
                items: {
                    type: generative_ai_1.SchemaType.OBJECT,
                    properties: {
                        startTimestamp: { type: generative_ai_1.SchemaType.STRING },
                        endTimestamp: { type: generative_ai_1.SchemaType.STRING },
                        description: { type: generative_ai_1.SchemaType.STRING },
                    },
                    required: ["startTimestamp", "endTimestamp", "description"],
                },
            };
            const model = genAI.getGenerativeModel({ model: modelName });
            if (!fileUri || (!fileUri.startsWith("https://") && !fileUri.startsWith("gs://"))) {
                throw new Error(`Invalid Gemini file URI: ${fileUri}. Expected the upload step to return a hosted URI from generativelanguage.googleapis.com.`);
            }
            const parts = [
                { fileData: { mimeType: VIDEO_MIME_TYPE, fileUri } },
                { text: prompt },
            ];
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts,
                    },
                ],
                generationConfig: {
                    ...geminiConfig_1.GENERATION_CONFIGS.transcription,
                    responseSchema: transcriptionSchema,
                },
            });
            const responseText = result.response.text();
            const jsonString = stripMarkdownFence(responseText);
            const parsed = JSON.parse(jsonString);
            console.log(`✅ Transcription successful with ${geminiConfig_1.GEMINI_MODELS[modelName].displayName}`);
            return parsed;
        }
        catch (error) {
            // Preserve last error for final reporting
            lastError = error;
            // Detailed diagnostic logging to aid troubleshooting
            console.error("Error calling Gemini API:", error);
            if (error.response && error.response.status) {
                console.error(`Gemini API HTTP Status: ${error.response.status}`);
            }
            if (error.message) {
                console.error(`Gemini API Error Message: ${error.message}`);
            }
            if (error.result && error.result.response && error.result.response.candidates === undefined) {
                console.error("Gemini API response did not contain candidates, possibly an error from the API.");
                try {
                    console.error("Full Gemini API error response (if available):", JSON.stringify(error.result.response, null, 2));
                }
                catch (e) {
                    // ignore JSON stringify errors
                }
            }
            const msg = error?.message || String(error);
            console.error(`❌ Error with ${geminiConfig_1.GEMINI_MODELS[modelName].displayName}:`, msg);
            // More helpful diagnostics for network issues often seen in restricted networks
            if (msg.includes("fetch failed") || /ENOTFOUND|ECONNRESET|ETIMEDOUT/i.test(msg)) {
                console.error("Network error reaching generativelanguage.googleapis.com. If you're in a restricted network, set GEMINI_HTTP_PROXY/HTTPS_PROXY, try a VPN/proxy, or use Vertex AI with regional endpoints.");
            }
            // Check if we should try fallback model
            const isCapacityError = error.status && CAPACITY_ERROR_CODES.has(error.status);
            const isLastModel = modelName === orderedModels[orderedModels.length - 1];
            if (!isCapacityError || isLastModel) {
                // If it's not a capacity error, or this is the last model, break to throw final error
                break;
            }
            console.log(`↘️ Falling back to next model...`);
        }
    }
    // All models failed
    throw new Error(`Failed to transcribe video after trying all models: ${lastError?.message || "Unknown error"}`);
};
exports.transcribeVideo = transcribeVideo;
/**
 * Generates higher-level activity cards from the list of observations.
 * @param {Observation[]} observations The observations returned by the transcription step.
 * @param {GeminiModel} userSelectedModel The model selected by the user in the frontend.
 * @returns {Promise<ActivityCard[]>} Structured activity cards ready for the frontend.
 */
const generateActivityCards = async (observations, userSelectedModel) => {
    if (!observations.length) {
        throw new Error("No observations provided for activity card generation.");
    }
    const observationLog = observations
        .map((obs) => `[${obs.startTimestamp} - ${obs.endTimestamp}]: ${obs.description.replace(/\s+/g, " ").trim()}`)
        .join("\n");
    const prompt = `
You are a digital anthropologist, observing a user's raw activity log. Your goal is to synthesize this log into a high-level, human-readable story of their session, presented as a series of timeline cards.

THE GOLDEN RULE:
Create cards that narrate one cohesive session, aiming for 15–60 minutes. Keep every card ≥10 minutes, split up any cards that are >60 minutes, and if a prospective card would be <10 minutes, merge it into the neighboring card that preserves the best story.

CONTINUITY RULE:
You may adjust boundaries for clarity, but never introduce new gaps or overlaps. Preserve any original gaps in the source timeline and keep adjacent covered spans meeting cleanly.

CORE DIRECTIVES:
- Theme Test Before Extending: Extend the current card only when the new observations continue the same dominant activity. Shifts shorter than 10 minutes should be logged as distractions or merged into the adjacent segment that keeps the theme coherent; shifts ≥10 minutes become new cards.

APP SITES (Website Logos)
Identify the main app or website used for each card and include an appSites object.

Rules:
- primary: The canonical domain (or canonical product path) of the main app used in the card.
- secondary: Another meaningful app used during this session OR the enclosing app (e.g., browser), if relevant.
- Format: lower-case, no protocol, no query or fragments. Use product subdomains/paths when they are canonical (e.g., docs.google.com for Google Docs).
- Be specific: prefer product domains over generic ones (docs.google.com over google.com).
- If you cannot determine a secondary, omit it.
- Do not invent brands; rely on evidence from observations.

DISTRACTIONS:
A "distraction" is a brief (<5 min) and unrelated activity that interrupts the main theme of a card. Sustained activities (>5 min) are NOT distractions - they either belong to the current theme or warrant a new card. Don't label related sub-tasks as distractions.

INPUT OBSERVATIONS:
${observationLog}

Return ONLY a JSON array with this EXACT structure:
[
  {
    "startTime": "MM:SS",
    "endTime": "MM:SS",
    "category": "",
    "subcategory": "",
    "title": "",
    "summary": "",
    "detailedSummary": "",
    "distractions": [
      {
        "startTime": "MM:SS",
        "endTime": "MM:SS",
        "title": "",
        "summary": ""
      }
    ],
    "appSites": {
      "primary": "",
      "secondary": ""
    }
  }
]
`;
    const distractionSchema = {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            startTime: { type: generative_ai_1.SchemaType.STRING },
            endTime: { type: generative_ai_1.SchemaType.STRING },
            title: { type: generative_ai_1.SchemaType.STRING },
            summary: { type: generative_ai_1.SchemaType.STRING },
        },
        required: ["startTime", "endTime", "title", "summary"],
    };
    const appSitesSchema = {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            primary: { type: generative_ai_1.SchemaType.STRING },
            secondary: { type: generative_ai_1.SchemaType.STRING },
        },
    };
    const cardSchema = {
        type: generative_ai_1.SchemaType.ARRAY,
        items: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                startTime: { type: generative_ai_1.SchemaType.STRING },
                endTime: { type: generative_ai_1.SchemaType.STRING },
                category: { type: generative_ai_1.SchemaType.STRING },
                subcategory: { type: generative_ai_1.SchemaType.STRING },
                title: { type: generative_ai_1.SchemaType.STRING },
                summary: { type: generative_ai_1.SchemaType.STRING },
                detailedSummary: { type: generative_ai_1.SchemaType.STRING },
                distractions: { type: generative_ai_1.SchemaType.ARRAY, items: distractionSchema },
                appSites: appSitesSchema,
            },
            required: [
                "startTime",
                "endTime",
                "category",
                "subcategory",
                "title",
                "summary",
                "detailedSummary",
            ],
        },
    };
    // Use user-selected model or fallback to default preference
    let orderedModels;
    if (userSelectedModel) {
        // User selected a specific model - use it with standard fallbacks
        console.log(`🎯 User selected model: ${geminiConfig_1.GEMINI_MODELS[userSelectedModel].displayName}`);
        orderedModels = [
            userSelectedModel,
            // Add fallbacks in order of capability
            ...[geminiConfig_1.GeminiModel.FLASH, geminiConfig_1.GeminiModel.FLASH_LITE, geminiConfig_1.GeminiModel.PRO].filter(m => m !== userSelectedModel)
        ];
    }
    else {
        // No user preference, use default configuration
        orderedModels = (0, geminiConfig_1.getOrderedModels)(geminiConfig_1.DEFAULT_SUMMARIZATION_PREFERENCE);
    }
    let lastError = null;
    // Try models in order with fallback
    for (const modelName of orderedModels) {
        try {
            console.log(`Generating activity cards with model: ${geminiConfig_1.GEMINI_MODELS[modelName].displayName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    ...geminiConfig_1.GENERATION_CONFIGS.summarization,
                    responseSchema: cardSchema,
                },
            });
            const responseText = result.response.text();
            const jsonString = stripMarkdownFence(responseText);
            const parsed = JSON.parse(jsonString);
            console.log(`✅ Activity cards generated successfully with ${geminiConfig_1.GEMINI_MODELS[modelName].displayName}`);
            return parsed;
        }
        catch (error) {
            lastError = error;
            console.error(`❌ Error with ${geminiConfig_1.GEMINI_MODELS[modelName].displayName}:`, error.message);
            // Check if we should try fallback model
            const isCapacityError = error.status && CAPACITY_ERROR_CODES.has(error.status);
            const isLastModel = modelName === orderedModels[orderedModels.length - 1];
            if (!isCapacityError || isLastModel) {
                // If it's not a capacity error, or this is the last model, throw immediately
                break;
            }
            console.log(`↘️ Falling back to next model...`);
        }
    }
    // All models failed
    throw new Error(`Failed to generate activity cards after trying all models: ${lastError?.message || "Unknown error"}`);
};
exports.generateActivityCards = generateActivityCards;
