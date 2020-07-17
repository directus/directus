import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as SettingsService from '../services/settings';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_settings'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const records = await SettingsService.readSettings(req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});
		return res.json({ data: records || null });
	})
);

router.patch(
	'/',
	useCollection('directus_settings'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		await SettingsService.updateSettings(req.body, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const record = await SettingsService.readSettings(req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});

		return res.json({ data: record || null });
	})
);

export default router;
