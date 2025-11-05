import { Router } from "express";
import { AppConfigValidationError, getAppConfig, updateProxySettings } from "../services/appConfigService";

const router = Router();

router.get("/", (_req, res) => {
	const config = getAppConfig();
	res.json(config);
});

router.put("/proxy", async (req, res) => {
	const { enabled, url } = req.body ?? {};

	if (typeof enabled === "undefined") {
		return res.status(400).json({ message: "'enabled' field is required." });
	}

	try {
		const updatedProxy = await updateProxySettings({
			enabled: Boolean(enabled),
			url: typeof url === "string" ? url : "",
		});
		res.json({ proxy: updatedProxy });
	} catch (error) {
		if (error instanceof AppConfigValidationError) {
			return res.status(400).json({ message: error.message });
		}

		console.error("Failed to update proxy settings", error);
		res.status(500).json({ message: "Failed to update proxy settings." });
	}
});

export default router;
