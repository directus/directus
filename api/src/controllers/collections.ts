import { Router } from 'express';
import redis from 'redis';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import cacheMiddleware from '../middleware/cache';
import CollectionsService from '../services/collections';
import CacheService from '../services/node-cache';
import useCollection from '../middleware/use-collection';
import MetaService from '../services/meta';
import env from '../env';

const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

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
	cacheMiddleware,
	asyncHandler(async (req, res) => {
		const key = req.url;
		const TTL = req.query.TTL;
		const TTLnum = Number(TTL);
		const dTTL = Number(req.query.dTTL);
		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const collections = await collectionsService.readByQuery();
		const meta = await metaService.getMetaForQuery(req.collection, {});
		if (TTL) {
			if (env.CACHE_TYPE === 'redis') {
				redisClient.setex(key, TTLnum, JSON.stringify({ data: collections || null, meta }));
			} else {
				const cacheService = new CacheService(TTLnum, dTTL);
				cacheService.setCache(key, JSON.stringify({ data: collections || null, meta }));
			}
		}
		res.json({ data: collections || null, meta });
	})
);

router.get(
	'/:collection',
	useCollection('directus_collections'),
	sanitizeQuery,
	cacheMiddleware,
	asyncHandler(async (req, res) => {
		const key = req.url;
		const TTL = req.query.TTL;
		const TTLnum = Number(TTL);
		const dTTL = Number(req.query.dTTL);

		const collectionsService = new CollectionsService({ accountability: req.accountability });
		const collectionKey = req.params.collection.includes(',')
			? req.params.collection.split(',')
			: req.params.collection;
		const collection = await collectionsService.readByKey(collectionKey as any);
		if (TTL) {
			if (env.CACHE_TYPE === 'redis') {
				redisClient.setex(key, TTLnum, JSON.stringify({ data: collection || null }));
			} else {
				const cacheService = new CacheService(TTLnum, dTTL);
				cacheService.setCache(key, JSON.stringify({ data: collection || null }));
			}
		}

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
