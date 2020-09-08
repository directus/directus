import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import CollectionsService from '../services/collections'
import MetaService from '../services/meta';

const router = Router();

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });

		const collectionKey = await collectionsService.create(req.body);
		const record = await collectionsService.readByKey(collectionKey);

		res.locals.payload = { data: record || null };
		return next();
	})
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const collections = await collectionsService.readByQuery();
		const meta = await metaService.getMetaForQuery('directus_collections', {});

		res.locals.payload = { data: collections || null, meta };
		return next();
	})
);

router.get(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		const collection = await collectionsService.readByKey(collectionKey as any);

		res.locals.payload = { data: collection || null };
		return next();
	})
);

router.patch(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		await collectionsService.update(req.body, collectionKey as any);
		const collection = await collectionsService.readByKey(collectionKey as any);
		res.locals.payload = { data: collection || null };
		return next();
	})
);

router.delete(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		await collectionsService.delete(collectionKey as any);

		return next();
	})
);

export default router;
