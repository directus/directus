import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as SettingsService from '../services/settings';

const router = express.Router();

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await SettingsService.readSettings(1, res.locals.query);
		return res.json({ data: records });
	})
);

router.patch(
	'/',
	asyncHandler(async (req, res) => {
		const records = await SettingsService.updateSettings(
			req.params.pk /** @TODO Singleton */,
			req.body,
			res.locals.query
		);
		return res.json({ data: records });
	})
);

export default router;
