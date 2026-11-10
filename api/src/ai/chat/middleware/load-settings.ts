import type { RequestHandler } from 'express';
import { getAISettings } from '../../providers/settings.js';

export const loadSettings: RequestHandler = async (req, res, next) => {
	res.locals['ai'] = { settings: await getAISettings({ schema: req.schema }) };

	return next();
};
