import type { RequestHandler } from 'express';
import { getAISettings } from '../../providers/settings.js';

export const loadSettings: RequestHandler = async (_req, res, next) => {
	const settings = await getAISettings();

	res.locals['ai'] = {
		settings,
		systemPrompt: settings.systemPrompt,
	};

	return next();
};
