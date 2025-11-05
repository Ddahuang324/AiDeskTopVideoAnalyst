import "../config/env";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// Server-side File Manager for uploading large media files
// Ref: https://github.com/google/generative-ai-js
import { GoogleAIFileManager } from "@google/generative-ai/server";
import type { Schema } from "@google/generative-ai";
import path from "path";
import fs from "fs";
// Optional proxy support for restricted networks
import { ProxyAgent, setGlobalDispatcher } from "undici";
import {
	GeminiModel,
	DEFAULT_TRANSCRIPTION_PREFERENCE,
	DEFAULT_SUMMARIZATION_PREFERENCE,
	GENERATION_CONFIGS,
	getOrderedModels,
	GEMINI_MODELS
} from "../config/geminiConfig";
import { STAGE1_SYSTEM_PROMPT, STAGE2_SYSTEM_PROMPT } from "./promptTemplates";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
	console.warn("[Gemini] GEMINI_API_KEY is not set. Requests will fail until a valid key is provided.");
}

// Capacity error codes that should trigger model fallback
const CAPACITY_ERROR_CODES = new Set([403, 429, 503]);

export interface Observation {
	startTimestamp: string;
	endTimestamp: string;
	description: string;
}

export interface ActivityCardDistraction {
	startTime: string;
	endTime: string;
	title: string;
	summary: string;
}

export interface ActivityCardAppSites {
	primary?: string;
	secondary?: string;
}

export interface ActivityCard {
	startTime: string;
	endTime: string;
	category: string;
	subcategory?: string;
	title: string;
	summary: string;
	detailedSummary: string;
	distractions?: ActivityCardDistraction[];
	appSites?: ActivityCardAppSites;
}

export interface AnalysisResultOutput {
	title: string;
	summary: string;
	tags: string[];
	keyFindings?: { point: string; evidence: string[] }[];
	productivityScore?: number;
	nextActions?: string[];
}

const stripMarkdownFence = (payload: string): string =>
	payload.replace(/```json\s*|```/g, "").trim();

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com";
const VIDEO_MIME_TYPE = "video/mp4";
const FILE_POLL_INTERVAL_MS = 1500;
const FILE_POLL_TIMEOUT_MS = 2 * 60 * 1000;

interface GeminiFile {
	name: string;
	uri?: string;
	state?: string;
	error?: { message?: string };
}

interface GeminiFileResponse {
	file: GeminiFile;
}

const sleep = (ms: number): Promise<void> =>
	new Promise(resolve => setTimeout(resolve, ms));

// Helper to get the effective API key and update global state
const getEffectiveApiKey = (providedApiKey?: string): string => {
	return providedApiKey || process.env.GEMINI_API_KEY || apiKey;
};

// Helper to create appendApiKey function with custom API key
const createAppendApiKey = (customApiKey: string) => {
	return (url: string): string => {
		if (!customApiKey) {
			throw new Error("GEMINI_API_KEY is required to call Gemini APIs.");
		}
		return url.includes("?") ? `${url}&key=${customApiKey}` : `${url}?key=${customApiKey}`;
	};
};

const appendApiKey = (url: string): string => {
	if (!apiKey) {
		throw new Error("GEMINI_API_KEY is required to call Gemini APIs.");
	}
	return url.includes("?") ? `${url}&key=${apiKey}` : `${url}?key=${apiKey}`;
};

const isNetworkError = (error: unknown): boolean => {
	if (error instanceof Error) {
		return /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ECONNREFUSED/i.test(error.message);
	}
	return false;
};

