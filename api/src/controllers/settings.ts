import express from 'express';
import asyncHandler from 'express-async-handler';
import SettingsService from '../services/settings';
import { ForbiddenException } from '../exceptions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_settings'));

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

		try {
			const record = await service.readSingleton(req.sanitizedQuery);
			res.locals.payload = { data: record || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	})
);

export default router;
