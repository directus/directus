import express from 'express';
import asyncHandler from '../utils/async-handler';
import { PresetsService, MetaService } from '../services';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';
import { PrimaryKey } from '../types';

const router = express.Router();

router.use(useCollection('directus_presets'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({
			accountability: req.accountability,
			schema: req.schema,
		});
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
	}),
	respond
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_presets', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const record = await service.readByKey(pk as any, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({
			accountability: req.accountability,
			schema: req.schema,
		});
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
	}),
	respond
);

router.delete(
	'/',
	asyncHandler(async (req, res, next) => {
		if (!req.body || Array.isArray(req.body) === false) {
			throw new InvalidPayloadException(`Body has to be an array of primary keys`);
		}

		const service = new PresetsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.delete(req.body as PrimaryKey[]);
		return next();
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PresetsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);
		return next();
	}),
	respond
);

export default router;