const waitForGeminiFileActive = async (
	fileName: string,
	manager?: GoogleAIFileManager | null,
	customApiKey?: string,
): Promise<GeminiFile> => {
	const deadline = Date.now() + FILE_POLL_TIMEOUT_MS;
	let lastState: string | undefined;
	const appendUrl = customApiKey ? createAppendApiKey(customApiKey) : appendApiKey;

	while (Date.now() < deadline) {
		try {
			let file: GeminiFile | null = null;
			if (manager) {
				file = (await manager.getFile(fileName)) as GeminiFile;
			} else {
				const statusUrl = appendUrl(`${GEMINI_API_BASE_URL}/v1beta/${fileName}`);
				const response = await fetch(statusUrl);
				if (!response.ok) {
					const body = await response.text();
					throw new Error(`Gemini file status error (${response.status}): ${body || response.statusText}`);
				}
				file = (await response.json()) as GeminiFile;
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
		} catch (statusError) {
			throw statusError;
		}

		await sleep(FILE_POLL_INTERVAL_MS);
	}

	throw new Error(`Timed out waiting for Gemini file ${fileName} to become ACTIVE.`);
};

const initiateResumableUpload = async (displayName: string, customApiKey?: string): Promise<string> => {
	const appendUrl = customApiKey ? createAppendApiKey(customApiKey) : appendApiKey;
	const initUrl = appendUrl(`${GEMINI_API_BASE_URL}/upload/v1beta/files`);
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

const completeResumableUpload = async (uploadUrl: string, filePath: string): Promise<GeminiFile> => {
	const stats = fs.statSync(filePath);
	const fileStream = fs.createReadStream(filePath);

	const uploadInit: RequestInit = {
		method: "POST",
		headers: {
			"Content-Length": stats.size.toString(),
			"Content-Type": VIDEO_MIME_TYPE,
			"X-Goog-Upload-Command": "upload, finalize",
			"X-Goog-Upload-Offset": "0",
		},
		body: fileStream as any,
	};

	// Required by Undici when streaming a request body
	Reflect.set(uploadInit, "duplex", "half");

	const response = await fetch(uploadUrl, uploadInit);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Gemini resumable upload failed (${response.status}): ${body || response.statusText}`);
	}

	const payload = (await response.json()) as GeminiFileResponse;
	if (!payload?.file?.name) {
		throw new Error("Gemini resumable upload succeeded but returned no file metadata.");
	}

	return payload.file;
};

const uploadVideoWithResumable = async (filePath: string, displayName: string, customApiKey?: string): Promise<string> => {
	console.log("[Gemini] Using manual resumable upload flow.");
	const uploadUrl = await initiateResumableUpload(displayName, customApiKey);
	const uploadedFile = await completeResumableUpload(uploadUrl, filePath);
	const activeFile = await waitForGeminiFileActive(uploadedFile.name, null, customApiKey);
	if (!activeFile.uri) {
		throw new Error("Gemini file became ACTIVE but no URI was returned.");
	}
	console.log(`[Gemini] Resumable upload successful. File URI: ${activeFile.uri}`);
	return activeFile.uri;
};

const uploadVideoWithFileManager = async (filePath: string, displayName: string, manager: GoogleAIFileManager, customApiKey?: string): Promise<string> => {
	console.log("[Gemini] Uploading via GoogleAIFileManager.");
	const uploadResponse = await manager.uploadFile(filePath, {
		mimeType: VIDEO_MIME_TYPE,
		displayName,
	});

	const fileName = uploadResponse?.file?.name;
	if (!fileName) {
		throw new Error("GoogleAIFileManager returned no file name.");
	}

	const activeFile = await waitForGeminiFileActive(fileName, manager, customApiKey);
	if (!activeFile.uri) {
		throw new Error("Gemini file became ACTIVE but provided no URI.");
	}

	console.log(`[Gemini] Upload successful. File URI: ${activeFile.uri}`);
	return activeFile.uri;
};

/**
 * Uploads a video file to the Gemini File API.
 * @param {string} filePath The path to the video file to upload.
 * @param {string} [providedApiKey] The API key to use. If not provided, uses the environment variable.
 * @returns {Promise<string>} A promise that resolves with the `file.uri` from the API response.
 */
export const uploadVideo = async (filePath: string, providedApiKey?: string): Promise<string> => {
	console.log(`Uploading video: ${filePath}`);

	if (!fs.existsSync(filePath)) {
		throw new Error(`Video file not found: ${filePath}`);
	}

	// Use provided API key or fall back to environment variable
	const effectiveApiKey = providedApiKey || process.env.GEMINI_API_KEY || "";
	
	if (!effectiveApiKey) {
		throw new Error("GEMINI_API_KEY is not configured. Set it in your environment to use Gemini uploads.");
	}

	const displayName = `workflow-video-${path.basename(filePath)}`;
	let fileManagerError: unknown = null;

	// Initialize file manager with the effective API key
	let effectiveFileManager: GoogleAIFileManager | null = null;
	try {
		effectiveFileManager = new GoogleAIFileManager(effectiveApiKey);
	} catch (error) {
		console.warn("[Gemini] Could not initialize GoogleAIFileManager:", error);
	}

	if (effectiveFileManager) {
		try {
			return await uploadVideoWithFileManager(filePath, displayName, effectiveFileManager, effectiveApiKey);
		} catch (error) {
			fileManagerError = error;
			console.error("[Gemini] File manager upload failed, falling back to manual resumable flow:", error);
		}
	} else {
		console.warn("[Gemini] GoogleAIFileManager unavailable. Falling back to manual resumable upload.");
	}

	try {
		return await uploadVideoWithResumable(filePath, displayName, effectiveApiKey);
	} catch (fallbackError) {
		console.error("[Gemini] Resumable upload failed:", fallbackError);
		const messages: string[] = [];
		messages.push(fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
		if (fileManagerError instanceof Error) {
			messages.push(`File manager error: ${fileManagerError.message}`);
		}
		if (isNetworkError(fallbackError) || isNetworkError(fileManagerError)) {
			messages.push(
				"Network error detected. Ensure outbound HTTPS access to generativelanguage.googleapis.com or configure GEMINI_HTTP_PROXY/HTTPS_PROXY."
			);
		}
		throw new Error(`Failed to upload video to Gemini. ${messages.join(" | ")}`);
	}
};

/**
 * Transcribes a video into a series of timestamped observations using a detailed prompt.
 * @param {string} fileUri The URI of the uploaded video file.
 * @param {number} videoDuration The duration of the video in seconds.
 * @param {GeminiModel} userSelectedModel The model selected by the user in the frontend.
 * @param {string} [providedApiKey] The API key to use. If not provided, uses the environment variable.
 * @returns {Promise<any>} A promise that resolves with the parsed JSON array of observations.
 */
export const transcribeVideo = async (
	fileUri: string,
	videoDuration: number,
	userSelectedModel?: GeminiModel,
	providedApiKey?: string,
): Promise<Observation[]> => {
	// Use provided API key or fall back to environment variable
	const effectiveApiKey = providedApiKey || process.env.GEMINI_API_KEY || apiKey;
	const genAIInstance = new GoogleGenerativeAI(effectiveApiKey);
	const durationMinutes = Math.floor(videoDuration / 60);
	const durationSeconds = Math.round(videoDuration % 60);
	const durationString = `${String(durationMinutes).padStart(2, "0")}:${String(
		durationSeconds,
	).padStart(2, "0")}`;

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
	let orderedModels: GeminiModel[];
	if (userSelectedModel) {
		// User selected a specific model - use it with standard fallbacks
		console.log(`🎯 User selected model: ${GEMINI_MODELS[userSelectedModel].displayName}`);
		orderedModels = [
			userSelectedModel,
			// Add fallbacks in order of capability
			...[GeminiModel.FLASH, GeminiModel.FLASH_LITE, GeminiModel.PRO].filter(m => m !== userSelectedModel)
		];
	} else {
		// No user preference, use default configuration
		orderedModels = getOrderedModels(DEFAULT_TRANSCRIPTION_PREFERENCE);
	}
	
	let lastError: Error | null = null;
	
	// Try models in order with fallback
	for (const modelName of orderedModels) {
		try {
			console.log(`Attempting transcription with model: ${GEMINI_MODELS[modelName].displayName}`);

			const transcriptionSchema: Schema = {
				type: SchemaType.ARRAY,
				items: {
					type: SchemaType.OBJECT,
					properties: {
						startTimestamp: { type: SchemaType.STRING },
						endTimestamp: { type: SchemaType.STRING },
						description: { type: SchemaType.STRING },
					},
					required: ["startTimestamp", "endTimestamp", "description"],
				},
			};

			const model = genAIInstance.getGenerativeModel({ model: modelName });

			if (!fileUri || (!fileUri.startsWith("https://") && !fileUri.startsWith("gs://"))) {
				throw new Error(
					`Invalid Gemini file URI: ${fileUri}. Expected the upload step to return a hosted URI from generativelanguage.googleapis.com.`
				);
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
					...GENERATION_CONFIGS.transcription,
					responseSchema: transcriptionSchema,
				},
			});

			const responseText = result.response.text();
			const jsonString = stripMarkdownFence(responseText);
			const parsed = JSON.parse(jsonString) as Observation[];

			console.log(`✅ Transcription successful with ${GEMINI_MODELS[modelName].displayName}`);
			return parsed;
			
		} catch (error: any) {
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
				} catch (e) {
					// ignore JSON stringify errors
				}
			}

			const msg = error?.message || String(error);
			console.error(`❌ Error with ${GEMINI_MODELS[modelName].displayName}:`, msg);

			// More helpful diagnostics for network issues often seen in restricted networks
			if (msg.includes("fetch failed") || /ENOTFOUND|ECONNRESET|ETIMEDOUT/i.test(msg)) {
				console.error(
					"Network error reaching generativelanguage.googleapis.com. If you're in a restricted network, set GEMINI_HTTP_PROXY/HTTPS_PROXY, try a VPN/proxy, or use Vertex AI with regional endpoints."
				);
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

/**
 * Generates higher-level activity cards from the list of observations.
 * @param {Observation[]} observations The observations returned by the transcription step.
 * @param {GeminiModel} userSelectedModel The model selected by the user in the frontend.
 * @param {string} [providedApiKey] The API key to use. If not provided, uses the environment variable.
 * @returns {Promise<ActivityCard[]>} Structured activity cards ready for the frontend.
 */
export const generateActivityCards = async (
	observations: Observation[],
	userSelectedModel?: GeminiModel,
	providedApiKey?: string,
): Promise<ActivityCard[]> => {
	// Use provided API key or fall back to environment variable
	const effectiveApiKey = providedApiKey || process.env.GEMINI_API_KEY || apiKey;
	const genAIInstance = new GoogleGenerativeAI(effectiveApiKey);

	if (!observations.length) {
		throw new Error("No observations provided for activity card generation.");
	}

	const observationLog = observations
		.map(
			(obs) =>
				`[${obs.startTimestamp} - ${obs.endTimestamp}]: ${obs.description.replace(/\s+/g, " ").trim()}`,
		)
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

	const distractionSchema: Schema = {
		type: SchemaType.OBJECT,
		properties: {
			startTime: { type: SchemaType.STRING },
			endTime: { type: SchemaType.STRING },
			title: { type: SchemaType.STRING },
			summary: { type: SchemaType.STRING },
		},
		required: ["startTime", "endTime", "title", "summary"],
	};

	const appSitesSchema: Schema = {
		type: SchemaType.OBJECT,
		properties: {
			primary: { type: SchemaType.STRING },
			secondary: { type: SchemaType.STRING },
		},
	};

	const cardSchema: Schema = {
		type: SchemaType.ARRAY,
		items: {
			type: SchemaType.OBJECT,
			properties: {
				startTime: { type: SchemaType.STRING },
				endTime: { type: SchemaType.STRING },
				category: { type: SchemaType.STRING },
				subcategory: { type: SchemaType.STRING },
				title: { type: SchemaType.STRING },
				summary: { type: SchemaType.STRING },
				detailedSummary: { type: SchemaType.STRING },
				distractions: { type: SchemaType.ARRAY, items: distractionSchema },
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
	let orderedModels: GeminiModel[];
	if (userSelectedModel) {
		// User selected a specific model - use it with standard fallbacks
		console.log(`🎯 User selected model: ${GEMINI_MODELS[userSelectedModel].displayName}`);
		orderedModels = [
			userSelectedModel,
			// Add fallbacks in order of capability
			...[GeminiModel.FLASH, GeminiModel.FLASH_LITE, GeminiModel.PRO].filter(m => m !== userSelectedModel)
		];
	} else {
		// No user preference, use default configuration
		orderedModels = getOrderedModels(DEFAULT_SUMMARIZATION_PREFERENCE);
	}
	
	let lastError: Error | null = null;
	
	// Try models in order with fallback
	for (const modelName of orderedModels) {
		try {
			console.log(`Generating activity cards with model: ${GEMINI_MODELS[modelName].displayName}`);
			
			const model = genAIInstance.getGenerativeModel({ model: modelName });

			const result = await model.generateContent({
				contents: [
					{
						role: "user",
						parts: [{ text: prompt }],
					},
				],
				generationConfig: {
					...GENERATION_CONFIGS.summarization,
					responseSchema: cardSchema,
				},
			});

			const responseText = result.response.text();
			const jsonString = stripMarkdownFence(responseText);
			const parsed = JSON.parse(jsonString) as ActivityCard[];

			console.log(`✅ Activity cards generated successfully with ${GEMINI_MODELS[modelName].displayName}`);
			return parsed;
			
		} catch (error: any) {
			lastError = error;
			console.error(`❌ Error with ${GEMINI_MODELS[modelName].displayName}:`, error.message);
			
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

/**
 * 阶段1：基于用户自定义提示词生成自由文本的总结笔记
 * 一阶提示词（STAGE1_SYSTEM_PROMPT）固定在后端，保证格式统一
 * 二阶提示词（customSummaryPrompt）由用户在前端定义，影响内容风格
 * @param stage1SystemPrompt 阶段1系统提示词（可选，默认使用内置）
 * @param customSummaryPrompt 用户自定义的总结提示词（二阶提示词）
 * @param activityCards 活动卡片数组
 * @param observations 原始观察数据
 * @param userSelectedModel 用户选择的模型
 * @param providedApiKey API密钥
 */
export const draftSummaryNotes = async (
	stage1SystemPrompt: string | undefined,
	customSummaryPrompt: string,
	activityCards: ActivityCard[],
	observations: Observation[],
	userSelectedModel?: GeminiModel,
	providedApiKey?: string,
): Promise<string> => {
	const effectiveApiKey = providedApiKey || process.env.GEMINI_API_KEY || apiKey;
	const genAIInstance = new GoogleGenerativeAI(effectiveApiKey);

	// 构建活动卡片的文本摘要
	const cardsSummary = activityCards
		.map((card, idx) => 
			`【活动${idx + 1}】 ${card.startTime} - ${card.endTime}\n` +
			`标题: ${card.title}\n` +
			`分类: ${card.category}${card.subcategory ? ` / ${card.subcategory}` : ''}\n` +
			`总结: ${card.summary}\n` +
			`详情: ${card.detailedSummary}` +
			(card.appSites?.primary ? `\n应用: ${card.appSites.primary}${card.appSites.secondary ? ` / ${card.appSites.secondary}` : ''}` : '')
		)
		.join('\n\n');

	// 使用提供的系统提示词或默认的
	const effectiveSystemPrompt = stage1SystemPrompt || STAGE1_SYSTEM_PROMPT;

	// 组合一阶提示词（系统）+ 二阶提示词（用户指导）+ 数据
	const userMessage = `
${effectiveSystemPrompt}

【用户的自定义指导】
${customSummaryPrompt}

【可用的分析数据】
- 活动卡片数: ${activityCards.length} 张
- 原始观察数: ${observations.length} 条

${cardsSummary}

现在请根据上述要求，生成总结笔记：`;

	let orderedModels: GeminiModel[];
	if (userSelectedModel) {
		console.log(`🎯 User selected model for stage 1: ${GEMINI_MODELS[userSelectedModel].displayName}`);
		orderedModels = [
			userSelectedModel,
			...[GeminiModel.FLASH, GeminiModel.FLASH_LITE, GeminiModel.PRO].filter(m => m !== userSelectedModel)
		];
	} else {
		orderedModels = getOrderedModels(DEFAULT_SUMMARIZATION_PREFERENCE);
	}

	let lastError: Error | null = null;

	for (const modelName of orderedModels) {
		try {
			console.log(`📝 Drafting summary notes with model: ${GEMINI_MODELS[modelName].displayName}`);
			const model = genAIInstance.getGenerativeModel({ model: modelName });

			const result = await model.generateContent({
				contents: [
					{
						role: "user",
						parts: [{ text: userMessage }],
					},
				],
				generationConfig: GENERATION_CONFIGS.summarization,
			});

			const notes = result.response.text().trim();
			console.log(`✅ Summary notes drafted successfully with ${GEMINI_MODELS[modelName].displayName}`);
			return notes;

		} catch (error: any) {
			lastError = error;
			console.error(`❌ Error with ${GEMINI_MODELS[modelName].displayName}:`, error.message);

			const isCapacityError = error.status && CAPACITY_ERROR_CODES.has(error.status);
			const isLastModel = modelName === orderedModels[orderedModels.length - 1];

			if (!isCapacityError || isLastModel) {
				break;
			}

			console.log(`↘️ Falling back to next model...`);
		}
	}

	throw new Error(`Failed to draft summary notes: ${lastError?.message || "Unknown error"}`);
};

/**
 * 阶段2：将总结笔记转化为结构化JSON输出（AnalysisResult格式）
 * 一阶提示词（STAGE2_SYSTEM_PROMPT）固定在后端，保证JSON格式统一
 * 二阶提示词（customJsonPrompt）由用户在前端定义，指导内容的重点和风格
 * @param summaryNotes 阶段1生成的总结笔记
 * @param customJsonPrompt 用户自定义的JSON生成提示词（二阶提示词）
 * @param activityCards 活动卡片数组
 * @param videoMeta 视频元数据
 * @param userSelectedModel 用户选择的模型
 * @param providedApiKey API密钥
 */
export const synthesizeAnalysisResult = async (
	summaryNotes: string,
	customJsonPrompt: string,
	activityCards: ActivityCard[],
	videoMeta?: { durationSec?: number; fileName?: string },
	userSelectedModel?: GeminiModel,
	providedApiKey?: string,
): Promise<AnalysisResultOutput> => {
	const effectiveApiKey = providedApiKey || process.env.GEMINI_API_KEY || apiKey;
	const genAIInstance = new GoogleGenerativeAI(effectiveApiKey);

	// 组合一阶提示词（系统）+ 二阶提示词（用户指导）+ 数据
	const userMessage = `
${STAGE2_SYSTEM_PROMPT}

【用户的自定义指导】
${customJsonPrompt}

【总结笔记（来自阶段1）】
${summaryNotes}

【视频元信息】
${videoMeta ? JSON.stringify(videoMeta, null, 2) : "N/A"}

【活动卡片数据】
${JSON.stringify(activityCards, null, 2)}

现在请根据上述要求，将总结笔记转化为JSON。仅输出JSON，不要任何其他文本。
`;

	const jsonSchema: Schema = {
		type: SchemaType.OBJECT,
		properties: {
			title: { type: SchemaType.STRING },
			summary: { type: SchemaType.STRING },
			tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
			keyFindings: {
				type: SchemaType.ARRAY,
				items: {
					type: SchemaType.OBJECT,
					properties: {
						point: { type: SchemaType.STRING },
						evidence: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
					},
					required: ["point", "evidence"],
				},
			},
			productivityScore: { type: SchemaType.INTEGER },
			nextActions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
		},
		required: ["title", "summary", "tags"],
	};

	let orderedModels: GeminiModel[];
	if (userSelectedModel) {
		console.log(`🎯 User selected model for stage 2: ${GEMINI_MODELS[userSelectedModel].displayName}`);
		orderedModels = [
			userSelectedModel,
			...[GeminiModel.FLASH, GeminiModel.FLASH_LITE, GeminiModel.PRO].filter(m => m !== userSelectedModel)
		];
	} else {
		orderedModels = getOrderedModels(DEFAULT_SUMMARIZATION_PREFERENCE);
	}

	let lastError: Error | null = null;

	for (const modelName of orderedModels) {
		try {
			console.log(`📊 Synthesizing analysis result with model: ${GEMINI_MODELS[modelName].displayName}`);
			const model = genAIInstance.getGenerativeModel({ model: modelName });

			const result = await model.generateContent({
				contents: [
					{
						role: "user",
						parts: [{ text: userMessage }],
					},
				],
				generationConfig: {
					...GENERATION_CONFIGS.summarization,
					responseSchema: jsonSchema,
				},
			});

			const responseText = result.response.text();
			const jsonString = stripMarkdownFence(responseText);
			const parsed = JSON.parse(jsonString) as AnalysisResultOutput;

			console.log(`✅ Analysis result synthesized successfully with ${GEMINI_MODELS[modelName].displayName}`);
			return parsed;

		} catch (error: any) {
			lastError = error;
			console.error(`❌ Error with ${GEMINI_MODELS[modelName].displayName}:`, error.message);

			const isCapacityError = error.status && CAPACITY_ERROR_CODES.has(error.status);
			const isLastModel = modelName === orderedModels[orderedModels.length - 1];

			if (!isCapacityError || isLastModel) {
				break;
			}

			console.log(`↘️ Falling back to next model...`);
		}
	}

	throw new Error(`Failed to synthesize analysis result: ${lastError?.message || "Unknown error"}`);
};

/**
 * 便捷方法：一键生成完整的AI总结结果
 */
export const generateAiSummaryResult = async (
	stage1SystemPrompt: string | undefined,  // 阶段1系统提示词（可选）
	customSummaryPrompt: string,
	customJsonPrompt: string,
	activityCards: ActivityCard[],
	observations: Observation[],
	videoMeta?: { durationSec?: number; fileName?: string },
	userSelectedModel?: GeminiModel,
	providedApiKey?: string,
): Promise<AnalysisResultOutput> => {
	console.log("🚀 Starting two-stage AI summary generation...");
	
	const notes = await draftSummaryNotes(
		stage1SystemPrompt,  // 传递阶段1系统提示词
		customSummaryPrompt,
		activityCards,
		observations,
		userSelectedModel,
		providedApiKey
	);

	console.log("📝 Stage 1 complete. Moving to stage 2...");

	const result = await synthesizeAnalysisResult(
		notes,
		customJsonPrompt,
		activityCards,
		videoMeta,
		userSelectedModel,
		providedApiKey
	);

	console.log("✅ Two-stage AI summary generation complete!");
	return result;
};

