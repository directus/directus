import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { CollectionsService, MetaService } from '../services';
import { ForbiddenException } from '../exceptions';
import { respond } from '../middleware/respond';

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

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const collections = await collectionsService.readByQuery();
		const meta = await metaService.getMetaForQuery('directus_collections', {});

		res.locals.payload = { data: collections || null, meta };
		return next();
	}),
	respond
);

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
