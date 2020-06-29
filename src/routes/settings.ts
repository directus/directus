import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as SettingsService from '../services/settings';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_settings'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await SettingsService.readSettings(1, res.locals.query);
		return res.json({ data: records });
	})
);

router.patch(
	'/',
	useCollection('directus_settings'),
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
