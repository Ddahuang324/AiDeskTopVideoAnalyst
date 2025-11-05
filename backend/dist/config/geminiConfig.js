"use strict";
/**
 * Gemini Model Configuration
 * Following Dayflow's model preference pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERATION_CONFIGS = exports.DEFAULT_SUMMARIZATION_PREFERENCE = exports.DEFAULT_TRANSCRIPTION_PREFERENCE = exports.GEMINI_MODELS = exports.GeminiModel = void 0;
exports.getOrderedModels = getOrderedModels;
exports.getFallbackSummary = getFallbackSummary;
var GeminiModel;
(function (GeminiModel) {
    GeminiModel["PRO"] = "gemini-2.5-pro";
    GeminiModel["FLASH"] = "gemini-2.5-flash";
    GeminiModel["FLASH_LITE"] = "gemini-2.5-flash-lite";
})(GeminiModel || (exports.GeminiModel = GeminiModel = {}));
exports.GEMINI_MODELS = {
    [GeminiModel.PRO]: {
        name: GeminiModel.PRO,
        displayName: "Gemini 2.5 Pro",
        shortLabel: "2.5 Pro",
        description: "Highest quality, best for complex analysis and detailed summaries"
    },
    [GeminiModel.FLASH]: {
        name: GeminiModel.FLASH,
        displayName: "Gemini 2.5 Flash",
        shortLabel: "2.5 Flash",
        description: "Fast and balanced, good for most tasks"
    },
    [GeminiModel.FLASH_LITE]: {
        name: GeminiModel.FLASH_LITE,
        displayName: "Gemini 2.5 Flash Lite",
        shortLabel: "Flash Lite",
        description: "Fastest and most cost-effective, optimized for video analysis"
    }
};
exports.DEFAULT_TRANSCRIPTION_PREFERENCE = {
    primary: GeminiModel.FLASH_LITE,
    fallbacks: [GeminiModel.FLASH, GeminiModel.PRO]
};
exports.DEFAULT_SUMMARIZATION_PREFERENCE = {
    primary: GeminiModel.FLASH,
    fallbacks: [GeminiModel.FLASH_LITE]
};
/**
 * Get ordered list of models to try (primary + fallbacks)
 */
function getOrderedModels(preference) {
    return [preference.primary, ...preference.fallbacks];
}
/**
 * Get fallback summary for a model preference
 */
function getFallbackSummary(preference) {
    if (preference.fallbacks.length === 0) {
        return `Always uses ${exports.GEMINI_MODELS[preference.primary].shortLabel}`;
    }
    const fallbackLabels = preference.fallbacks.map(m => exports.GEMINI_MODELS[m].shortLabel);
    return `Falls back to ${fallbackLabels.join(", then ")} if needed`;
}
/**
 * Generation configuration for different operations
 */
exports.GENERATION_CONFIGS = {
    transcription: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
    },
    summarization: {
        temperature: 0.25,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
    }
};
