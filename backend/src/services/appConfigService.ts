import fs from "fs/promises";
import path from "path";
import { Agent, ProxyAgent, setGlobalDispatcher } from "undici";

const CONFIG_FILENAME = "app-config.json";
const CONFIG_DIRECTORY = path.resolve(__dirname, "../../temp");
const CONFIG_PATH = path.join(CONFIG_DIRECTORY, CONFIG_FILENAME);

export interface ProxySettings {
	enabled: boolean;
	url: string;
}

export interface AppConfig {
	networking: {
		proxy: ProxySettings;
	};
}

const defaultConfig: AppConfig = {
	networking: {
		proxy: {
			enabled: false,
			url: "",
		},
	},
};

export class AppConfigValidationError extends Error {}

let cachedConfig: AppConfig = { ...defaultConfig };
let activeDispatcher: Agent | ProxyAgent | null = null;
const defaultDispatcher = new Agent();

const ensureConfigDirectory = async () => {
	await fs.mkdir(CONFIG_DIRECTORY, { recursive: true });
};

const sanitizeProxySettings = (payload: ProxySettings): ProxySettings => {
	const enabled = Boolean(payload.enabled);
	const rawUrl = payload.url?.trim() ?? "";

	if (!enabled) {
		if (!rawUrl) {
			return { enabled: false, url: "" };
		}

		try {
			const parsed = new URL(rawUrl);
			if (!["http:", "https:"].includes(parsed.protocol)) {
				return { enabled: false, url: "" };
			}

			const normalizedUrl = parsed.toString().replace(/\/$/, "");
			return { enabled: false, url: normalizedUrl };
		} catch (error) {
			console.warn("[Config] Ignoring invalid proxy URL while disabled:", error);
			return { enabled: false, url: "" };
		}
	}

	if (!rawUrl) {
		throw new AppConfigValidationError("Proxy URL is required when proxy is enabled.");
	}

	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch (error) {
		throw new AppConfigValidationError("Proxy URL is not a valid URL.");
	}

	if (!["http:", "https:"].includes(parsed.protocol)) {
		throw new AppConfigValidationError("Proxy protocol must be http or https.");
	}

	const normalizedUrl = parsed.toString().replace(/\/$/, "");

	return {
		enabled: true,
		url: normalizedUrl,
	};
};

const applyProxyDispatcher = (proxy: ProxySettings) => {
	if (proxy.enabled && proxy.url) {
		try {
			const dispatcher = new ProxyAgent(proxy.url);
			if (activeDispatcher && activeDispatcher !== defaultDispatcher) {
				activeDispatcher.close();
			}
			setGlobalDispatcher(dispatcher);
			activeDispatcher = dispatcher;
			process.env.GEMINI_HTTP_PROXY = proxy.url;
			process.env.HTTP_PROXY = proxy.url;
			process.env.HTTPS_PROXY = proxy.url;
			return;
		} catch (error) {
			throw new AppConfigValidationError(
				`Failed to apply proxy settings: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	if (activeDispatcher && activeDispatcher !== defaultDispatcher) {
		activeDispatcher.close();
	}
	setGlobalDispatcher(defaultDispatcher);
	activeDispatcher = defaultDispatcher;
	process.env.GEMINI_HTTP_PROXY = "";
	process.env.HTTP_PROXY = "";
	process.env.HTTPS_PROXY = "";
};

const writeConfigToDisk = async (config: AppConfig) => {
	await ensureConfigDirectory();
	await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
};

const readConfigFromDisk = async (): Promise<AppConfig> => {
	try {
		const raw = await fs.readFile(CONFIG_PATH, "utf8");
		const parsed = JSON.parse(raw) as Partial<AppConfig>;
		const candidate = parsed.networking?.proxy
			? {
				enabled: Boolean(parsed.networking.proxy.enabled),
				url: parsed.networking.proxy.url ?? "",
			}
			: defaultConfig.networking.proxy;
		const sanitized = sanitizeProxySettings(candidate);
		return {
			networking: {
				proxy: sanitized,
			},
		};
	} catch (error) {
		return { ...defaultConfig };
	}
};

export const initAppConfig = async () => {
	const config = await readConfigFromDisk();
	cachedConfig = config;
	applyProxyDispatcher(config.networking.proxy);
};

export const getAppConfig = (): AppConfig => {
	return cachedConfig;
};

export const updateProxySettings = async (payload: ProxySettings): Promise<ProxySettings> => {
	const sanitized = sanitizeProxySettings(payload);
	cachedConfig = {
		...cachedConfig,
		networking: {
			...cachedConfig.networking,
			proxy: sanitized,
		},
	};

	await writeConfigToDisk(cachedConfig);
	applyProxyDispatcher(sanitized);

	return cachedConfig.networking.proxy;
};
