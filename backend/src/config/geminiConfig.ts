/**
 * Gemini Model Configuration
 * Following Dayflow's model preference pattern
 */

export enum GeminiModel {
	PRO = "gemini-2.5-pro",
	FLASH = "gemini-2.5-flash",
	FLASH_LITE = "gemini-2.5-flash-lite"
}

export interface GeminiModelConfig {
	name: string;
	displayName: string;
	shortLabel: string;
	description: string;
}

export const GEMINI_MODELS: Record<GeminiModel, GeminiModelConfig> = {
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

/**
 * Model Preference Configuration
 * Defines which models to use for different operations with fallback strategy
 */
export interface ModelPreference {
	primary: GeminiModel;
	fallbacks: GeminiModel[];
}

export const DEFAULT_TRANSCRIPTION_PREFERENCE: ModelPreference = {
	primary: GeminiModel.FLASH_LITE,
	fallbacks: [GeminiModel.FLASH, GeminiModel.PRO]
};

export const DEFAULT_SUMMARIZATION_PREFERENCE: ModelPreference = {
	primary: GeminiModel.FLASH,
	fallbacks: [GeminiModel.FLASH_LITE]
};

/**
 * Get ordered list of models to try (primary + fallbacks)
 */
export function getOrderedModels(preference: ModelPreference): GeminiModel[] {
	return [preference.primary, ...preference.fallbacks];
}

/**
 * Get fallback summary for a model preference
 */
export function getFallbackSummary(preference: ModelPreference): string {
	if (preference.fallbacks.length === 0) {
		return `Always uses ${GEMINI_MODELS[preference.primary].shortLabel}`;
	}
	
	const fallbackLabels = preference.fallbacks.map(m => GEMINI_MODELS[m].shortLabel);
	return `Falls back to ${fallbackLabels.join(", then ")} if needed`;
}

/**
 * Generation configuration for different operations
 */
export const GENERATION_CONFIGS = {
	transcription: {
		temperature: 0.3,
		maxOutputTokens: 8192,
		responseMimeType: "application/json" as const,
	},
	summarization: {
		temperature: 0.25,
		maxOutputTokens: 8192,
		responseMimeType: "application/json" as const,
	}
};
