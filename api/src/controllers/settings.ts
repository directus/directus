import { ErrorCode, ForbiddenError, isDirectusError } from '@directus/errors';
import { isObject } from '@directus/utils';
import express from 'express';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { SettingsService } from '../services/settings.js';
import asyncHandler from '../utils/async-handler.js';

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
		res.locals['payload'] = { data: records || null };
		return next();
	}),
	respond,
);

router.post(
	'/owner',
	asyncHandler(async (req, _res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.setOwner(req.body);

		return next();
	}),
	respond,
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (isObject(req.body) && ('license_key' in req.body || 'license_token' in req.body)) {
			throw new ForbiddenError({
				reason: `${'license_key' in req.body ? 'license_key' : 'license_token'} cannot be set via settings. Use the /license endpoint to manage your license.`,
			});
		}

		await service.upsertSingleton(req.body);

		try {
			const record = await service.readSingleton(req.sanitizedQuery);
			res.locals['payload'] = { data: record || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

export default router;
