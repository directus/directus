import express from 'express';
import asyncHandler from 'express-async-handler';
import PresetsService from '../services/presets';
import MetaService from '../services/meta';
import { ForbiddenException } from '../exceptions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_presets'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);

		try {
			const record = await service.readByKey(primaryKey, req.sanitizedQuery);
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

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_presets', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	})
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const record = await service.readByKey(pk as any, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const primaryKey = await service.update(req.body, pk as any);

		try {
			const record = await service.readByKey(primaryKey, req.sanitizedQuery);
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

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);
		return next();
	})
);

export default router;
