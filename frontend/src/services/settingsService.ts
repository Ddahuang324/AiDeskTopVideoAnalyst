import { AppSettings, ProxySettings } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const SETTINGS_BASE_URL = `${API_BASE_URL}/api/settings`;

const handleResponse = async <T>(response: Response): Promise<T> => {
	if (response.ok) {
		return (await response.json()) as T;
	}

	let message = "Request failed.";
	try {
		const body = (await response.json()) as { message?: string };
		if (body?.message) {
			message = body.message;
		}
	} catch (error) {
		// Ignore JSON parse errors; fallback to default message below.
	}

	throw new Error(message);
};

export const fetchAppSettings = async (): Promise<AppSettings> => {
	const response = await fetch(SETTINGS_BASE_URL, {
		method: "GET",
	});
	return handleResponse<AppSettings>(response);
};

export const updateProxySettings = async (proxy: ProxySettings): Promise<ProxySettings> => {
	const response = await fetch(`${SETTINGS_BASE_URL}/proxy`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(proxy),
	});
	const payload = await handleResponse<{ proxy: ProxySettings }>(response);
	return payload.proxy;
};
