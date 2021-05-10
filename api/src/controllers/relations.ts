import express from 'express';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { respond } from '../middleware/respond';
import useCollection from '../middleware/use-collection';
import { validateBatch } from '../middleware/validate-batch';
import { MetaService, RelationsService } from '../services';
import { PrimaryKey } from '../types';
import asyncHandler from '../utils/async-handler';
import validateCollection from '../middleware/collection-exists';
import Joi from 'joi';

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
		res.locals.payload = { data: relations || null };
		return next();
	}),
	respond
);

router.get(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const relations = await service.readAll(req.params.collection);

		res.locals.payload = { data: relations || null };
		return next();
	}),
	respond
);

router.get(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new RelationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const relation = await service.readOne(req.params.collection, req.params.field);

		res.locals.payload = { data: relation || null };
		return next();
	}),
	respond
);

const newRelationSchema = Joi.object({
	collection: Joi.string().required(),
	field: Joi.string().required(),
	related_collection: Joi.string().optional(),
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
			throw new InvalidPayloadException(error.message);
		}

		await service.create(req.body);

		try {
			const createdRelation = await service.readOne(req.body.collection, req.body.field);
			res.locals.payload = { data: createdRelation || null };
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
