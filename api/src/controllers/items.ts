import express from 'express';
import asyncHandler from 'express-async-handler';
import ItemsService from '../services/items';
import collectionExists from '../middleware/collection-exists';
import MetaService from '../services/meta';
import { RouteNotFoundException, ForbiddenException } from '../exceptions';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const primaryKey = await service.create(req.body);

		try {
			const result = await service.readByKey(primaryKey, req.sanitizedQuery);
			res.locals.payload = { data: result || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
);

router.get(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = req.singleton
			? await service.readSingleton(req.sanitizedQuery)
			: await service.readByQuery(req.sanitizedQuery);

		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		res.locals.payload = {
			meta: meta,
			data: records || null,
		};
		return next();
	}),
);

router.get(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const result = await service.readByKey(primaryKey as any, req.sanitizedQuery);

		res.locals.payload = {
			data: result || null,
		};
		return next();
	}),
);

router.patch(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService(req.collection, { accountability: req.accountability });

		if (req.singleton === true) {
			await service.upsertSingleton(req.body);
			const item = await service.readSingleton(req.sanitizedQuery);

			res.locals.payload = { data: item || null };
			return next();
		}

		const primaryKeys = await service.update(req.body);

		try {
			const result = await service.readByKey(primaryKeys, req.sanitizedQuery);
			res.locals.payload = { data: result || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
);

router.patch(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;

		const updatedPrimaryKey = await service.update(req.body, primaryKey as any);

		try {
			const result = await service.readByKey(updatedPrimaryKey, req.sanitizedQuery);
			res.locals.payload = { data: result || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);
		return next();
	}),
);

export default router;
