import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import CollectionsService from '../services/collections';
import useCollection from '../middleware/use-collection';
import MetaService from '../services/meta';

const router = Router();

router.post(
	'/',
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });

		const collectionKey = await collectionsService.create(req.body);
		const record = await collectionsService.readByKey(collectionKey);

		res.json({ data: record || null });
	})
);

router.get(
	'/',
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const collections = await collectionsService.readByQuery();
		const meta = await metaService.getMetaForQuery(req.collection, {});

		res.json({ data: collections || null, meta });
	})
);

router.get(
	'/:collection',
	useCollection('directus_collections'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		const collection = await collectionsService.readByKey(collectionKey as any);
		res.json({ data: collection || null });
	})
);

router.patch(
	'/:collection',
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		await collectionsService.update(req.body, collectionKey as any);
		const collection = await collectionsService.readByKey(collectionKey as any);
		res.json({ data: collection || null });
	})
);

router.delete(
	'/:collection',
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		await collectionsService.delete(collectionKey as any);

		res.end();
	})
);

export default router;
