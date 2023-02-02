import { Router } from 'express';
import { ForbiddenException } from '../exceptions';
import { respond } from '../middleware/respond';
import { validateBatch } from '../middleware/validate-batch';
import { CollectionsService, MetaService } from '../services';
import { Item } from '../types';
import asyncHandler from '../utils/async-handler';

const router = Router();

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			const collectionKey = await collectionsService.createMany(req.body);
			const records = await collectionsService.readMany(collectionKey);
			res.locals.payload = { data: records || null };
		} else {
			const collectionKey = await collectionsService.createOne(req.body);
			const record = await collectionsService.readOne(collectionKey);
			res.locals.payload = { data: record || null };
		}

		return next();
	}),
	respond
);

const readHandler = asyncHandler(async (req, res, next) => {
	const collectionsService = new CollectionsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let result: Item[] = [];

	if (req.body.keys) {
		result = await collectionsService.readMany(req.body.keys);
	} else {
		result = await collectionsService.readByQuery();
	}

	const meta = await metaService.getMetaForQuery('directus_collections', {});

	res.locals.payload = { data: result, meta };
	return next();
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

router.get(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const collection = await collectionsService.readOne(req.params.collection);
		res.locals.payload = { data: collection || null };

		return next();
	}),
	respond
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const collectionKeys = await collectionsService.updateBatch(req.body);

		try {
			const collections = await collectionsService.readMany(collectionKeys);
			res.locals.payload = { data: collections || null };
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

router.patch(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await collectionsService.updateOne(req.params.collection, req.body);

		try {
			const collection = await collectionsService.readOne(req.params.collection);
			res.locals.payload = { data: collection || null };
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

router.delete(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await collectionsService.deleteOne(req.params.collection);

		return next();
	}),
	respond
);

export default router;
