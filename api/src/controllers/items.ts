import express from 'express';
import redis from 'redis';
import asyncHandler from 'express-async-handler';
import ItemsService from '../services/items';
import cacheMiddleware from '../middleware/cache';
import sanitizeQuery from '../middleware/sanitize-query';
import CacheService from '../services/node-cache';
import collectionExists from '../middleware/collection-exists';
import MetaService from '../services/meta';
import { RouteNotFoundException } from '../exceptions';
import env from '../env';

const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const result = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.json({ data: result || null });
	})
);

router.get(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	cacheMiddleware,
	asyncHandler(async (req, res) => {
		const key = req.url;
		const TTL = req.query.TTL;
		const TTLnum = Number(TTL);
		const dTTL = Number(req.query.dTTL);
		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = req.singleton
			? await service.readSingleton(req.sanitizedQuery)
			: await service.readByQuery(req.sanitizedQuery);

		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);
		if (TTL) {
			if (env.CACHE_TYPE === 'redis') {
				redisClient.setex(
					key,
					TTLnum,
					JSON.stringify({ meta: meta, data: records || null })
				);
			} else {
				const cacheService = new CacheService(TTLnum, dTTL);
				cacheService.setCache(key, JSON.stringify({ meta: meta, data: records || null }));
			}
		}
		return res.json({
			meta: meta,
			data: records || null,
		});
	})
);

router.get(
	'/:collection/:pk',
	collectionExists,
	sanitizeQuery,
	cacheMiddleware,
	asyncHandler(async (req, res) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}
		const key = req.url;
		const TTL = req.query.TTL;
		const TTLnum = Number(TTL);
		const dTTL = Number(req.query.dTTL);
		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const result = await service.readByKey(primaryKey as any, req.sanitizedQuery);
		if (TTL) {
			if (env.CACHE_TYPE === 'redis') {
				redisClient.setex(
					key,
					TTLnum,
					JSON.stringify({
						data: result || null,
					})
				);
			} else {
				const cacheService = new CacheService(TTLnum, dTTL);
				cacheService.setCache(
					key,
					JSON.stringify({
						data: result || null,
					})
				);
			}
		}
		return res.json({
			data: result || null,
		});
	})
);

router.patch(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ItemsService(req.collection, { accountability: req.accountability });

		if (req.singleton === true) {
			await service.upsertSingleton(req.body);
			const item = await service.readSingleton(req.sanitizedQuery);

			return res.json({ data: item || null });
		}

		const primaryKeys = await service.update(req.body);
		const result = await service.readByKey(primaryKeys, req.sanitizedQuery);
		return res.json({ data: result || null });
	})
);

router.patch(
	'/:collection/:pk',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;

		const updatedPrimaryKey = await service.update(req.body, primaryKey as any);
		const result = await service.readByKey(updatedPrimaryKey, req.sanitizedQuery);

		res.json({ data: result || null });
	})
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		const service = new ItemsService(req.collection, { accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);

		return res.status(200).end();
	})
);

export default router;
