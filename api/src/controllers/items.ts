import express from 'express';
import asyncHandler from '../utils/async-handler';
import collectionExists from '../middleware/collection-exists';
import { ItemsService, MetaService } from '../services';
import { RouteNotFoundException, ForbiddenException, FailedValidationException } from '../exceptions';
import { respond } from '../middleware/respond';
import { InvalidPayloadException } from '../exceptions';
import { PrimaryKey } from '../types';
import Joi from 'joi';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

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
	respond
);

router.get(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

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
	respond
);

router.get(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});
		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const result = await service.readByKey(primaryKey as any, req.sanitizedQuery);

		res.locals.payload = {
			data: result || null,
		};
		return next();
	}),
	respond
);

router.patch(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		if (req.singleton === true) {
			await service.upsertSingleton(req.body);
			const item = await service.readSingleton(req.sanitizedQuery);

			res.locals.payload = { data: item || null };
			return next();
		}

		if (Array.isArray(req.body)) {
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
		}

		const updateSchema = Joi.object({
			keys: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())).required(),
			data: Joi.object().required().unknown(),
		});

		const { error } = updateSchema.validate(req.body);

		if (error) {
			throw new FailedValidationException(error.details[0]);
		}

		const primaryKeys = await service.update(req.body.data, req.body.keys);

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
	respond
);

router.patch(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});
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
	respond
);

router.delete(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (!req.body || Array.isArray(req.body) === false) {
			throw new InvalidPayloadException(`Body has to be an array of primary keys`);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.delete(req.body as PrimaryKey[]);
		return next();
	}),
	respond
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		const service = new ItemsService(req.collection, {
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
