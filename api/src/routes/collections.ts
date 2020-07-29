import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import CollectionsService from '../services/collections';
import { schemaInspector } from '../database';
import { CollectionNotFoundException } from '../exceptions';
import useCollection from '../middleware/use-collection';

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
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collections = await collectionsService.readByQuery(req.sanitizedQuery);

		res.json({ data: collections || null });
	})
);

router.get(
	'/:collection',
	useCollection('directus_collections'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		/** @todo move this validation to CollectionsService methods */
		const exists = await schemaInspector.hasTable(req.params.collection);
		if (exists === false) throw new CollectionNotFoundException(req.params.collection);

		const collectionsService = new CollectionsService({ accountability: req.accountability });

		const collection = await collectionsService.readByKey(
			req.params.collection,
			req.sanitizedQuery
		);

		res.json({ data: collection || null });
	})
);

router.delete(
	'/:collection',
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		/** @todo move this validation to CollectionsService methods */
		if ((await schemaInspector.hasTable(req.params.collection)) === false) {
			throw new CollectionNotFoundException(req.params.collection);
		}

		const collectionsService = new CollectionsService({ accountability: req.accountability });
		await collectionsService.delete(req.params.collection);

		res.end();
	})
);

export default router;
