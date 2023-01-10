import express from 'express';
import { ForbiddenException } from '../exceptions';
import { respond } from '../middleware/respond';
import useCollection from '../middleware/use-collection';
import { SettingsService, ItemsService } from '../services';
import asyncHandler from '../utils/async-handler';

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
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.get(
	'/translation-strings',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const records = await service.readSingleton({
			fields: ['translations'],
			alias: {
				translations: 'json(translation_strings2$[*])',
			},
			deep: {
				translations: {
					_filter: {
						'$.lang': { _eq: 'nl-NL' },
					},
				},
			},
		});
		const strings = records.translations.reduce((a: Record<string, any>, c: any) => {
			if (!a[c.key]) a[c.key] = {};
			a[c.key][c.lang] = c.value;
			return a;
		}, {} as Record<string, any>);
		const translation_strings = Object.entries(strings).map(([key, translations]) => ({ key, translations }));
		res.locals.payload = { data: { translation_strings } };
		return next();
	}),
	respond
);

export default router;
