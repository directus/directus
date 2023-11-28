import { isDirectusError } from '@directus/errors';
import express from 'express';
import Joi from 'joi';
import { ErrorCode, InvalidPayloadError } from '@directus/errors';
import validateCollection from '../middleware/collection-exists.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { RelationsService } from '../services/relations.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

router.use(useCollection('directus_relations'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const relations = await service.readAll();
		res.locals['payload'] = { data: relations || null };
		return next();
	}),
	respond,
);

router.get(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const relations = await service.readAll(req.params['collection']);

		res.locals['payload'] = { data: relations || null };
		return next();
	}),
	respond,
);

router.get(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const relation = await service.readOne(req.params['collection']!, req.params['field']!);

		res.locals['payload'] = { data: relation || null };
		return next();
	}),
	respond,
);

const newRelationSchema = Joi.object({
	collection: Joi.string().required(),
	field: Joi.string().required(),
	related_collection: Joi.string().allow(null).optional(),
	schema: Joi.object({
		on_delete: Joi.string().valid('NO ACTION', 'SET NULL', 'SET DEFAULT', 'CASCADE', 'RESTRICT'),
	})
		.unknown()
		.allow(null),
	meta: Joi.any(),
});

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const { error } = newRelationSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		await service.createOne(req.body);

		try {
			const createdRelation = await service.readOne(req.body.collection, req.body.field);
			res.locals['payload'] = { data: createdRelation || null };
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

const updateRelationSchema = Joi.object({
	collection: Joi.string().optional(),
	field: Joi.string().optional(),
	related_collection: Joi.string().allow(null).optional(),
	schema: Joi.object({
		on_delete: Joi.string().valid('NO ACTION', 'SET NULL', 'SET DEFAULT', 'CASCADE', 'RESTRICT'),
	})
		.unknown()
		.allow(null),
	meta: Joi.any(),
});

router.patch(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const { error } = updateRelationSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		await service.updateOne(req.params['collection']!, req.params['field']!, req.body);

		try {
			const updatedField = await service.readOne(req.params['collection']!, req.params['field']!);
			res.locals['payload'] = { data: updatedField || null };
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

router.delete(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, _res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['collection']!, req.params['field']!);
		return next();
	}),
	respond,
);

export default router;
