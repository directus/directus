import express from 'express';
import { ForbiddenException } from '../exceptions';
import { respond } from '../middleware/respond';
import useCollection from '../middleware/use-collection';
import { validateBatch } from '../middleware/validate-batch';
import { MetaService, RelationsService } from '../services';
import { PrimaryKey } from '../types';
import asyncHandler from '../utils/async-handler';
import validateCollection from '../middleware/collection-exists';

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

export default router;
