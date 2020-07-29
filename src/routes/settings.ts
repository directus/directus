import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import useCollection from '../middleware/use-collection';
import SettingsService from '../services/settings';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_settings'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new SettingsService({ accountability: req.accountability });
		const records = await service.readSingleton(req.sanitizedQuery);
		return res.json({ data: records || null });
	})
);

router.patch(
	'/',
	useCollection('directus_settings'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new SettingsService({ accountability: req.accountability });
		await service.upsertSingleton(req.body);
		const record = await service.readSingleton(req.sanitizedQuery);

		return res.json({ data: record || null });
	})
);

export default router;
