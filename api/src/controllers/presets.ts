import express from 'express';
import asyncHandler from 'express-async-handler';
import PresetsService from '../services/presets';
import MetaService from '../services/meta';

const router = express.Router();

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
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
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({ accountability: req.accountability });
		await service.delete(req.params.pk);
		return next();
	})
);

export default router;
