import express from 'express';
import asyncHandler from 'express-async-handler';
import SettingsService from '../services/settings';

const router = express.Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({ accountability: req.accountability });
		const records = await service.readSingleton(req.sanitizedQuery);
		res.locals.payload = { data: records || null };
		return next();
	})
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({ accountability: req.accountability });
		await service.upsertSingleton(req.body);
		const record = await service.readSingleton(req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	})
);

export default router;
