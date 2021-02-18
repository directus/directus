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

		const collectionKey = await collectionsService.create(req.body);
		const record = await collectionsService.readByKey(collectionKey);

		res.locals.payload = { data: record || null };
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
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;

		const collection = await collectionsService.readByKey(collectionKey as any);
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
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		await collectionsService.update(req.body, collectionKey as any);

		try {
			const collection = await collectionsService.readByKey(collectionKey as any);
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

		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;

		await collectionsService.delete(collectionKey as any);

		return next();
	}),
	respond
);

export default router;
