import express from 'express';
import asyncHandler from '../utils/async-handler';
import { FoldersService, MetaService } from '../services';
import { ForbiddenException, InvalidPayloadException, FailedValidationException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';
import { PrimaryKey } from '../types';
import Joi from 'joi';

const router = express.Router();

router.use(useCollection('directus_folders'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new FoldersService({
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
		const service = new FoldersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_files', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new FoldersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const service = new FoldersService({
			accountability: req.accountability,
			schema: req.schema,
		});

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
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new FoldersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const primaryKey = await service.update(req.body, req.params.pk);

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

		const service = new FoldersService({
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
		const service = new FoldersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.delete(req.params.pk);

		return next();
	}),
	respond
);

export default router;
