import express from 'express';
import asyncHandler from '../utils/async-handler';
import { SettingsService } from '../services';
import { ForbiddenException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';

const router = express.Router();

router.use(useCollection('directus_settings'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const records = await service.readSingleton(req.sanitizedQuery);
		res.locals.payload = { data: records || null };
		return next();
	}),
	respond
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});
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
	}),
	respond
);

export default router;
